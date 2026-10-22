import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Pipe({
  name: 'date',
  standalone: true,
  pure: false,
})
export class WorkspaceDatePipe implements PipeTransform {
  private readonly authService = inject(AuthService);
  private readonly datePipe = new DatePipe('en-US');

  /** Formats dates and timestamps in the current user's effective branch or company timezone. */
  transform(
    value: Date | string | number | null | undefined,
    format = 'mediumDate',
    timezone?: string,
    locale = 'en-US',
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const isDateOnlyString =
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    const resolvedTz = isDateOnlyString
      ? '+00:00'
      : timezone
        ? this.authService.getTimezoneOffsetString(value, timezone)
        : this.authService.getTimezoneOffsetString(value);
    return this.datePipe.transform(value, format, resolvedTz, locale);
  }
}

@Pipe({
  name: 'currency',
  standalone: true,
  pure: false,
})
export class WorkspaceCurrencyPipe implements PipeTransform {
  private readonly authService = inject(AuthService);

  /** Formats monetary values in the current user's effective branch or company currency. */
  transform(
    value: number | string | null | undefined,
    currencyCode?: string,
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return this.authService.formatCurrency(value, currencyCode);
  }
}
