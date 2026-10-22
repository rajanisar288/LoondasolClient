import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data?.['permissions'] as string[] | undefined;
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (authService.hasAnyPermission(requiredPermissions)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
