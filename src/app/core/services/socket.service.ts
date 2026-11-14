import { Injectable, inject, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { TokenService } from './token.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface ChatMessageAttachment {
  url: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export interface ChatMessageReply {
  messageId: string;
  senderId: string;
  senderName: string;
  content?: string;
  attachmentName?: string;
}

export interface ChatMessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  messageId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content?: string;
  type?: 'TEXT' | 'VOICE' | 'IMAGE' | 'FILE';
  audioDurationSeconds?: number;
  recipientId?: string;
  isDirect?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string;
  attachments?: ChatMessageAttachment[];
  replyTo?: ChatMessageReply;
  reactions?: ChatMessageReaction[];
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface RealtimeNotification {
  notificationId: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface IncomingCallEvent {
  callId: string;
  callerId: string;
  callerName: string;
  callType: 'video' | 'audio';
  offer?: any;
}

export interface CallAcceptedEvent {
  callId: string;
  receiverId: string;
  receiverName: string;
  answer?: any;
}

export interface TypingEvent {
  userId: string;
  userName?: string;
  channelId?: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly tokenService = inject(TokenService);
  private readonly api = inject(ApiService);
  private readonly ngZone = inject(NgZone);
  private socket: Socket | null = null;

  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly notificationSubject = new Subject<RealtimeNotification>();
  private readonly typingSubject = new Subject<TypingEvent>();
  private readonly onlineUsersSubject = new BehaviorSubject<string[]>([]);
  private readonly userOnlineSubject = new Subject<{ userId: string; isOnline?: boolean; lastSeen?: string }>();
  private readonly userOfflineSubject = new Subject<{ userId: string; isOnline?: boolean; lastSeen?: string }>();
  private readonly channelCreatedSubject = new Subject<any>();

  private readonly incomingCallSubject = new Subject<IncomingCallEvent>();
  private readonly callAcceptedSubject = new Subject<CallAcceptedEvent>();
  private readonly callRejectedSubject = new Subject<{ callId: string; reason?: string }>();
  private readonly callEndedSubject = new Subject<{ callId: string }>();
  private readonly iceCandidateSubject = new Subject<{ candidate: any; senderId: string }>();

  private readonly messageEditedSubject = new Subject<ChatMessage>();
  private readonly messageDeletedSubject = new Subject<{
    messageId: string;
    channelId: string;
    recipientId?: string;
  }>();

  private readonly meetingPeerJoinedSubject = new Subject<{ userId: string; userName: string }>();
  private readonly meetingPeerLeftSubject = new Subject<{ userId: string }>();
  private readonly meetingSignalSubject = new Subject<{
    senderId: string;
    senderName: string;
    signal: any;
  }>();

  readonly messages$ = this.messageSubject.asObservable();
  readonly notifications$ = this.notificationSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();
  readonly onlineUsers$ = this.onlineUsersSubject.asObservable();
  readonly userOnline$ = this.userOnlineSubject.asObservable();
  readonly userOffline$ = this.userOfflineSubject.asObservable();
  readonly channelCreated$ = this.channelCreatedSubject.asObservable();

  readonly incomingCall$ = this.incomingCallSubject.asObservable();
  readonly callAccepted$ = this.callAcceptedSubject.asObservable();
  readonly callRejected$ = this.callRejectedSubject.asObservable();
  readonly callEnded$ = this.callEndedSubject.asObservable();
  readonly iceCandidate$ = this.iceCandidateSubject.asObservable();

  readonly messageEdited$ = this.messageEditedSubject.asObservable();
  readonly messageDeleted$ = this.messageDeletedSubject.asObservable();
  private readonly messagePinnedSubject = new Subject<ChatMessage>();
  readonly messagePinned$ = this.messagePinnedSubject.asObservable();
  private readonly messageReactedSubject = new Subject<ChatMessage>();
  readonly messageReacted$ = this.messageReactedSubject.asObservable();

  readonly meetingPeerJoined$ = this.meetingPeerJoinedSubject.asObservable();
  readonly meetingPeerLeft$ = this.meetingPeerLeftSubject.asObservable();
  readonly meetingSignal$ = this.meetingSignalSubject.asObservable();

  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  connect(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const socketEndpoint = `${environment.socketUrl}/chat`;
    this.socket = io(socketEndpoint, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    this.socket.on('connect_error', () => {
      // Serverless hosting environments like Vercel do not maintain open TCP/WebSocket connections.
      // Chat functionality gracefully degrades to REST fallback.
    });

    this.socket.on('newMessage', (message: ChatMessage) => {
      this.ngZone.run(() => this.messageSubject.next(message));
    });

    this.socket.on('channelCreated', (channel: any) => {
      this.ngZone.run(() => this.channelCreatedSubject.next(channel));
    });

    this.socket.on('messageEdited', (message: ChatMessage) => {
      this.ngZone.run(() => this.messageEditedSubject.next(message));
    });
    this.socket.on(
      'messageDeleted',
      (event: { messageId: string; channelId: string; recipientId?: string }) => {
        this.ngZone.run(() => this.messageDeletedSubject.next(event));
      },
    );

    this.socket.on('notification:new', (notification: RealtimeNotification) => {
      this.ngZone.run(() => this.notificationSubject.next(notification));
    });

    this.socket.on('userTyping', (event: TypingEvent) => {
      this.ngZone.run(() => this.typingSubject.next(event));
    });

    this.socket.on('onlineUsersSnapshot', (users: string[]) => {
      this.ngZone.run(() => this.onlineUsersSubject.next(users || []));
    });
    this.socket.on('userOnline', (event: { userId: string; isOnline?: boolean; lastSeen?: string }) => {
      this.ngZone.run(() => {
        const current = new Set(this.onlineUsersSubject.value);
        if (event?.userId) {
          current.add(event.userId);
          this.onlineUsersSubject.next(Array.from(current));
        }
        this.userOnlineSubject.next(event);
      });
    });
    this.socket.on('userOffline', (event: { userId: string; isOnline?: boolean; lastSeen?: string }) => {
      this.ngZone.run(() => {
        const current = new Set(this.onlineUsersSubject.value);
        if (event?.userId) {
          current.delete(event.userId);
          this.onlineUsersSubject.next(Array.from(current));
        }
        this.userOfflineSubject.next(event);
      });
    });

    this.socket.on('call:incoming', (event: IncomingCallEvent) => {
      this.ngZone.run(() => this.incomingCallSubject.next(event));
    });
    this.socket.on('call:accepted', (event: CallAcceptedEvent) => {
      this.ngZone.run(() => this.callAcceptedSubject.next(event));
    });
    this.socket.on('call:rejected', (event: { callId: string; reason?: string }) => {
      this.ngZone.run(() => this.callRejectedSubject.next(event));
    });
    this.socket.on('call:ended', (event: { callId: string }) => {
      this.ngZone.run(() => this.callEndedSubject.next(event));
    });
    this.socket.on('call:ice-candidate', (event: { candidate: any; senderId: string }) => {
      this.ngZone.run(() => this.iceCandidateSubject.next(event));
    });

    this.socket.on('meeting:peer-joined', (event: { userId: string; userName: string }) => {
      this.ngZone.run(() => this.meetingPeerJoinedSubject.next(event));
    });
    this.socket.on('meeting:peer-left', (event: { userId: string }) => {
      this.ngZone.run(() => this.meetingPeerLeftSubject.next(event));
    });
    this.socket.on(
      'meeting:signal',
      (event: { senderId: string; senderName: string; signal: any }) => {
        this.ngZone.run(() => this.meetingSignalSubject.next(event));
      },
    );

    this.socket.on('messagePinned', (message: ChatMessage) => {
      this.ngZone.run(() => this.messagePinnedSubject.next(message));
    });

    this.socket.on('messageReacted', (message: ChatMessage) => {
      this.ngZone.run(() => this.messageReactedSubject.next(message));
    });
  }

  sendMessage(
    content: string,
    channelId?: string,
    recipientId?: string,
    attachments?: ChatMessageAttachment[],
    type?: string,
    audioDurationSeconds?: number,
    replyTo?: ChatMessageReply,
    mentions?: string[],
  ): void {
    const payload = {
      content,
      channelId,
      recipientId,
      attachments,
      type,
      audioDurationSeconds,
      replyTo,
      mentions,
    };

    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', payload);
    } else {
      // Seamless REST fallback when WebSocket connection is unavailable (e.g. Vercel serverless)
      this.api.post<ChatMessage>('chat/messages', payload).subscribe({
        next: (savedMessage) => {
          this.ngZone.run(() => {
            this.messageSubject.next(savedMessage);
          });
        },
        error: (err) => {
          console.error('Failed to send message via REST fallback:', err);
        },
      });
    }
  }

  pinMessage(messageId: string, channelId?: string, recipientId?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('pinMessage', { messageId, channelId, recipientId });
    } else {
      this.api.post<ChatMessage>(`chat/messages/${messageId}/pin`, {}).subscribe({
        next: (pinnedMsg) => {
          this.ngZone.run(() => {
            this.messagePinnedSubject.next(pinnedMsg);
          });
        },
        error: (err) => console.error('Failed to pin message via REST:', err),
      });
    }
  }

  reactMessage(messageId: string, emoji: string, channelId?: string, recipientId?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('reactMessage', { messageId, emoji, channelId, recipientId });
    } else {
      this.api.post<ChatMessage>(`chat/messages/${messageId}/react`, { emoji }).subscribe({
        next: (updatedMsg) => {
          this.ngZone.run(() => {
            this.messageReactedSubject.next(updatedMsg);
          });
        },
        error: (err) => console.error('Failed to react via REST:', err),
      });
    }
  }

  // Send typing indicator
  sendTyping(isTyping: boolean, channelId?: string, recipientId?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { isTyping, channelId, recipientId });
    }
  }

  // Edit an existing message
  editMessage(messageId: string, content: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('editMessage', { messageId, content });
    } else {
      this.api.patch<ChatMessage>(`chat/messages/${messageId}`, { content }).subscribe({
        next: (updatedMsg) => {
          this.ngZone.run(() => {
            this.messageEditedSubject.next(updatedMsg);
          });
        },
        error: (err) => console.error('Failed to edit message via REST:', err),
      });
    }
  }

  // Delete an existing message
  deleteMessage(messageId: string, channelId?: string, recipientId?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('deleteMessage', { messageId });
    } else {
      this.api.delete<{ success: boolean; messageId: string }>(`chat/messages/${messageId}`).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.messageDeletedSubject.next({
              messageId,
              channelId: channelId || '',
              recipientId,
            });
          });
        },
        error: (err) => console.error('Failed to delete message via REST:', err),
      });
    }
  }

  // WebRTC: Initiate call
  initiateCall(receiverId: string, callType: 'video' | 'audio', offer?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:initiate', { receiverId, callType, offer });
    }
  }

  // WebRTC: Accept call
  acceptCall(callId: string, callerId: string, answer?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:accept', { callId, callerId, answer });
    }
  }

  // WebRTC: Reject call
  rejectCall(callId: string, callerId: string, reason?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:reject', { callId, callerId, reason });
    }
  }

  // WebRTC: End call
  endCall(callId: string, peerId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:end', { callId, peerId });
    }
  }

  // WebRTC: Send ICE candidate
  sendIceCandidate(peerId: string, candidate: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call:ice-candidate', { peerId, candidate });
    }
  }

  // Meeting Room: Join room
  joinMeeting(roomId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('meeting:join', { roomId });
    }
  }

  // Meeting Room: Leave room
  leaveMeeting(roomId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('meeting:leave', { roomId });
    }
  }

  // Meeting Room: Relay WebRTC signal
  sendMeetingSignal(roomId: string, targetUserId: string, signal: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('meeting:signal', { roomId, targetUserId, signal });
    }
  }

  /** Requests a fresh online users snapshot from the chat gateway. */
  requestOnlineUsers(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('getOnlineUsers');
    }
  }

  /** Emits explicit logout presence event and disconnects the active socket. */
  disconnect(): void {
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('userLogout');
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.onlineUsersSubject.next([]);
  }
}
