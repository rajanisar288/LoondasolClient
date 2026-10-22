import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
          (click)="onClose()"
        ></div>

        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <div
            class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-[#27292d] p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 transition-all animate-scale-in"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
          >
            <!-- Animated Checkmark Badge -->
            <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 animate-scale-in">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ title }}
            </h3>
            @if (message) {
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ message }}
              </p>
            }

            <!-- Optional Copyable / Highlighted snippet -->
            @if (copyableText) {
              <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <span class="text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all text-left">
                  {{ copyableText }}
                </span>
                <button
                  type="button"
                  (click)="copyToClipboard()"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition shrink-0"
                >
                  {{ copied() ? '✓ Copied' : 'Copy' }}
                </button>
              </div>
            }

            <div class="mt-6">
              <app-button
                variant="primary"
                size="md"
                [fullWidth]="true"
                (click)="onClose()"
              >
                {{ buttonLabel }}
              </app-button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AppSuccessModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Success!';
  @Input() message?: string;
  @Input() copyableText?: string;
  @Input() buttonLabel = 'Continue';

  @Output() closed = new EventEmitter<void>();

  readonly copied = signal(false);

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.onClose();
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  copyToClipboard(): void {
    if (this.copyableText) {
      navigator.clipboard.writeText(this.copyableText);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }
}
