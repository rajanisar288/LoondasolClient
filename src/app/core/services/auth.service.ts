import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { SocketService } from './socket.service';
import {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  UserProfile,
  CompanyProfile,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenService = inject(TokenService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  readonly currentUser = signal<UserProfile | null>(null);
  readonly currentCompany = signal<CompanyProfile | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isSuperAdmin = computed(
    () =>
      !!this.currentUser()?.isSuperAdmin ||
      this.currentUser()?.roleName === 'SUPERADMIN' ||
      this.currentUser()?.email === 'admin@admin.com',
  );
  readonly effectiveCurrency = computed(
    () =>
      this.currentUser()?.branchCurrency ||
      this.currentCompany()?.currency ||
      this.currentCompany()?.companyCurrency ||
      'USD',
  );
  readonly effectiveTimezone = computed(
    () =>
      this.currentUser()?.branchTimezone ||
      this.currentCompany()?.timezone ||
      this.currentCompany()?.companyTimezone ||
      'UTC',
  );

  token(): string | null {
    return this.tokenService.getAccessToken();
  }

  constructor() {
    this.initSession();
  }

  /** Restores authenticated session from local storage on app boot. */
  private initSession(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      this.loadCurrentUser().subscribe();
    }
  }

  /** Registers company or employee account. */
  register(payload: RegisterPayload): Observable<AuthSession> {
    this.isLoading.set(true);
    if (payload.region) {
      this.tokenService.setRegionHint(payload.region);
    }
    return this.api.post<AuthSession>('auth/register', payload).pipe(
      tap((session) => {
        this.handleAuthSuccess(session);
        this.isLoading.set(false);
      }),
    );
  }

  /** Authenticates user credentials. */
  login(payload: LoginPayload): Observable<AuthSession> {
    this.isLoading.set(true);
    return this.api.post<AuthSession>('auth/login', payload).pipe(
      tap((session) => {
        this.handleAuthSuccess(session);
        this.isLoading.set(false);
      }),
    );
  }

  /** Verifies email with 6-digit confirmation code. */
  verifyEmail(email: string, code: string): Observable<AuthSession> {
    this.isLoading.set(true);
    return this.api.post<AuthSession>('auth/verify-email', { email, code }).pipe(
      tap((session) => {
        this.handleAuthSuccess(session);
        this.isLoading.set(false);
      }),
    );
  }

  /** Resends 6-digit verification code. */
  resendVerification(email: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('auth/resend-verification', {
      email,
    });
  }

  /** Loads profile of currently authenticated token. */
  loadCurrentUser(): Observable<AuthSession | null> {
    return this.api.get<AuthSession>('auth/me').pipe(
      tap((session) => {
        this.currentUser.set(session.user);
        this.currentCompany.set(session.company);
        this.socketService.connect();
      }),
      catchError(() => {
        this.socketService.disconnect();
        this.tokenService.clearSession();
        this.currentUser.set(null);
        this.currentCompany.set(null);
        return of(null);
      }),
    );
  }

  /** Updates current user profile details. */
  updateProfile(payload: Partial<UserProfile>): Observable<AuthSession> {
    this.isLoading.set(true);
    return this.api.patch<AuthSession>('auth/profile', payload).pipe(
      tap((session) => {
        this.currentUser.set(session.user);
        this.currentCompany.set(session.company);
        this.isLoading.set(false);
      }),
    );
  }

  /** Saves session state to signals and local storage. */
  private handleAuthSuccess(session: AuthSession): void {
    this.tokenService.saveSession(
      session.accessToken,
      session.refreshToken,
      session.company.region,
    );
    this.currentUser.set(session.user);
    this.currentCompany.set(session.company);
    this.socketService.connect();
  }

  /** Rotates refresh token and updates session. */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return of({ accessToken: '', refreshToken: '' });
    }

    return this.api
      .post<{ accessToken: string; refreshToken: string }>('auth/refresh', { refreshToken })
      .pipe(
        tap((tokens) => {
          this.tokenService.setAccessToken(tokens.accessToken);
          this.tokenService.setRefreshToken(tokens.refreshToken);
        }),
        catchError((err) => {
          this.logout();
          throw err;
        }),
      );
  }

  /** Revokes session, disconnects WebSocket presence immediately, and routes to login. */
  logout(): void {
    const token = this.tokenService.getAccessToken();
    this.socketService.disconnect();
    if (token) {
      this.api.post('auth/logout', {}).subscribe({
        error: () => {},
      });
    }

    this.tokenService.clearSession();
    this.currentUser.set(null);
    this.currentCompany.set(null);
    this.router.navigate(['/auth/login']);
  }

  /** Updates cached company profile in state. */
  updateCurrentCompany(company: Partial<CompanyProfile>): void {
    this.currentCompany.update((curr) => (curr ? { ...curr, ...company } : curr));
  }

  /** Formats a numeric amount in the employee's branch or company currency. */
  formatCurrency(
    amount: number | string | null | undefined,
    currencyOverride?: string,
  ): string {
    const numericValue = Number(amount ?? 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const code = (currencyOverride || this.effectiveCurrency() || 'USD').toUpperCase();
    const hasFraction = Math.abs(safeValue % 1) > 0.001;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch {
      return `${code} ${safeValue.toLocaleString('en-US', {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 2,
      })}`;
    }
  }

  /** Converts an IANA timezone name to a UTC offset string (e.g., '+05:00' or '-04:00') for Angular's DatePipe. */
  getTimezoneOffsetString(
    dateInput?: string | number | Date | null,
    tzOverride?: string,
  ): string {
    const tz = tzOverride || this.effectiveTimezone() || 'UTC';
    if (!tz || tz === 'UTC') return '+00:00';
    if (/^[+-]\d{2}:?\d{2}$/.test(tz)) return tz;
    const date = dateInput ? new Date(dateInput) : new Date();
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset',
      }).formatToParts(validDate);
      const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
      if (tzPart) {
        const cleaned = tzPart.replace('GMT', '').trim();
        return cleaned || '+00:00';
      }
    } catch {}
    return '+00:00';
  }

  /** Formats a date/time in the employee's branch or company timezone. */
  formatDateTime(
    dateInput: string | number | Date | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const tz = this.effectiveTimezone() || 'UTC';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        ...options,
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-US', options).format(date);
    }
  }

  // Client-side permission check for declarative UX rendering
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.isOwner) return true;
    return user.permissions?.includes(permission) ?? false;
  }

  // Check if user has at least one of the provided permissions
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.isOwner) return true;
    return permissions.some((p) => user.permissions?.includes(p) ?? false);
  }

  // Check if current authenticated user is company owner
  isCompanyOwner(): boolean {
    return !!this.currentUser()?.isOwner;
  }

  // Password reset OTP methods
  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('auth/forgot-password', { email });
  }

  verifyResetOtp(email: string, otp: string): Observable<{ success: boolean; valid: boolean }> {
    return this.api.post<{ success: boolean; valid: boolean }>('auth/verify-otp', { email, otp });
  }

  resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('auth/reset-password', payload);
  }
}
