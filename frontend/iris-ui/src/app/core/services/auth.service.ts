import { Injectable, inject } from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  finalize,
  tap
} from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CreateAdminUserRequest,
  RefreshTokenResponse,
  MeResponse,
  User,
  LogoutResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  UserResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl =
    `${environment.apiUrl}/auth`;

  private readonly ACCESS_TOKEN_KEY =
    'iris_access_token';

  private readonly REFRESH_TOKEN_KEY =
    'iris_refresh_token';

  private readonly USER_KEY =
    'iris_user';



  login(
    credentials: LoginRequest
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(

        tap((response) => {

          if (!response?.success) {
            return;
          }

          const accessToken =
            response.data?.accessToken;

          const refreshToken =
            response.data?.refreshToken;

          if (accessToken) {
            this.setAccessToken(accessToken);
          }

          if (refreshToken) {
            this.setRefreshToken(refreshToken);
          }

          if (response.data?.user) {
            this.setStoredUser(
              response.data.user
            );
          }
        })
      );
  }
  register(
  data: RegisterRequest
): Observable<RegisterResponse> {

  return this.http.post<RegisterResponse>(
    `${this.apiUrl}/register`,
    data
  );

}


  refreshToken(): Observable<RefreshTokenResponse> {

    const refreshToken =
      this.getRefreshToken();

    if (!refreshToken) {
      throw new Error(
        'Refresh token is not available.'
      );
    }

    return this.http
      .post<RefreshTokenResponse>(
        `${this.apiUrl}/refresh`,
        {
          refreshToken
        }
      )
      .pipe(

        tap((response) => {

          if (!response?.success) {
            return;
          }

          const newAccessToken =
            response.data?.accessToken;

          const newRefreshToken =
            response.data?.refreshToken;

          if (newAccessToken) {
            this.setAccessToken(
              newAccessToken
            );
          }

          if (newRefreshToken) {
            this.setRefreshToken(
              newRefreshToken
            );
          }
        })
      );
  }

  createAdminUser(
    payload: CreateAdminUserRequest
  ): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${this.apiUrl}/admin/users`,
      payload
    );
  }



  getMe(): Observable<MeResponse> {

    return this.http
      .get<MeResponse>(
        `${this.apiUrl}/me`
      )
      .pipe(

        tap((response) => {

          if (
            response?.success &&
            response.data
          ) {
            const existingUser = this.getStoredUser();
            this.setStoredUser(
              {
                ...existingUser,
                ...response.data,
                name:
                  response.data.name?.trim() ||
                  existingUser?.name ||
                  response.data.employeeId,
              }
            );
          }
        })
      );
  }



  getAccessToken(): string | null {

    return localStorage.getItem(
      this.ACCESS_TOKEN_KEY
    );
  }

  private setAccessToken(
    token: string
  ): void {

    localStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      token
    );
  }



  getRefreshToken(): string | null {

    return localStorage.getItem(
      this.REFRESH_TOKEN_KEY
    );
  }


  private setRefreshToken(
    token: string
  ): void {

    localStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      token
    );
  }



  getStoredUser(): User | null {

    const user =
      localStorage.getItem(
        this.USER_KEY
      );

    if (!user) {
      return null;
    }

    try {

      return JSON.parse(user);

    } catch {

      return null;
    }
  }


  private setStoredUser(
    user: User
  ): void {

    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify(user)
    );
  }


  getCurrentUser(): User | null {

    return this.getStoredUser();
  }


  getUserRole(): string | null {

    const user =
      this.getStoredUser();

    return user?.role ?? null;
  }


  isAdmin(): boolean {

    return this.getUserRole() === 'ADMIN';
  }



  isLoggedIn(): boolean {

    return !!this.getAccessToken();
  }



  logout(): Observable<LogoutResponse> {

    const refreshToken =
      this.getRefreshToken();

    if (!refreshToken) {

      this.clearSession();

      return new Observable(
        subscriber => {

          subscriber.next({
            success: true,
            message: 'Logged out.'
          });

          subscriber.complete();
        }
      );
    }

    return this.http
      .post<LogoutResponse>(
        `${this.apiUrl}/logout`,
        {
          refreshToken
        }
      )
      .pipe(

        finalize(() => {
          this.clearSession();
        })
      );
  }



  clearSession(): void {

    localStorage.removeItem(
      this.ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      this.REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
      this.USER_KEY
    );
  }
  forgotPassword(
    email: string
  ): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }
  resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Observable<ResetPasswordResponse> {

  return this.http.post<ResetPasswordResponse>(
    `${this.apiUrl}/reset-password`,
    {
      email,
      otp,
      newPassword
    }
  );
}
}