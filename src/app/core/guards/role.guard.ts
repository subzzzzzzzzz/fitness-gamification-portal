import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userJson = localStorage.getItem('user');
  if (userJson) {
    const user = JSON.parse(userJson);
    const requiredRole = route.data?.['role'];
    if (!requiredRole || user.role === requiredRole) {
      return true;
    }
  }
  router.navigate(['/dashboard']);
  return false;
};
