import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
          (click)="onCancel()"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <div
            class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-[#27292d] p-6 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all animate-scale-in"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex items-start space-x-4">
              <!-- Icon Container -->
              <div
                class="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                [ngClass]="getIconBgClasses()"
              >
                @if (variant === 'danger') {
                  <svg
                    class="w-6 h-6 text-rose-600 dark:text-rose-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                } @else if (variant === 'warning') {
                  <svg
                    class="w-6 h-6 text-amber-600 dark:text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                } @else {
                  <svg
                    class="w-6 h-6 text-[#2A65F6] dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                  {{ title }}
                </h3>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {{ message }}
                </p>
                @if (highlightText) {
                  <div
                    class="mt-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 truncate"
                  >
                    {{ highlightText }}
                  </div>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <app-button
                variant="secondary"
                size="md"
                [disabled]="loading"
                (click)="onCancel()"
              >
                {{ cancelLabel }}
              </app-button>
              <app-button
                [variant]="variant === 'danger' ? 'danger' : 'primary'"
                size="md"
                [loading]="loading"
                (click)="onConfirm()"
              >
                {{ confirmLabel }}
              </app-button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AppConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed? This action may not be reversible.';
  @Input() highlightText?: string;
  @Input() variant: ConfirmVariant = 'danger';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen && !this.loading) {
      event.preventDefault();
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getIconBgClasses(): string {
    switch (this.variant) {
      case 'danger':
        return 'bg-rose-100/80 dark:bg-rose-950/50';
      case 'warning':
        return 'bg-amber-100/80 dark:bg-amber-950/50';
      case 'info':
      default:
        return 'bg-blue-100/80 dark:bg-blue-950/50';
    }
  }
}
