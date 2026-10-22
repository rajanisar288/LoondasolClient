import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="radio"
      [attr.aria-checked]="selected"
      tabindex="0"
      (click)="onSelect()"
      (keydown.enter)="onSelect()"
      (keydown.space)="$event.preventDefault(); onSelect()"
      class="group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-[#2A65F6]/15"
      [ngClass]="
        selected
          ? 'border-[#2A65F6] bg-blue-50/40 dark:bg-blue-950/25 shadow-sm'
          : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-[#2d3035] hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50/60 dark:hover:bg-slate-850/50'
      "
      [class.opacity-50]="disabled"
      [class.pointer-events-none]="disabled"
    >
      <div class="flex items-center space-x-3.5 min-w-0 pr-3">
        <!-- Icon Container -->
        @if (icon) {
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            [ngClass]="
              selected
                ? 'bg-[#2A65F6]/10 text-[#2A65F6]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70'
            "
          >
            <span class="text-xl">{{ icon }}</span>
          </div>
        }

        <!-- Text details -->
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <h4
              class="text-sm font-semibold truncate transition-colors"
              [ngClass]="
                selected
                  ? 'text-[#2A65F6] dark:text-blue-400'
                  : 'text-slate-900 dark:text-white'
              "
            >
              {{ title }}
            </h4>
            @if (badge) {
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider"
                [ngClass]="
                  selected
                    ? 'bg-[#2A65F6] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                "
              >
                {{ badge }}
              </span>
            }
          </div>
          @if (subtitle) {
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {{ subtitle }}
            </p>
          }
        </div>
      </div>

      <!-- Right Indicator: Radio indicator or Chevron -->
      <div class="shrink-0 flex items-center pl-2">
        @if (indicatorType === 'radio') {
          <div
            class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
            [ngClass]="
              selected
                ? 'border-[#2A65F6] bg-[#2A65F6]'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-slate-400'
            "
          >
            @if (selected) {
              <div class="w-2 h-2 rounded-full bg-white"></div>
            }
          </div>
        } @else if (indicatorType === 'chevron') {
          <svg
            class="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        } @else {
          <!-- Checkmark -->
          @if (selected) {
            <div class="w-5 h-5 rounded-full bg-[#2A65F6] text-white flex items-center justify-center">
              <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class AppSelectionCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() badge?: string;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() indicatorType: 'radio' | 'chevron' | 'check' = 'radio';

  @Output() selectionChange = new EventEmitter<void>();

  onSelect(): void {
    if (!this.disabled) {
      this.selectionChange.emit();
    }
  }
}
