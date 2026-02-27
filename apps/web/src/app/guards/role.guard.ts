import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '../services/auth.service';

export function roleGuard(...allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.user()?.role;

    if (role && allowedRoles.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
