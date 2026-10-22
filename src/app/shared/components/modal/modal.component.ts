import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @keyframes modalBackdropFade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes modalPanelIn {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .modal-backdrop-anim {
        animation: modalBackdropFade 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .modal-panel-anim {
        animation: modalPanelIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `,
  ],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="fixed inset-0 bg-slate-900/45 dark:bg-black/70 backdrop-blur-[2px] modal-backdrop-anim"
          (click)="onBackdropClick()"
        ></div>
        <div class="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
          <div
            class="relative w-full max-h-[90vh] my-auto flex flex-col rounded-[8px] bg-white dark:bg-[#202226] text-left shadow-2xl border border-slate-200/80 dark:border-slate-800 modal-panel-anim"
            [ngClass]="resolvedWidthClass()"
            role="dialog"
            aria-modal="true"
          >
            @if (splitLayout) {
              <div class="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
                <div class="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <div class="flex items-center justify-between mb-5">
                      <h3 class="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                        {{ title }}
                      </h3>
                      <button
                        type="button"
                        (click)="close()"
                        class="lg:hidden rounded-[8px] p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        aria-label="Close modal"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div class="max-h-[calc(85vh-150px)] overflow-y-auto pr-1">
                      <ng-content></ng-content>
                    </div>
                  </div>
                </div>
                <div class="lg:col-span-5 bg-slate-50/70 dark:bg-[#27292d] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between rounded-b-[8px] lg:rounded-bl-none lg:rounded-r-[8px]">
                  <div class=" hidden lg:flex justify-end mb-2">
                    <button
                      type="button"
                      (click)="close()"
                      class="rounded-[8px] p-1.5 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      aria-label="Close modal"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="flex-1">
                    <ng-content select="[modal-aside]"></ng-content>
                  </div>
                </div>
              </div>
            } @else {
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                <h3 class="text-base font-semibold text-slate-900 dark:text-white tracking-tight truncate pr-4">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  (click)="close()"
                  class="rounded-[8px] p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label="Close modal"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="px-6 py-5 overflow-y-auto flex-1 min-h-[160px] max-h-[calc(88vh-130px)]">
                <ng-content></ng-content>
              </div>
              <ng-content select="[modal-footer]"></ng-content>
              @if (showFooter) {
                <div class="px-6 py-4 bg-slate-50/60 dark:bg-[#27292d]/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 rounded-b-[8px] shrink-0">
                  <div>
                    @if (showResetButton) {
                      <app-button
                        type="button"
                        variant="ghost"
                        (btnClick)="resetAction.emit()"
                      >
                        {{ resetLabel }}
                      </app-button>
                    }
                  </div>
                  <div class="flex items-center gap-2.5 ml-auto">
                    <app-button
                      type="button"
                      variant="secondary"
                      [disabled]="primaryLoading"
                      (btnClick)="onSecondary()"
                    >
                      {{ secondaryLabel }}
                    </app-button>
                    <app-button
                      type="button"
                      variant="primary"
                      [loading]="primaryLoading"
                      [disabled]="primaryDisabled"
                      (btnClick)="primaryAction.emit()"
                    >
                      {{ primaryLabel }}
                    </app-button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AppModalComponent implements OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);

  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: ModalSize = 'lg';
  @Input() maxWidthClass = '';
  @Input() splitLayout = false;
  @Input() closeOnEscape = true;
  @Input() closeOnBackdrop = true;
  @Input() showFooter = false;
  @Input() showResetButton = false;
  @Input() resetLabel = 'Reset';
  @Input() primaryLabel = 'Save';
  @Input() secondaryLabel = 'Cancel';
  @Input() primaryLoading = false;
  @Input() primaryDisabled = false;

  @Output() closed = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  @Output() resetAction = new EventEmitter<void>();

  /** Synchronizes document body scroll lock when modal state changes. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.document.body.style.overflow = this.isOpen ? 'hidden' : '';
    }
  }

  /** Restores document body scroll when modal component is destroyed. */
  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  /** Resolves the Tailwind max-width class from explicit override or size preset. */
  resolvedWidthClass(): string {
    if (this.maxWidthClass) {
      return this.maxWidthClass;
    }
    const map: Record<ModalSize, string> = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-3xl',
      '2xl': 'max-w-4xl',
      '3xl': 'max-w-5xl',
      '4xl': 'max-w-6xl',
    };
    return map[this.size] || 'max-w-2xl';
  }

  /** Handles Escape key press to close the modal when enabled. */
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen && this.closeOnEscape && !this.primaryLoading) {
      event.preventDefault();
      this.close();
    }
  }

  /** Closes the modal when the backdrop is clicked. */
  onBackdropClick(): void {
    if (this.closeOnBackdrop && !this.primaryLoading) {
      this.close();
    }
  }

  /** Emits secondary action and closes the modal. */
  onSecondary(): void {
    this.secondaryAction.emit();
    this.close();
  }

  /** Emits closed event to parent component. */
  close(): void {
    this.closed.emit();
  }
}
