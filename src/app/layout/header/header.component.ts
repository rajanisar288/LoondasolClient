import { Component, OnInit, inject, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ThemeService } from "../../core/services/theme.service";
import { AuthService } from "../../core/services/auth.service";
import { LayoutService } from "../../core/services/layout.service";
import { NotificationService } from "../../core/services/notification.service";
import { RealtimeNotification } from "../../core/services/socket.service";
import { WorkspaceDatePipe } from "../../shared/pipes/workspace-locale.pipes";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, WorkspaceDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly layoutService = inject(LayoutService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  /** Initializes notifications when the header mounts. */
  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  /** Marks a notification as read and routes to its module. */
  handleNotificationClick(item: RealtimeNotification): void {
    this.notificationService.markAsRead(item.notificationId);
    this.notificationService.closeDropdown();
    if (item.type === 'CHAT') {
      this.router.navigate(['/chat']);
    } else if (item.type === 'MEETING') {
      this.router.navigate(['/meetings']);
    } else if (item.type === 'TASK') {
      this.router.navigate(['/tasks']);
    }
  }

  /** Returns the background class for a notification badge by type. */
  getIconBg(type: string): string {
    switch (type) {
      case 'CALL':
        return 'bg-emerald-500';
      case 'CHAT':
        return 'bg-[#2A65F6]';
      case 'MEETING':
        return 'bg-indigo-500';
      case 'TASK':
        return 'bg-amber-500';
      case 'ANNOUNCEMENT':
        return 'bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  }

  /** Returns the icon character for a notification badge by type. */
  getIconLetter(type: string): string {
    switch (type) {
      case 'CALL':
        return 'C';
      case 'CHAT':
        return 'M';
      case 'MEETING':
        return 'V';
      case 'TASK':
        return 'T';
      case 'ANNOUNCEMENT':
        return 'A';
      default:
        return 'N';
    }
  }
}
