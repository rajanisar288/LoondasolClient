import { Injectable, inject, signal } from '@angular/core';
import { SocketService, IncomingCallEvent, CallAcceptedEvent } from './socket.service';
import { Subscription } from 'rxjs';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected';
export type CallType = 'video' | 'audio';

@Injectable({
  providedIn: 'root',
})
export class WebRtcService {
  private readonly socketService = inject(SocketService);

  readonly callState = signal<CallState>('idle');
  readonly callType = signal<CallType>('video');
  readonly currentCallId = signal<string | null>(null);
  readonly peerId = signal<string | null>(null);
  readonly peerName = signal<string | null>(null);
  readonly isMuted = signal<boolean>(false);
  readonly isVideoOff = signal<boolean>(false);
  readonly isScreenSharing = signal<boolean>(false);
  readonly callDuration = signal<number>(0);

  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);

  private peerConnection: RTCPeerConnection | null = null;
  private pendingOffer: any = null;
  private timerInterval: any = null;
  private ringtoneInterval: any = null;
  private audioContext: AudioContext | null = null;

  private subs: Subscription[] = [];

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor() {
    this.initSocketListeners();
  }

  private initSocketListeners(): void {
    // Incoming call received
    this.subs.push(
      this.socketService.incomingCall$.subscribe((event: IncomingCallEvent) => {
        if (this.callState() !== 'idle') {
          // Send busy rejection
          this.socketService.rejectCall(event.callId, event.callerId, 'busy');
          return;
        }

        this.currentCallId.set(event.callId);
        this.peerId.set(event.callerId);
        this.peerName.set(event.callerName);
        this.callType.set(event.callType);
        this.pendingOffer = event.offer;
        this.callState.set('incoming');
        this.playRingtone();
      }),
    );

    // Call accepted by peer
    this.subs.push(
      this.socketService.callAccepted$.subscribe(async (event: CallAcceptedEvent) => {
        if (this.peerConnection && event.answer) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(event.answer));
          } catch (e) {
            console.error('Error setting remote description:', e);
          }
        }
        this.stopRingtone();
        this.callState.set('connected');
        this.startTimer();
      }),
    );

    // Call rejected by peer
    this.subs.push(
      this.socketService.callRejected$.subscribe(() => {
        this.stopRingtone();
        this.cleanup();
      }),
    );

    // Call ended by peer
    this.subs.push(
      this.socketService.callEnded$.subscribe(() => {
        this.stopRingtone();
        this.cleanup();
      }),
    );

    // ICE candidate received
    this.subs.push(
      this.socketService.iceCandidate$.subscribe(async ({ candidate }) => {
        if (this.peerConnection && candidate) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      }),
    );
  }

  // Initiates 1v1 audio or video call
  async startCall(
    receiverId: string,
    receiverName: string,
    type: CallType = 'video',
  ): Promise<void> {
    try {
      this.callType.set(type);
      this.peerId.set(receiverId);
      this.peerName.set(receiverName);
      this.callState.set('calling');
      this.playRingtone();

      const stream = await this.acquireUserMedia(type === 'video');
      this.localStream.set(stream);

      this.peerConnection = this.createPeerConnection(receiverId);
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socketService.initiateCall(receiverId, type, offer);
    } catch (err) {
      console.error('Failed to start call:', err);
      this.stopRingtone();
      this.cleanup();
    }
  }

  // Accepts an incoming call
  async acceptIncomingCall(): Promise<void> {
    this.stopRingtone();
    const callerId = this.peerId();
    const callId = this.currentCallId();
    if (!callerId || !callId) return;

    try {
      const stream = await this.acquireUserMedia(this.callType() === 'video');
      this.localStream.set(stream);

      this.peerConnection = this.createPeerConnection(callerId);
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
      });

      if (this.pendingOffer) {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(this.pendingOffer),
        );
      }

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socketService.acceptCall(callId, callerId, answer);
      this.callState.set('connected');
      this.startTimer();
    } catch (err) {
      console.error('Failed to accept call:', err);
      this.cleanup();
    }
  }

  // Declines an incoming call
  rejectIncomingCall(): void {
    this.stopRingtone();
    const callId = this.currentCallId();
    const callerId = this.peerId();
    if (callId && callerId) {
      this.socketService.rejectCall(callId, callerId, 'declined');
    }
    this.cleanup();
  }

  // Ends current active or dialing call
  endCurrentCall(): void {
    this.stopRingtone();
    const callId = this.currentCallId();
    const peer = this.peerId();
    if (callId && peer) {
      this.socketService.endCall(callId, peer);
    }
    this.cleanup();
  }

  // Toggle microphone mute
  toggleMute(): void {
    const stream = this.localStream();
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        this.isMuted.set(!enabled);
      }
    }
  }

  // Toggle video camera
  toggleVideo(): void {
    const stream = this.localStream();
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks[0].enabled = enabled;
        this.isVideoOff.set(!enabled);
      }
    }
  }

  // Toggle screen sharing
  async toggleScreenShare(): Promise<void> {
    if (this.isScreenSharing()) {
      // Revert to camera
      const cameraStream = await this.acquireUserMedia(true);
      const videoTrack = cameraStream.getVideoTracks()[0];
      this.replaceVideoTrack(videoTrack);
      this.isScreenSharing.set(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          this.toggleScreenShare();
        };
        this.replaceVideoTrack(screenTrack);
        this.isScreenSharing.set(true);
      } catch {
        // User cancelled picker
      }
    }
  }

  private replaceVideoTrack(newTrack: MediaStreamTrack): void {
    if (!this.peerConnection) return;
    const senders = this.peerConnection.getSenders();
    const sender = senders.find((s) => s.track && s.track.kind === 'video');
    if (sender) {
      sender.replaceTrack(newTrack);
    }
    const currentStream = this.localStream();
    if (currentStream) {
      const oldTrack = currentStream.getVideoTracks()[0];
      if (oldTrack) {
        currentStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      currentStream.addTrack(newTrack);
      this.localStream.set(currentStream);
    }
  }

  private createPeerConnection(targetUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.sendIceCandidate(targetUserId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream.set(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.cleanup();
      }
    };

    return pc;
  }

  private async acquireUserMedia(video: boolean): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.callDuration.set(0);
    this.timerInterval = setInterval(() => {
      this.callDuration.update((d) => d + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Web Audio API Ringtone generator (Zero external media files needed)
  private playRingtone(): void {
    this.stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();

      const playTone = () => {
        if (!this.audioContext || this.audioContext.state === 'closed') return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1.2);
      };

      playTone();
      this.ringtoneInterval = setInterval(playTone, 2500);
    } catch {
      // AudioContext autonavigation policy
    }
  }

  private stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  private cleanup(): void {
    this.stopTimer();
    this.stopRingtone();

    if (this.localStream()) {
      this.localStream()
        ?.getTracks()
        .forEach((track) => track.stop());
      this.localStream.set(null);
    }
    this.remoteStream.set(null);

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callState.set('idle');
    this.currentCallId.set(null);
    this.peerId.set(null);
    this.peerName.set(null);
    this.isMuted.set(false);
    this.isVideoOff.set(false);
    this.isScreenSharing.set(false);
    this.pendingOffer = null;
  }
}
