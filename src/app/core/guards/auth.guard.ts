import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // 1. Check URL query parameters for handoff token from marketing site
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const handoffToken = urlParams.get('token');
    const refreshToken = urlParams.get('refresh');

    if (handoffToken) {
      tokenService.setAccessToken(handoffToken);
      if (refreshToken) {
        tokenService.setRefreshToken(refreshToken);
      }
      // Remove query parameters cleanly from address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  // 2. Check token presence
  const token = tokenService.getAccessToken();
  if (!token) {
    // Not authenticated: Redirect directly to marketing site login
    const marketingLoginUrl = `${environment.marketingUrl}/login`;
    if (typeof window !== 'undefined') {
      window.location.href = marketingLoginUrl;
    }
    return false;
  }

  // 3. If session profile is already in memory, admit user
  if (authService.currentUser()) {
    return true;
  }

  // 4. Validate token with backend (/api/v1/auth/me) to load live session
  return authService.loadCurrentUser().pipe(
    map((session) => {
      if (session && session.user) {
        return true;
      }
      const marketingLoginUrl = `${environment.marketingUrl}/login`;
      if (typeof window !== 'undefined') {
        window.location.href = marketingLoginUrl;
      }
      return false;
    }),
    catchError(() => {
      const marketingLoginUrl = `${environment.marketingUrl}/login`;
      if (typeof window !== 'undefined') {
        window.location.href = marketingLoginUrl;
      }
      return of(false);
    }),
  );
};
