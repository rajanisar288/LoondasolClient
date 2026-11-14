import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ApiService } from '../../core/services/api.service';

import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppImageCropperModalComponent } from '../../shared/components/image-cropper-modal/image-cropper-modal.component';

export interface SidebarCounts {
  employees: number;
  tasks: number;
  meetings: number;
  attendance: number;
  messages: number;
  expenses: number;
  todos: number;
  resignations: number;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AppModalComponent,
    AppButtonComponent,
    AppImageCropperModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent implements OnInit, OnDestroy {
  private countInterval: any = null;
  readonly authService = inject(AuthService);
  readonly layoutService = inject(LayoutService);
  private readonly api = inject(ApiService);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isSavingProfile = signal<boolean>(false);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly profileFeedback = signal<string | null>(null);
  readonly isCropperOpen = signal<boolean>(false);
  readonly cropImageSrc = signal<string | null>(null);

  profileFirstName = '';
  profileLastName = '';
  profilePhone = '';
  profileAddress = '';
  profileAvatarUrl = '';

  readonly counts = signal<SidebarCounts>({
    employees: 0,
    tasks: 0,
    meetings: 0,
    attendance: 0,
    messages: 0,
    expenses: 0,
    todos: 0,
    resignations: 0,
  });

  ngOnDestroy(): void {
    if (this.countInterval) {
      clearInterval(this.countInterval);
      this.countInterval = null;
    }
  }

  ngOnInit(): void {
    this.loadCounts();
    // Periodically update badge counts every 30 seconds
    this.countInterval = setInterval(() => {
      if (this.authService.token()) {
        this.loadCounts();
      }
    }, 30000);
  }

  loadCounts(): void {
    if (!this.authService.token()) return;
    this.api.get<SidebarCounts>('reports/sidebar-counts').subscribe({
      next: (res) => this.counts.set(res),
      error: () => {},
    });
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  openProfileModal(): void {
    const user = this.authService.currentUser();
    this.profileFirstName = user?.firstName || '';
    this.profileLastName = user?.lastName || '';
    this.profilePhone = user?.phone || '';
    this.profileAddress = user?.address || '';
    this.profileAvatarUrl = user?.avatarUrl || '';
    this.profileFeedback.set(null);
    this.isUserMenuOpen.set(false);
    this.isProfileModalOpen.set(true);
  }

  closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  onAvatarSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file works
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        this.cropImageSrc.set(result);
        this.isCropperOpen.set(true);
      }
    };
    reader.readAsDataURL(file);
  }

  openCropperForCurrent(): void {
    if (this.profileAvatarUrl) {
      this.cropImageSrc.set(this.profileAvatarUrl);
      this.isCropperOpen.set(true);
    }
  }

  onCropCompleted(blob: Blob): void {
    this.isCropperOpen.set(false);
    this.cropImageSrc.set(null);

    const formData = new FormData();
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    this.isUploadingAvatar.set(true);
    this.api.post<{ url: string; publicId: string }>('upload/logo', formData).subscribe({
      next: (res) => {
        this.profileAvatarUrl = res.url;
        this.isUploadingAvatar.set(false);
      },
      error: () => {
        this.isUploadingAvatar.set(false);
      },
    });
  }

  onCropCancelled(): void {
    this.isCropperOpen.set(false);
    this.cropImageSrc.set(null);
  }

  saveProfile(): void {
    if (!this.profileFirstName.trim() || !this.profileLastName.trim()) {
      return;
    }

    this.isSavingProfile.set(true);
    this.authService
      .updateProfile({
        firstName: this.profileFirstName.trim(),
        lastName: this.profileLastName.trim(),
        avatarUrl: this.profileAvatarUrl.trim(),
        phone: this.profilePhone.trim(),
        address: this.profileAddress.trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.profileFeedback.set('Profile successfully updated!');
          setTimeout(() => {
            this.profileFeedback.set(null);
            this.closeProfileModal();
          }, 1200);
        },
        error: () => {
          this.isSavingProfile.set(false);
        },
      });
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'FS';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  }
}
