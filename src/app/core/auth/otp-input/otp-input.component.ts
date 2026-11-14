import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  ViewChildren,
  QueryList,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppOtpInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
})
export class AppOtpInputComponent implements ControlValueAccessor {
  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  @Input() length = 6;
  @Input() label = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() error = '';
  @Input() set value(val: any) {
    this.writeValue(val);
  }

  @Output() completed = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  readonly digits = signal<string[]>(Array(6).fill(''));
  readonly activeIndex = signal<number>(0);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    const strVal = String(val || '').replace(/[^0-9]/g, '').slice(0, this.length);
    const newDigits = Array(this.length).fill('');
    for (let i = 0; i < strVal.length; i++) {
      newDigits[i] = strVal[i];
    }
    this.digits.set(newDigits);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocus(index: number): void {
    this.activeIndex.set(index);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    const currentDigits = [...this.digits()];
    if (val.length > 0) {
      currentDigits[index] = val[val.length - 1];
      this.digits.set(currentDigits);
      this.notifyChanges();

      if (index < this.length - 1) {
        this.focusBox(index + 1);
      }
    } else {
      currentDigits[index] = '';
      this.digits.set(currentDigits);
      this.notifyChanges();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    const currentDigits = [...this.digits()];

    if (event.key === 'Backspace') {
      if (!currentDigits[index] && index > 0) {
        currentDigits[index - 1] = '';
        this.digits.set(currentDigits);
        this.notifyChanges();
        this.focusBox(index - 1);
      } else {
        currentDigits[index] = '';
        this.digits.set(currentDigits);
        this.notifyChanges();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length - 1) {
      this.focusBox(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const cleanDigits = pastedText.replace(/[^0-9]/g, '').slice(0, this.length);

    if (cleanDigits) {
      const newDigits = Array(this.length).fill('');
      for (let i = 0; i < cleanDigits.length; i++) {
        newDigits[i] = cleanDigits[i];
      }
      this.digits.set(newDigits);
      this.notifyChanges();

      const nextFocus = Math.min(cleanDigits.length, this.length - 1);
      this.focusBox(nextFocus);
    }
  }

  private focusBox(index: number): void {
    this.activeIndex.set(index);
    setTimeout(() => {
      const box = this.otpBoxes?.toArray()[index];
      if (box?.nativeElement) {
        box.nativeElement.focus();
        box.nativeElement.select();
      }
    }, 0);
  }

  private notifyChanges(): void {
    const combined = this.digits().join('');
    this.onChange(combined);
    this.valueChange.emit(combined);
    this.onTouched();

    if (combined.length === this.length) {
      this.completed.emit(combined);
    }
  }
}
