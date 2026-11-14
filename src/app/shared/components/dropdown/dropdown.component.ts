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
  templateUrl: "./dropdown.component.html",
  styleUrl: "./dropdown.component.scss",
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
