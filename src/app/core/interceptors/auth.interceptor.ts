import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { CountryService } from '../services/country.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const countryService = inject(CountryService);
  const router = inject(Router);

  let clonedReq = req;
  const token = tokenService.getAccessToken();
  const region = tokenService.getRegionHint();
  const countryCode = countryService.getCountryCode();

  const headers: Record<string, string> = {};
  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (region && !req.headers.has('X-Region')) {
    headers['X-Region'] = region;
  }
  if (countryCode && !req.headers.has('x-country-code')) {
    headers['x-country-code'] = countryCode;
  }

  if (Object.keys(headers).length > 0) {
    clonedReq = req.clone({
      setHeaders: headers,
    });
  }

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const isAuthRoute =
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/refresh') ||
          req.url.includes('/auth/verify-email');
        if (!isAuthRoute) {
          tokenService.clearSession();
          router.navigate(['/auth/login']);
        }
      }
      return throwError(() => err);
    }),
  );
};
