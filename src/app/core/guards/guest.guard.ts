import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.getAccessToken()) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Redirect unauthenticated visitor to the dedicated Next.js marketing auth portal
  if (typeof window !== 'undefined') {
    const search = window.location.search;
    const pathname = window.location.pathname;

    if (search.includes('token=') || pathname.includes('invite')) {
      window.location.href = `${environment.marketingUrl}/invite${search}`;
      return false;
    }

    if (pathname.includes('register') || pathname.includes('signup')) {
      window.location.href = `${environment.marketingUrl}/signup${search}`;
      return false;
    }

    window.location.href = `${environment.marketingUrl}/login${search}`;
    return false;
  }

  return true;
};
