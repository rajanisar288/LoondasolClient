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
  templateUrl: "./multi-select.component.html",
  styleUrl: "./multi-select.component.scss",
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
