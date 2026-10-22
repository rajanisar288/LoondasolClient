import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SelectOption } from '../select/select.component';

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppMultiSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
  template: `
    <div class="relative w-full">
      <button
        type="button"
        [id]="id"
        [disabled]="disabled"
        (click)="toggleOpen()"
        class="w-full flex items-center justify-between text-left rounded-[8px] border bg-white dark:bg-[#202226] transition-colors duration-150 focus:outline-none select-none"
        [ngClass]="[
          label ? 'px-3.5 pt-2 pb-2' : 'px-3.5 py-[10px]',
          disabled ? 'bg-slate-50 dark:bg-slate-800/50 opacity-65 cursor-not-allowed' : 'cursor-pointer',
          error
            ? 'border-rose-500'
            : isOpen()
              ? 'border-[#1e3a8a] dark:border-[#2A65F6]'
              : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        ]"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen()"
      >
        <div class="min-w-0 flex-1 pr-3">
          @if (label) {
            <span
              class="block text-[11px] leading-4 font-medium transition-colors"
              [ngClass]="
                error
                  ? 'text-rose-500'
                  : isOpen()
                    ? 'text-[#1e3a8a] dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
              "
            >
              {{ label }}
            </span>
          }
          <div class="min-h-[20px] flex items-center" [class.mt-0.5]="!!label">
            @if (selectedSummary()) {
              <span class="block truncate text-sm text-slate-900 dark:text-white">
                {{ selectedSummary() }}
              </span>
            } @else {
              <span class="block truncate text-sm text-slate-400/80 dark:text-slate-500">
                {{ label ? '' : placeholder }}
              </span>
            }
          </div>
        </div>
        <svg
          class="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-150"
          [class.rotate-180]="isOpen()"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      @if (isOpen()) {
        <div
          class="fixed z-[9999] py-1 bg-white dark:bg-[#202226] rounded-[8px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-scale-in max-h-72 overflow-y-auto"
          [ngStyle]="dropdownStyle()"
          role="listbox"
          aria-multiselectable="true"
        >
          <div class="px-3 pt-2.5 pb-2 flex items-center gap-2.5">
            <button
              type="button"
              (click)="toggleSelectAll()"
              class="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors focus:outline-none"
              [ngClass]="
                isAllFilteredSelected()
                  ? 'bg-[#2A65F6] border-[#2A65F6] text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#27292d] hover:border-slate-400'
              "
              aria-label="Select all options"
            >
              @if (isAllFilteredSelected()) {
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            </button>
            <div class="relative flex-1 flex items-center">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder=""
                class="w-full pl-3 pr-8 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#27292d] text-xs text-slate-900 dark:text-white outline-none focus:border-[#1e3a8a] dark:focus:border-[#2A65F6]"
              />
              <svg
                class="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
              </svg>
            </div>
          </div>
          <div class="max-h-56 overflow-y-auto overscroll-contain px-2 pb-2 space-y-0.5">
            @for (opt of filteredOptions(); track opt.value) {
              <div
                (click)="toggleOption(opt)"
                role="option"
                [attr.aria-selected]="isSelected(opt)"
                class="px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 cursor-pointer text-sm transition-colors select-none"
                [ngClass]="[
                  isSelected(opt)
                    ? 'bg-[#eef2f6] dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-[#f1f5f9] dark:hover:bg-slate-800/60',
                  opt.disabled ? 'opacity-40 pointer-events-none' : ''
                ]"
              >
                <span
                  class="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors"
                  [ngClass]="
                    isSelected(opt)
                      ? 'bg-[#2A65F6] border-[#2A65F6] text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#27292d]'
                  "
                >
                  @if (isSelected(opt)) {
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                </span>
                <span class="truncate">{{ opt.label }}</span>
              </div>
            }
            @if (filteredOptions().length === 0) {
              <div class="px-4 py-3 text-center text-xs text-slate-400">
                No options found
              </div>
            }
          </div>
        </div>
      }
      @if (error) {
        <p class="mt-1 text-xs text-rose-500 font-medium">{{ error }}</p>
      }
    </div>
  `,
})
export class AppMultiSelectComponent implements ControlValueAccessor {
  private readonly el = inject(ElementRef);

  @Input() id = `multi_select_${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder = 'Select options';
  @Input() required = false;
  @Input() options: SelectOption[] = [];
  @Input() error?: string | null;
  @Input() disabled = false;

  @Input()
  set value(vals: (string | number)[]) {
    this.selectedValues.set(Array.isArray(vals) ? [...vals] : []);
  }

  @Output() valueChange = new EventEmitter<(string | number)[]>();
  @Output() selectionChange = new EventEmitter<(string | number)[]>();

  readonly selectedValues = signal<(string | number)[]>([]);
  readonly isOpen = signal<boolean>(false);
  readonly isDropUp = signal<boolean>(false);
  readonly dropdownStyle = signal<Record<string, string>>({});
  searchQuery = '';

  onChange: (vals: (string | number)[]) => void = () => {};
  onTouched: () => void = () => {};

  /** Recalculates fixed screen coordinates for the floating multi-select popover. */
  updateDropdownPosition(): void {
    const targetEl = (this.el.nativeElement.querySelector('button') || this.el.nativeElement) as HTMLElement;
    const rect = targetEl.getBoundingClientRect();

    let containerTop = 0;
    let containerLeft = 0;
    let parent = targetEl.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        style.contain === 'paint' ||
        style.willChange?.includes('transform')
      ) {
        const parentRect = parent.getBoundingClientRect();
        containerTop = parentRect.top;
        containerLeft = parentRect.left;
        break;
      }
      parent = parent.parentElement;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 250 && spaceAbove > spaceBelow;
    this.isDropUp.set(dropUp);

    const relativeLeft = rect.left - containerLeft;

    if (dropUp) {
      const relativeBottom = containerTop 
        ? (window.innerHeight - rect.top - containerTop) 
        : (window.innerHeight - rect.top);
      this.dropdownStyle.set({
        position: 'fixed',
        top: 'auto',
        bottom: `${Math.max(8, relativeBottom + 4)}px`,
        left: `${relativeLeft}px`,
        right: 'auto',
        width: `${rect.width}px`,
        zIndex: '9999',
      });
    } else {
      const relativeTop = rect.bottom + 4 - containerTop;
      this.dropdownStyle.set({
        position: 'fixed',
        top: `${relativeTop}px`,
        bottom: 'auto',
        left: `${relativeLeft}px`,
        right: 'auto',
        width: `${rect.width}px`,
        zIndex: '9999',
      });
    }
  }

  /** Toggles the multi-select dropdown popover open and notifies other dropdowns to close. */
  toggleOpen(): void {
    if (this.disabled) {
      return;
    }
    const nextState = !this.isOpen();
    if (nextState) {
      this.isOpen.set(true);
      this.searchQuery = '';
      setTimeout(() => this.updateDropdownPosition(), 0);
      window.dispatchEvent(new CustomEvent('app:dropdown-open', { detail: this.el.nativeElement }));
    } else {
      this.isOpen.set(false);
    }
  }

  /** Toggles selection state for a single option. */
  toggleOption(opt: SelectOption): void {
    if (opt.disabled) {
      return;
    }
    const current = [...this.selectedValues()];
    const idx = current.findIndex((v) => String(v) === String(opt.value));
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(opt.value);
    }
    this.emitUpdate(current);
  }

  /** Toggles selection of all currently visible filtered options. */
  toggleSelectAll(): void {
    const visible = this.filteredOptions().filter((o) => !o.disabled);
    if (visible.length === 0) {
      return;
    }
    const current = [...this.selectedValues()];
    if (this.isAllFilteredSelected()) {
      const visibleSet = new Set(visible.map((o) => String(o.value)));
      const remaining = current.filter((v) => !visibleSet.has(String(v)));
      this.emitUpdate(remaining);
    } else {
      const currentSet = new Set(current.map((v) => String(v)));
      for (const opt of visible) {
        if (!currentSet.has(String(opt.value))) {
          current.push(opt.value);
        }
      }
      this.emitUpdate(current);
    }
  }

  /** Checks whether all currently visible filtered options are selected. */
  isAllFilteredSelected(): boolean {
    const visible = this.filteredOptions().filter((o) => !o.disabled);
    if (visible.length === 0) {
      return false;
    }
    const currentSet = new Set(this.selectedValues().map((v) => String(v)));
    return visible.every((opt) => currentSet.has(String(opt.value)));
  }

  /** Checks whether a specific option is currently selected. */
  isSelected(opt: SelectOption): boolean {
    return this.selectedValues().some((v) => String(v) === String(opt.value));
  }

  /** Builds a human-readable summary string of selected option labels. */
  selectedSummary(): string {
    const vals = this.selectedValues();
    if (!vals.length) {
      return '';
    }
    const valSet = new Set(vals.map((v) => String(v)));
    const labels = this.options.filter((o) => valSet.has(String(o.value))).map((o) => o.label);
    return labels.join(', ');
  }

  /** Returns options filtered by the active search query. */
  filteredOptions(): SelectOption[] {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.options.filter((opt) => opt.label.toLowerCase().includes(q));
  }

  /** Updates internal signal and notifies Angular forms and event emitters. */
  private emitUpdate(vals: (string | number)[]): void {
    this.selectedValues.set(vals);
    this.onChange(vals);
    this.valueChange.emit(vals);
    this.selectionChange.emit(vals);
  }

  /** Writes external array value from Angular forms into component state. */
  writeValue(vals: (string | number)[] | null | undefined): void {
    this.selectedValues.set(Array.isArray(vals) ? [...vals] : []);
  }

  /** Registers the callback function triggered on value change. */
  registerOnChange(fn: (vals: (string | number)[]) => void): void {
    this.onChange = fn;
  }

  /** Registers the callback function triggered when control is touched. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Updates the disabled state from Angular form control. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Closes this dropdown when another dropdown opens anywhere in the application. */
  @HostListener('window:app:dropdown-open', ['$event'])
  onOtherDropdownOpen(event: Event): void {
    const customEvent = event as CustomEvent;
    if (this.isOpen() && customEvent.detail !== this.el.nativeElement) {
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  /** Closes the dropdown when clicking outside the host element. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target) && this.isOpen()) {
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  /** Updates position on scroll or window resize. */
  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize')
  onWindowScrollOrResize(): void {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  /** Closes the dropdown when pressing the Escape key. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
