import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { NotificationService } from '../../core/services/notification.service';
import { RealtimeNotification } from '../../core/services/socket.service';
import { WorkspaceDatePipe } from '../../shared/pipes/workspace-locale.pipes';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, WorkspaceDatePipe],
  template: `
    <header
      class="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0 gap-3"
    >
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <button
          type="button"
          (click)="layoutService.toggleMobile()"
          class="p-2 rounded-[8px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden flex-shrink-0"
          aria-label="Toggle mobile menu"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <button
          type="button"
          (click)="layoutService.toggleCollapse()"
          class="hidden lg:flex p-2 rounded-[8px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
          [title]="layoutService.isDesktopCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          aria-label="Toggle sidebar collapse"
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
              stroke-width="1.8"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </button>
      </div>

      <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 relative">
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          class="p-2 rounded-[8px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Theme"
        >
          @if (themeService.isDarkMode()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
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
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          }
        </button>

        <div class="relative">
          <button
            type="button"
            (click)="notificationService.toggleDropdown()"
            class="relative p-2 rounded-[8px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Notifications"
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
                stroke-width="1.8"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            @if (notificationService.unreadCount() > 0) {
              <span
                class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2A65F6] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
              >
                {{
                  notificationService.unreadCount() > 9 ? '9+' : notificationService.unreadCount()
                }}
              </span>
            }
          </button>

          @if (notificationService.isDropdownOpen()) {
            <div
              (click)="$event.stopPropagation()"
              class="absolute right-0 mt-2 w-80 sm:w-96 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in"
            >
              <div
                class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div class="flex items-center space-x-2">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                  @if (notificationService.unreadCount() > 0) {
                    <span
                      class="px-2 py-0.5 rounded-[8px] text-xs font-semibold bg-blue-50 text-[#2A65F6] dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      {{ notificationService.unreadCount() }} new
                    </span>
                  }
                </div>
                @if (notificationService.unreadCount() > 0) {
                  <button
                    type="button"
                    (click)="notificationService.markAllAsRead()"
                    class="text-xs text-[#2A65F6] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                }
              </div>

              <div
                class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60"
              >
                @for (item of notificationService.notifications(); track item.notificationId) {
                  <div
                    (click)="handleNotificationClick(item)"
                    [class]="
                      item.isRead
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-blue-50/40 dark:bg-blue-950/20'
                    "
                    class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-start space-x-3"
                  >
                    <div
                      [class]="getIconBg(item.type)"
                      class="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                    >
                      {{ getIconLetter(item.type) }}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <h4
                          [class]="
                            item.isRead
                              ? 'font-medium text-slate-700 dark:text-slate-300'
                              : 'font-bold text-slate-900 dark:text-white'
                          "
                          class="text-xs truncate"
                        >
                          {{ item.title }}
                        </h4>
                        <span class="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                          {{ item.createdAt | date: 'shortTime' }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {{ item.message }}
                      </p>
                    </div>

                    @if (!item.isRead) {
                      <span class="w-2 h-2 rounded-full bg-[#2A65F6] flex-shrink-0 mt-1.5"></span>
                    }
                  </div>
                } @empty {
                  <div class="p-8 text-center text-slate-400 space-y-1">
                    <p class="text-xs font-medium">All caught up!</p>
                    <p class="text-[11px]">No new notifications at this time.</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `,
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
