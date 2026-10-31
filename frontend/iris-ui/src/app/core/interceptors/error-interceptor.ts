import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { Router } from '@angular/router';

import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const toastService =
    inject(ToastService);

  const router =
    inject(Router);

  return next(req).pipe(

    catchError((error: HttpErrorResponse) => {

      if (
        req.url.includes('/auth/logout') ||
        req.url.includes('/auth/login')
      ) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return throwError(() => error);
      }

      let message =
        'Something went wrong. Please try again.';

      let title = 'Request Failed';

      switch (error.status) {

        case 400:
          title = 'Invalid Request';

          message =
            error.error?.message ||
            'Please check the information you entered.';

          break;

        case 403:
          title = 'Access Denied';

          message =
            error.error?.message ||
            'You do not have permission to perform this action.';

          break;

        case 404:
          title = 'Not Found';

          message =
            error.error?.message ||
            'The requested resource could not be found.';

          break;

        case 409:
          title = 'Conflict';

          message =
            error.error?.message ||
            'This operation conflicts with existing data.';

          break;

        case 422:
          title = 'Validation Error';

          message =
            error.error?.message ||
            'Please check the entered information.';

          break;

        case 429:
          title = 'Too Many Requests';

          message =
            'Too many requests. Please wait and try again.';

          break;

        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';

          message =
            'The server is temporarily unavailable. Please try again later.';

          break;

        case 0:
          title = 'Connection Error';

          message =
            'Unable to connect to the server. Check your internet or server connection.';

          break;

        default:
          message =
            error.error?.message ||
            message;
      }

      toastService.error(
        message,
        title
      );

      return throwError(() => error);
    })

  );
};