import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#2d3035] overflow-hidden transition-all duration-200 shadow-subtle"
      [class.ring-2]="isOpen"
      [class.ring-[#2A65F6]/20]="isOpen"
    >
      <button
        type="button"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen"
        class="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none focus:bg-slate-50/50 dark:focus:bg-slate-800/40 transition-colors"
      >
        <div class="flex items-center space-x-3 pr-4 min-w-0">
          @if (icon) {
            <span class="text-base shrink-0">{{ icon }}</span>
          }
          <div class="min-w-0">
            <h4 class="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {{ title }}
            </h4>
            @if (subtitle) {
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {{ subtitle }}
              </p>
            }
          </div>
          @if (badge) {
            <span
              class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#2A65F6] dark:text-blue-300"
            >
              {{ badge }}
            </span>
          }
        </div>

        <div
          class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-transform duration-200"
          [class.rotate-180]="isOpen"
        >
          <svg class="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      @if (isOpen) {
        <div
          class="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed animate-fade-in"
          role="region"
        >
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
})
export class AppAccordionComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() badge?: string;
  @Input() isOpen = false;

  @Output() isOpenChange = new EventEmitter<boolean>();

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }
}
