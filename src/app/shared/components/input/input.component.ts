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
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
  template: `
    <div class="w-full">
      <div
        (click)="focusInput()"
        class="relative w-full rounded-[8px] border bg-white dark:bg-[#202226] transition-colors duration-150 cursor-text"
        [ngClass]="[
          label ? 'px-3.5 pt-2 pb-2' : 'px-3.5 py-[10px]',
          disabled ? 'bg-slate-50 dark:bg-slate-800/50 opacity-65 cursor-not-allowed' : '',
          error
            ? 'border-rose-500'
            : isFocused()
              ? 'border-[#1e3a8a] dark:border-[#2A65F6]'
              : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        ]"
      >
        @if (label) {
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
        }
        <div class="relative flex items-center">
          @if (prefixIcon) {
            <span class="mr-2 text-sm text-slate-400 select-none">{{ prefixIcon }}</span>
          }
          <input
            #inputEl
            [id]="id"
            [type]="currentType()"
            [placeholder]="label ? (isFocused() ? placeholder : '') : placeholder"
            [disabled]="disabled"
            [value]="internalValue()"
            (input)="onInput($event)"
            (focus)="onFocus()"
            (blur)="onBlur()"
            class="block w-full bg-transparent border-0 p-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400/70 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
            [class.mt-0.5]="!!label"
            [class.pr-8]="type === 'password' || !!suffixText"
          />
          @if (type === 'password') {
            <button
              type="button"
              (click)="togglePasswordVisibility($event)"
              class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              tabindex="-1"
              aria-label="Toggle password visibility"
            >
              @if (showPassword()) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
            </button>
          } @else if (suffixText) {
            <span class="pointer-events-none absolute right-0 text-xs text-slate-400 font-medium">
              {{ suffixText }}
            </span>
          }
        </div>
      </div>
      @if (error) {
        <p class="mt-1 text-xs text-rose-500 font-medium">{{ error }}</p>
      }
    </div>
  `,
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
