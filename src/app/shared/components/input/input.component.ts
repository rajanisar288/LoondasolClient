import {
  Component,
  Input,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./input.component.html",
  styleUrl: "./input.component.scss",
})
export class AppInputComponent implements ControlValueAccessor, OnInit {
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  @Input() id = `input_${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() prefixIcon?: string;
  @Input() suffixText?: string;
  @Input() required = false;
  @Input() showOptional = false;
  @Input() error?: string | null;
  @Input() helperText?: string;
  @Input() disabled = false;

  @Input()
  set value(val: string | number | null | undefined) {
    this.internalValue.set(val !== null && val !== undefined ? String(val) : '');
  }

  readonly internalValue = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly isFocused = signal<boolean>(false);
  readonly currentType = signal<string>('text');

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  /** Initializes the input type signal from component input. */
  ngOnInit(): void {
    this.currentType.set(this.type);
  }

  /** Focuses the native input element when the outer box is clicked. */
  focusInput(): void {
    if (!this.disabled) {
      this.inputEl?.nativeElement.focus();
    }
  }

  /** Toggles password visibility between masked and plain text. */
  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.showPassword.update((prev) => !prev);
    this.currentType.set(this.showPassword() ? 'text' : 'password');
  }

  /** Handles input value changes and notifies Angular forms. */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.internalValue.set(input.value);
    this.onChange(input.value);
  }

  /** Marks the field as focused for active border and label styling. */
  onFocus(): void {
    this.isFocused.set(true);
  }

  /** Marks the field as blurred and notifies Angular forms touched state. */
  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  /** Writes external form control value into the component signal. */
  writeValue(val: string | number | null | undefined): void {
    this.internalValue.set(val !== null && val !== undefined ? String(val) : '');
  }

  /** Registers the callback function triggered on value change. */
  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  /** Registers the callback function triggered when control is blurred. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Updates the disabled state from Angular form control. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
