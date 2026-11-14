import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxSize = 'sm' | 'md' | 'lg';
export type CheckboxVariant = 'brand' | 'emerald';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppCheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./checkbox.component.html",
  styleUrl: "./checkbox.component.scss",
})
export class AppCheckboxComponent implements ControlValueAccessor {
  @Input() set checked(value: boolean) {
    this.isChecked.set(Boolean(value));
  }
  @Input() indeterminate = false;
  @Input() disabled = false;
  @Input() label = '';
  @Input() description = '';
  @Input() size: CheckboxSize = 'md';
  @Input() variant: CheckboxVariant = 'brand';

  @Output() checkedChange = new EventEmitter<boolean>();

  readonly isChecked = signal(false);
  readonly isFocused = signal(false);

  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.isChecked.set(Boolean(value));
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

  onToggle(event: Event): void {
    if (this.disabled) return;
    const target = event.target as HTMLInputElement;
    const newChecked = target.checked;
    this.isChecked.set(newChecked);
    this.onChange(newChecked);
    this.checkedChange.emit(newChecked);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  getSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      case 'md':
      default:
        return 'w-5 h-5';
    }
  }

  getIconSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'w-2.5 h-2.5';
      case 'lg':
        return 'w-4 h-4';
      case 'md':
      default:
        return 'w-3.5 h-3.5';
    }
  }

  getBoxStateClasses(): string {
    const isEmerald = this.variant === 'emerald';
    const activeBg = isEmerald
      ? 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700'
      : 'bg-[#2A65F6] border-[#2A65F6] hover:bg-[#1D4ED8] hover:border-[#1D4ED8]';

    if (this.isChecked() || this.indeterminate) {
      return activeBg;
    }

    return 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500';
  }
}
