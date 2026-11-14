import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'purple'
  | 'sidebar';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./badge.component.html",
  styleUrl: "./badge.component.scss",
})
export class AppBadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() showDot = false;

  getBadgeClasses(): string {
    return {
      primary: 'bg-blue-50 text-[#2A65F6] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40',
      success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40',
      warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40',
      danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40',
      neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/40',
      info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/40',
      purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/40',
      sidebar: 'bg-white/20 text-white',
    }[this.variant];
  }

  getDotClasses(): string {
    return {
      primary: 'bg-[#2A65F6]',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
      neutral: 'bg-slate-400',
      info: 'bg-sky-500',
      purple: 'bg-purple-500',
      sidebar: 'bg-white',
    }[this.variant];
  }
}
