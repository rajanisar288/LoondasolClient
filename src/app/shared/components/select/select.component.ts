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
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSelectComponent),
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
            @if (selectedOption(); as selected) {
              <span class="block truncate text-sm text-slate-900 dark:text-white">
                {{ selected.label }}
              </span>
            } @else {
              <span class="block truncate text-sm text-slate-400/80 dark:text-slate-500">
                {{ label ? '' : placeholder }}
              </span>
            }
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          @if (clearable && hasValue() && !disabled) {
            <span
              (click)="clearSelection($event)"
              class="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          }
          <svg
            class="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-150"
            [class.rotate-180]="isOpen()"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      @if (isOpen()) {
        <div
          class="fixed z-[9999] py-1.5 bg-white dark:bg-[#202226] rounded-[8px] border border-slate-200 dark:border-slate-700 shadow-xl max-h-60 overflow-y-auto overscroll-contain animate-scale-in"
          [ngStyle]="dropdownStyle()"
          role="listbox"
        >
          @if (searchable || options.length > 8) {
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
              <span class="truncate">{{ opt.label }}</span>
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
export class AppSelectComponent implements ControlValueAccessor {
  private readonly el = inject(ElementRef);

  @Input() id = `select_${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder = 'Select an option';
  @Input() required = false;
  @Input() showOptional = false;
  @Input() searchable = false;
  @Input() clearable = false;
  @Input() options: SelectOption[] = [];
  @Input() helperText?: string;
  @Input() error?: string | null;
  @Input() disabled = false;

  @Input()
  set value(val: string | number) {
    this.internalValue.set(val ?? '');
  }

  @Output() valueChange = new EventEmitter<string | number>();
  @Output() selectionChange = new EventEmitter<string | number>();

  readonly internalValue = signal<string | number>('');
  readonly isOpen = signal<boolean>(false);
  readonly isDropUp = signal<boolean>(false);
  readonly dropdownStyle = signal<Record<string, string>>({});
  searchQuery = '';

  onChange: (val: string | number) => void = () => {};
  onTouched: () => void = () => {};

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

  /** Toggles the select dropdown open and notifies other dropdowns to close. */
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
  selectOption(opt: SelectOption): void {
    if (opt.disabled) {
      return;
    }
    this.internalValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.selectionChange.emit(opt.value);
    this.isOpen.set(false);
    this.onTouched();
  }

  /** Clears the current selection back to empty value. */
  clearSelection(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.internalValue.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.selectionChange.emit('');
  }

  /** Returns true when a non-empty option is currently selected. */
  hasValue(): boolean {
    const val = this.internalValue();
    return val !== '' && val !== null && val !== undefined;
  }

  /** Returns the currently selected SelectOption object if matched. */
  selectedOption(): SelectOption | undefined {
    const val = this.internalValue();
    if (val === '' || val === null || val === undefined) {
      return this.options.find((opt) => opt.value === '' && !this.label);
    }
    return this.options.find((opt) => String(opt.value) === String(val));
  }

  /** Checks whether the given option matches the active value. */
  isSelected(opt: SelectOption): boolean {
    return String(this.internalValue()) === String(opt.value);
  }

  /** Returns the list of options filtered by the active search query. */
  filteredOptions(): SelectOption[] {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.options.filter((opt) => opt.label.toLowerCase().includes(q));
  }

  /** Writes external value from Angular forms into the component state. */
  writeValue(val: string | number): void {
    this.internalValue.set(val ?? '');
  }

  /** Registers the callback function triggered on selection change. */
  registerOnChange(fn: (val: string | number) => void): void {
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

  /** Closes the dropdown when clicking outside the component host element. */
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
