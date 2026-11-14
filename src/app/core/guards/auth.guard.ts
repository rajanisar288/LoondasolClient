import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);

  // Check URL query parameters for handoff token from marketing site
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
      return true;
    }
  }

  // Check existing session in localStorage
  if (tokenService.getAccessToken()) {
    return true;
  }

  // Not authenticated: Redirect directly to marketing site login
  const marketingLoginUrl = `${environment.marketingUrl}/login`;
  if (typeof window !== 'undefined') {
    window.location.href = marketingLoginUrl;
  }
  return false;
};
