import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.scss",
})
export class AppButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  /** Emits button click event when enabled and not loading. */
  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.btnClick.emit(event);
  }

  /** Resolves size, variant, and width utility classes for the button. */
  getButtonClasses(): string {
    const sizeClasses = {
      sm: 'px-3 py-[10px] text-xs',
      md: 'px-4 py-[10px] text-sm',
      lg: 'px-6 py-[10px] text-base',
    }[this.size];

    const variantClasses = {
      primary:
        'bg-[#2A65F6] hover:bg-[#1E54D8] active:bg-[#1846BA] text-white dark:bg-[#343a3f] dark:hover:bg-[#3f464c] dark:border-slate-700 dark:text-white shadow-sm hover:shadow focus:ring-[#2A65F6]/20 border border-transparent',
      secondary:
        'bg-white dark:bg-[#202226] hover:bg-slate-50 dark:hover:bg-[#27292d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-subtle hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-200 dark:focus:ring-slate-700',
      outline:
        'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#2A65F6] dark:text-blue-400 border border-[#2A65F6]/40 hover:border-[#2A65F6] focus:ring-[#2A65F6]/20',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm hover:shadow focus:ring-rose-500/20 border border-transparent',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-slate-100 dark:focus:ring-slate-800 border border-transparent',
    }[this.variant];

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${sizeClasses} ${variantClasses} ${widthClass}`;
  }
}
