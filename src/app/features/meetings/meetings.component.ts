import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { WorkspaceDatePipe } from '../../shared/pipes/workspace-locale.pipes';

export interface MeetingItem {
  meetingId: string;
  companyId: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  startTime: string;
  endTime: string;
  meetingType: 'VIDEO' | 'SYNC' | 'STANDUP' | 'ONE_ON_ONE';
  attendeeIds?: string[];
  departmentId?: string;
  roomId: string;
  meetingCode?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

interface TeamMember {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  designation?: string;
}

@Component({
  selector: 'app-meetings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppBadgeComponent,
    AppModalComponent,
    WorkspaceDatePipe,
  ],
  templateUrl: "./meetings.component.html",
  styleUrl: "./meetings.component.scss",
})
export class MeetingsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  readonly meetings = signal<MeetingItem[]>([]);
  readonly selectedFilter = signal<string>('ALL');
  readonly feedbackMessage = signal<string | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);

  readonly isScheduleModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  joinInputCode = '';
  readonly isJoiningByCode = signal<boolean>(false);
  readonly copiedMeetingId = signal<string | null>(null);

  newTitle = '';
  newDescription = '';
  newStartTime = '';
  newEndTime = '';
  newType: 'VIDEO' | 'SYNC' | 'STANDUP' | 'ONE_ON_ONE' = 'VIDEO';
  selectedAttendeeIds: string[] = [];

  readonly activeRoomId = signal<string | null>(null);
  readonly currentMeetingTitle = signal<string>('Live Conference');
  readonly isMicMuted = signal<boolean>(false);
  readonly isCameraOff = signal<boolean>(false);

  @ViewChild('meetingLocalVideo') private meetingLocalVideo?: ElementRef<HTMLVideoElement>;
  private localMediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.loadMeetings();
    this.loadTeamMembers();
    this.initDefaultDates();

    // Check for direct join link param (?code=XYZ or ?roomId=XYZ)
    this.route.queryParams.subscribe((params) => {
      const code = params['code'] || params['roomId'];
      if (code && !this.activeRoomId()) {
        this.joinInputCode = code;
        this.joinByCodeOrLink();
      }
    });
  }

  ngOnDestroy(): void {
    this.leaveMeetingRoom();
  }

  initDefaultDates(): void {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    this.newStartTime = now.toISOString().slice(0, 16);

    const end = new Date(now.getTime() + 45 * 60 * 1000);
    this.newEndTime = end.toISOString().slice(0, 16);
  }

  loadMeetings(): void {
    this.api.get<MeetingItem[]>('meetings').subscribe({
      next: (list) => this.meetings.set(list || []),
      error: () => {},
    });
  }

  loadTeamMembers(): void {
    this.api.get<{ data: any[] }>('employees', { limit: 100 }).subscribe({
      next: (res) => {
        const currentUserId = this.authService.currentUser()?.userId;
        const mapped = (res.data || [])
          .filter((e) => e.userId && e.userId !== currentUserId)
          .map((e) => ({
            userId: e.userId,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email,
            designation: e.designation,
          }));
        this.teamMembers.set(mapped);
      },
      error: () => {},
    });
  }

  filteredMeetings(): MeetingItem[] {
    const filter = this.selectedFilter();
    if (filter === 'ALL') return this.meetings();
    return this.meetings().filter((m) => m.status === filter);
  }

  openScheduleModal(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.selectedAttendeeIds = [];
    this.initDefaultDates();
    this.isScheduleModalOpen.set(true);
  }

  closeScheduleModal(): void {
    this.isScheduleModalOpen.set(false);
  }

  isAttendeeSelected(userId: string): boolean {
    return this.selectedAttendeeIds.includes(userId);
  }

  toggleAttendee(userId: string): void {
    if (this.selectedAttendeeIds.includes(userId)) {
      this.selectedAttendeeIds = this.selectedAttendeeIds.filter((id) => id !== userId);
    } else {
      this.selectedAttendeeIds.push(userId);
    }
  }

  createMeeting(): void {
    if (!this.newTitle.trim() || !this.newStartTime || !this.newEndTime) return;

    this.isSubmitting.set(true);
    this.api
      .post<MeetingItem>('meetings', {
        title: this.newTitle.trim(),
        description: this.newDescription.trim(),
        startTime: new Date(this.newStartTime).toISOString(),
        endTime: new Date(this.newEndTime).toISOString(),
        meetingType: this.newType,
        attendeeIds: this.selectedAttendeeIds,
      })
      .subscribe({
        next: (created) => {
          this.meetings.update((list) => [created, ...list]);
          this.isSubmitting.set(false);
          this.closeScheduleModal();
          this.feedbackMessage.set(`Meeting "${created.title}" scheduled successfully.`);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  startInstantMeeting(): void {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    this.api
      .post<MeetingItem>('meetings', {
        title: `Instant Sync - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        description: 'Spontaneous team sync room',
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        meetingType: 'VIDEO',
      })
      .subscribe({
        next: (created) => {
          this.meetings.update((list) => [created, ...list]);
          this.joinMeetingRoom(created);
        },
        error: () => {},
      });
  }

  async joinMeetingRoom(meeting: MeetingItem): Promise<void> {
    this.activeRoomId.set(meeting.roomId);
    this.currentMeetingTitle.set(meeting.title);
    this.socketService.joinMeeting(meeting.roomId);

    try {
      this.localMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setTimeout(() => {
        if (this.meetingLocalVideo?.nativeElement) {
          this.meetingLocalVideo.nativeElement.srcObject = this.localMediaStream;
        }
      }, 100);
    } catch {
      // User may have denied permissions
    }
  }

  leaveMeetingRoom(): void {
    const roomId = this.activeRoomId();
    if (roomId) {
      this.socketService.leaveMeeting(roomId);
    }
    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach((track) => track.stop());
      this.localMediaStream = null;
    }
    this.activeRoomId.set(null);
  }

  toggleMic(): void {
    if (this.localMediaStream) {
      const audioTracks = this.localMediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        this.isMicMuted.set(!audioTracks[0].enabled);
      }
    }
  }

  toggleCamera(): void {
    if (this.localMediaStream) {
      const videoTracks = this.localMediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        this.isCameraOff.set(!videoTracks[0].enabled);
      }
    }
  }

  deleteMeeting(meetingId: string): void {
    if (!confirm('Are you sure you want to cancel and delete this meeting?')) return;

    this.api.delete(`meetings/${meetingId}`).subscribe({
      next: () => {
        this.meetings.update((list) => list.filter((m) => m.meetingId !== meetingId));
        this.feedbackMessage.set('Meeting cancelled successfully.');
      },
      error: () => {},
    });
  }

  isHost(meeting: MeetingItem): boolean {
    return meeting.hostId === this.authService.currentUser()?.userId;
  }

  // Attendees can only join if within 15 minutes of scheduled start time (or if in progress / host)
  canJoinMeeting(meeting: MeetingItem): boolean {
    if (this.isHost(meeting)) return true;
    if (meeting.status === 'IN_PROGRESS') return true;
    const start = new Date(meeting.startTime).getTime();
    const now = Date.now();
    return start - now <= 15 * 60 * 1000;
  }

  getCountdownText(meeting: MeetingItem): string {
    const start = new Date(meeting.startTime).getTime();
    const now = Date.now();
    const diffMs = start - now - 15 * 60 * 1000;
    if (diffMs <= 0) return 'Opening momentarily';
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) return `Opens in ${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Opens in ${hours}h ${mins}m`;
  }

  copyMeetingLink(meeting: MeetingItem): void {
    const code = meeting.meetingCode || meeting.roomId;
    const link = `${window.location.origin}/meetings?code=${code}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        this.copiedMeetingId.set(meeting.meetingId);
        setTimeout(() => this.copiedMeetingId.set(null), 2500);
      })
      .catch(() => {
        prompt('Copy meeting link:', link);
      });
  }

  joinByCodeOrLink(): void {
    let input = this.joinInputCode.trim();
    if (!input) return;

    // Support pasted URLs
    try {
      if (input.includes('?') && input.includes('code=')) {
        const url = new URL(input);
        input = url.searchParams.get('code') || input;
      } else if (input.includes('/')) {
        input = input.split('/').pop() || input;
      }
    } catch {}

    this.isJoiningByCode.set(true);
    this.api.get<MeetingItem>(`meetings/${input}`).subscribe({
      next: (meeting) => {
        this.isJoiningByCode.set(false);
        if (!this.canJoinMeeting(meeting)) {
          this.feedbackMessage.set(
            `Meeting "${meeting.title}" is scheduled for ${new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Attendees can join starting 15 minutes before start.`,
          );
          return;
        }
        this.joinMeetingRoom(meeting);
      },
      error: (err) => {
        this.isJoiningByCode.set(false);
        this.feedbackMessage.set(
          err?.error?.message || `Meeting session "${input}" not found or has expired.`,
        );
      },
    });
  }

  getStatusVariant(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'success';
      case 'COMPLETED':
        return 'neutral';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
