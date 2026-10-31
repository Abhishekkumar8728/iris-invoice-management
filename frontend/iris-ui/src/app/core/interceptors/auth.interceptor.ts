import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth.service';

let isRefreshing = false;

const refreshTokenSubject =
  new BehaviorSubject<string | null>(null);


export const authInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);



  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password');


  let authRequest = req;


  if (!isAuthRequest) {

    const accessToken =
      authService.getAccessToken();

    if (accessToken) {

      authRequest = req.clone({
        setHeaders: {
          Authorization:
            `Bearer ${accessToken}`
        }
      });
    }
  }



  return next(authRequest).pipe(

    catchError(
      (error: HttpErrorResponse) => {

        if (
          error.status !== 401 ||
          isAuthRequest
        ) {

          return throwError(
            () => error
          );
        }


        const refreshToken =
          authService.getRefreshToken();

        if (!refreshToken) {

          authService.clearSession();

          router.navigate(['/login']);

          return throwError(
            () => error
          );
        }



        if (isRefreshing) {

          return refreshTokenSubject.pipe(

            filter(
              token => token !== null
            ),

            take(1),

            switchMap(
              (newToken) => {

                const retryRequest =
                  req.clone({
                    setHeaders: {
                      Authorization:
                        `Bearer ${newToken}`
                    }
                  });

                return next(
                  retryRequest
                );
              }
            )
          );
        }



        isRefreshing = true;

        refreshTokenSubject.next(null);


        return authService
          .refreshToken()
          .pipe(

            switchMap(
              (response) => {

                isRefreshing = false;

                const newAccessToken =
                  response.data?.accessToken;

                if (!newAccessToken) {

                  authService.clearSession();

                  router.navigate([
                    '/login'
                  ]);

                  return throwError(
                    () => error
                  );
                }


                refreshTokenSubject.next(
                  newAccessToken
                );



                const retryRequest =
                  req.clone({
                    setHeaders: {
                      Authorization:
                        `Bearer ${newAccessToken}`
                    }
                  });

                return next(
                  retryRequest
                );
              }
            ),

            catchError(
              (refreshError) => {

                isRefreshing = false;

                refreshTokenSubject.next(null);

                authService.clearSession();

                router.navigate([
                  '/login'
                ]);

                return throwError(
                  () => refreshError
                );
              }
            )
          );
      }
    )
  );
};