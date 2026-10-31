import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = () => {

  const router = inject(Router);

  const token = localStorage.getItem('iris_access_token');

  if (token) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};