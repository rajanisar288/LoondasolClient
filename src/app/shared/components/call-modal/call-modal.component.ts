import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRtcService } from '../../../core/services/webrtc.service';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (webrtcService.callState() === 'incoming') {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in"
      >
        <div
          class="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-6"
        >
          <div class="relative inline-block mx-auto">
            <div class="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping"></div>
            <div
              class="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#2A65F6] to-blue-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            >
              {{ webrtcService.peerName() ? webrtcService.peerName()![0].toUpperCase() : 'U' }}
            </div>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ webrtcService.peerName() || 'Colleague' }}
            </h3>
            <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Incoming {{ webrtcService.callType() === 'video' ? 'Video' : 'Audio' }} Call...
            </p>
          </div>

          <div class="flex items-center justify-center space-x-6 pt-2">
            <button
              type="button"
              (click)="webrtcService.rejectIncomingCall()"
              class="flex flex-col items-center space-y-1 group"
            >
              <div
                class="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition transform group-hover:scale-105"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                  />
                </svg>
              </div>
              <span class="text-xs text-slate-500">Decline</span>
            </button>

            <button
              type="button"
              (click)="webrtcService.acceptIncomingCall()"
              class="flex flex-col items-center space-y-1 group"
            >
              <div
                class="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition transform group-hover:scale-105 animate-bounce"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span class="text-xs text-slate-500">Accept</span>
            </button>
          </div>
        </div>
      </div>
    }

    @if (webrtcService.callState() === 'calling') {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in"
      >
        <div
          class="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-6"
        >
          <div class="relative inline-block mx-auto">
            <div class="absolute -inset-3 rounded-full bg-blue-500/20 animate-ping"></div>
            <div
              class="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#2A65F6] to-blue-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            >
              {{ webrtcService.peerName() ? webrtcService.peerName()![0].toUpperCase() : 'U' }}
            </div>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Calling {{ webrtcService.peerName() || 'Colleague' }}...
            </h3>
            <p class="text-xs text-slate-400">Waiting for answer</p>
          </div>

          <div class="flex items-center justify-center pt-2">
            <button
              type="button"
              (click)="webrtcService.endCurrentCall()"
              class="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105"
              title="Cancel Call"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }

    @if (webrtcService.callState() === 'connected') {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      >
        <div
          class="relative w-full max-w-4xl h-[85vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
        >
          <div
            class="h-14 px-6 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between z-10"
          >
            <div class="flex items-center space-x-3">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-sm font-semibold text-white">
                {{ webrtcService.peerName() || 'Call in progress' }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                {{ formatDuration(webrtcService.callDuration()) }}
              </span>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {{ webrtcService.callType() }} Call
              </span>
            </div>
          </div>

          <div
            class="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden"
          >
            <video
              #remoteVideo
              autoplay
              playsinline
              class="w-full h-full object-cover"
              [class.hidden]="webrtcService.callType() === 'audio'"
            ></video>

            @if (webrtcService.callType() === 'audio') {
              <div class="flex flex-col items-center justify-center space-y-4 text-center">
                <div
                  class="w-28 h-28 rounded-full bg-[#2A65F6] flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-8 ring-blue-500/20"
                >
                  {{ webrtcService.peerName() ? webrtcService.peerName()![0].toUpperCase() : 'U' }}
                </div>
                <h4 class="text-lg font-bold text-white">{{ webrtcService.peerName() }}</h4>
                <p class="text-xs text-slate-400">Audio call connected</p>
              </div>
            }

            <div
              class="absolute bottom-4 right-4 w-44 h-32 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-xl"
              [class.hidden]="webrtcService.callType() === 'audio'"
            >
              <video
                #localVideo
                autoplay
                playsinline
                muted
                class="w-full h-full object-cover"
              ></video>
              @if (webrtcService.isVideoOff()) {
                <div
                  class="absolute inset-0 bg-slate-900 flex items-center justify-center text-xs text-slate-400 font-medium"
                >
                  Camera Off
                </div>
              }
            </div>
          </div>

          <div
            class="h-20 bg-slate-950/90 border-t border-slate-800/80 px-6 flex items-center justify-center space-x-4 z-10"
          >
            <button
              type="button"
              (click)="webrtcService.toggleMute()"
              [class]="
                webrtcService.isMuted()
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              "
              class="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center transition"
              [title]="webrtcService.isMuted() ? 'Unmute microphone' : 'Mute microphone'"
            >
              @if (webrtcService.isMuted()) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 19l-4-4m0 0l-4-4m4 4l-4 4m4-4l4-4M12 3v10m-4-2a4 4 0 008 0m-4 6v4m-5-2h10"
                  />
                </svg>
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              }
            </button>

            @if (webrtcService.callType() === 'video') {
              <button
                type="button"
                (click)="webrtcService.toggleVideo()"
                [class]="
                  webrtcService.isVideoOff()
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                "
                class="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center transition"
                [title]="webrtcService.isVideoOff() ? 'Turn camera on' : 'Turn camera off'"
              >
                @if (webrtcService.isVideoOff()) {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                }
              </button>

              <button
                type="button"
                (click)="webrtcService.toggleScreenShare()"
                [class]="
                  webrtcService.isScreenSharing()
                    ? 'bg-blue-500/20 text-[#2A65F6] border-blue-500/40'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                "
                class="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center transition"
                title="Share Screen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
            }

            <button
              type="button"
              (click)="webrtcService.endCurrentCall()"
              class="w-14 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition"
              title="End Call"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CallModalComponent {
  readonly webrtcService = inject(WebRtcService);

  @ViewChild('remoteVideo') set remoteVideoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && el.nativeElement && this.webrtcService.remoteStream()) {
      el.nativeElement.srcObject = this.webrtcService.remoteStream();
    }
  }

  @ViewChild('localVideo') set localVideoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && el.nativeElement && this.webrtcService.localStream()) {
      el.nativeElement.srcObject = this.webrtcService.localStream();
    }
  }

  constructor() {
    // Attach stream whenever streams update
    effect(() => {
      const rStream = this.webrtcService.remoteStream();
      const lStream = this.webrtcService.localStream();
      // Effects track stream reactivity
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
