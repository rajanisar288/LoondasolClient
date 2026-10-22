import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SocketService, RealtimeNotification } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);

  readonly notifications = signal<RealtimeNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isDropdownOpen = signal<boolean>(false);

  constructor() {
    this.initSocketListener();
  }

  private initSocketListener(): void {
    this.socketService.notifications$.subscribe((notif) => {
      this.notifications.update((list) => [notif, ...list]);
      this.unreadCount.update((c) => c + 1);
      this.playChime();
    });
  }

  // Load notifications and initial unread counter from REST API
  loadNotifications(): void {
    this.api.get<RealtimeNotification[]>('notifications', { limit: 30 }).subscribe({
      next: (items) => {
        this.notifications.set(items || []);
        const unread = (items || []).filter((n) => !n.isRead).length;
        this.unreadCount.set(unread);
      },
      error: () => {},
    });
  }

  // Mark specific notification as read
  markAsRead(notificationId: string): void {
    this.api.patch(`notifications/${notificationId}/read`, {}).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n)),
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
      },
      error: () => {},
    });
  }

  // Mark all user notifications as read
  markAllAsRead(): void {
    this.api.patch('notifications/read-all', {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      },
      error: () => {},
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
    if (this.isDropdownOpen() && this.notifications().length === 0) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  // Web Audio subtle chime for real-time notifications
  private playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => ctx.close(), 400);
    } catch {
      // AudioContext policy
    }
  }
}
