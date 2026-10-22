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
  template: `
    <div class="w-full">
      <div
        (click)="focusTextarea()"
        class="relative w-full rounded-[8px] border bg-white dark:bg-[#202226] px-3.5 pt-2 pb-2 transition-colors duration-150 cursor-text"
        [ngClass]="[
          disabled ? 'bg-slate-50 dark:bg-slate-800/50 opacity-65 cursor-not-allowed' : '',
          error
            ? 'border-rose-500'
            : isFocused()
              ? 'border-[#1e3a8a] dark:border-[#2A65F6]'
              : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        ]"
      >
        @if (label) {
          <div class="flex items-center justify-between">
            <label
              [for]="id"
              class="block text-[11px] leading-4 font-medium select-none transition-colors pointer-events-none"
              [ngClass]="
                error
                  ? 'text-rose-500'
                  : isFocused()
                    ? 'text-[#1e3a8a] dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
              "
            >
              {{ label }}
            </label>
            @if (maxLength) {
              <span class="text-[10px] text-slate-400 font-mono">
                {{ internalValue().length }} / {{ maxLength }}
              </span>
            }
          </div>
        }
        <textarea
          #textareaEl
          [id]="id"
          [rows]="rows"
          [placeholder]="label ? (isFocused() ? placeholder : '') : placeholder"
          [disabled]="disabled"
          [maxLength]="maxLength ?? 5000"
          [value]="internalValue()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          class="block w-full bg-transparent border-0 p-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400/70 focus:outline-none focus:ring-0 disabled:cursor-not-allowed resize-y"
          [class.mt-0.5]="!!label"
        ></textarea>
      </div>
      @if (error) {
        <p class="mt-1 text-xs text-rose-500 font-medium">{{ error }}</p>
      }
    </div>
  `,
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
