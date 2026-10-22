import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface DropdownOption {
  label: string;
  value: any;
  badge?: string | number;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDropdownComponent),
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
          <div class="min-h-[20px] flex items-center gap-2" [class.mt-0.5]="!!label">
            @if (selectedOption(); as opt) {
              @if (opt.icon) {
                <span class="shrink-0 text-sm">{{ opt.icon }}</span>
              }
              <span class="truncate text-sm text-slate-900 dark:text-white">
                {{ opt.label }}
              </span>
              @if (opt.badge) {
                <span class="ml-1 px-1.5 py-0.5 rounded-[8px] text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2A65F6] border border-blue-200/60 dark:border-blue-800/60">
                  {{ opt.badge }}
                </span>
              }
            } @else {
              <span class="truncate text-sm text-slate-400/80 dark:text-slate-500">
                {{ label ? '' : placeholder }}
              </span>
            }
          </div>
        </div>
        <svg
          class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-150"
          [class.rotate-180]="isOpen()"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      @if (isOpen()) {
        <div
          class="fixed z-[9999] py-1.5 bg-white dark:bg-[#202226] rounded-[8px] border border-slate-200 dark:border-slate-700 shadow-xl max-h-60 overflow-y-auto overscroll-contain animate-scale-in"
          [ngStyle]="dropdownStyle()"
          role="listbox"
        >
          @if (searchable || options.length > 6) {
            <div class="px-2.5 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
              <div class="relative flex items-center">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  placeholder="Search..."
                  class="w-full pl-3 pr-8 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#27292d] text-xs text-slate-900 dark:text-white outline-none focus:border-[#1e3a8a] dark:focus:border-[#2A65F6]"
                />
                <svg
                  class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
                </svg>
              </div>
            </div>
          }
          @for (opt of filteredOptions(); track opt.value) {
            <div
              (click)="selectOption(opt)"
              role="option"
              [attr.aria-selected]="isSelected(opt)"
              class="mx-2 my-0.5 px-3 py-2 rounded-[8px] text-sm cursor-pointer transition-colors flex items-center justify-between"
              [ngClass]="[
                isSelected(opt)
                  ? 'bg-[#eef2f6] dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-[#f1f5f9] dark:hover:bg-slate-800/60',
                opt.disabled ? 'opacity-40 pointer-events-none' : ''
              ]"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                @if (opt.icon) {
                  <span class="text-sm shrink-0">{{ opt.icon }}</span>
                }
                <div class="min-w-0">
                  <div class="truncate">{{ opt.label }}</div>
                  @if (opt.description) {
                    <div class="text-xs text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">{{ opt.description }}</div>
                  }
                </div>
              </div>
              @if (opt.badge) {
                <span class="ml-2 px-2 py-0.5 rounded-[8px] text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#2A65F6] border border-blue-200/60 dark:border-blue-800/60">
                  {{ opt.badge }}
                </span>
              }
            </div>
          }
          @if (filteredOptions().length === 0) {
            <div class="px-4 py-3 text-center text-xs text-slate-400">
              No options found
            </div>
          }
        </div>
      }
      @if (error) {
        <p class="mt-1 text-xs text-rose-500 font-medium">{{ error }}</p>
      }
    </div>
  `,
})
export class AppDropdownComponent implements ControlValueAccessor {
  private readonly el = inject(ElementRef);

  @Input() label = '';
  @Input() required = false;
  @Input() showOptional = false;
  @Input() placeholder = 'Select an option';
  @Input() options: DropdownOption[] = [];
  @Input() disabled = false;
  @Input() searchable = false;
  @Input() error = '';

  @Output() selectionChange = new EventEmitter<any>();

  readonly isOpen = signal(false);
  readonly isDropUp = signal<boolean>(false);
  readonly dropdownStyle = signal<Record<string, string>>({});
  readonly selectedValue = signal<any>(null);
  searchQuery = '';

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  /** Recalculates fixed screen coordinates for the floating dropdown popover. */
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
    const dropUp = spaceBelow < 220 && spaceAbove > spaceBelow;
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

  /** Updates position on scroll or window resize. */
  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize')
  onWindowScrollOrResize(): void {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  /** Writes external value from Angular forms into the component state. */
  writeValue(value: any): void {
    this.selectedValue.set(value);
  }

  /** Registers the callback function triggered on value change. */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /** Registers the callback function triggered when control is touched. */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /** Updates the disabled state from Angular form control. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Toggles the dropdown menu open and notifies other dropdowns to close. */
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

  /** Selects an option and notifies form controls and event listeners. */
  selectOption(option: DropdownOption): void {
    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen.set(false);
  }

  /** Returns the currently selected DropdownOption if matched. */
  selectedOption(): DropdownOption | undefined {
    const val = this.selectedValue();
    return this.options.find((opt) => opt.value === val);
  }

  /** Checks whether the given option matches the active value. */
  isSelected(option: DropdownOption): boolean {
    return this.selectedValue() === option.value;
  }

  /** Returns options filtered by the active search query. */
  filteredOptions(): DropdownOption[] {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
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

  /** Closes the dropdown when pressing the Escape key. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
