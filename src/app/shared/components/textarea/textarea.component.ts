import {
  Component,
  Input,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTextareaComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./textarea.component.html",
  styleUrl: "./textarea.component.scss",
})
export class AppTextareaComponent implements ControlValueAccessor {
  @ViewChild('textareaEl') textareaEl?: ElementRef<HTMLTextAreaElement>;

  @Input() id = `textarea_${Math.random().toString(36).substring(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() rows = 3;
  @Input() maxLength?: number;
  @Input() required = false;
  @Input() showOptional = false;
  @Input() hint?: string;
  @Input() helperText?: string;
  @Input() error?: string | null;
  @Input() disabled = false;

  @Input()
  set value(val: string | null | undefined) {
    this.internalValue.set(val || '');
  }

  readonly internalValue = signal<string>('');
  readonly isFocused = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  /** Focuses the native textarea element when the outer box is clicked. */
  focusTextarea(): void {
    if (!this.disabled) {
      this.textareaEl?.nativeElement.focus();
    }
  }

  /** Handles textarea input changes and notifies Angular forms. */
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.internalValue.set(textarea.value);
    this.onChange(textarea.value);
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
  writeValue(val: string): void {
    this.internalValue.set(val || '');
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
