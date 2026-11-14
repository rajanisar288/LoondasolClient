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
  templateUrl: "./select.component.html",
  styleUrl: "./select.component.scss",
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
