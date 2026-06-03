import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      let title = 'Error';
      let message = err.error?.message || err.message || 'An unexpected error occurred';

      if (err.status === 401) {
        title = 'Unauthorized';
        message = 'Please log in to continue.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      } else if (err.status === 403) {
        title = 'Forbidden';
        message = 'You do not have permission to access this resource.';
      } else if (err.status === 404) {
        title = 'Not Found';
        message = 'The requested resource could not be found.';
      } else if (err.status === 500) {
        title = 'Server Error';
        message = 'Internal server error occurred. Please try again later.';
      }

      toastService.error(title, message);
      return throwError(() => err);
    })
  );
};
