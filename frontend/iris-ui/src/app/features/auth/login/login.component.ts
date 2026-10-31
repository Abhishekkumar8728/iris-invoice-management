import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MaterialFormModule
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class Login implements OnDestroy {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly toast = inject(ToastService);
  loading = false;
  errorMessage = '';
  retryAfterSeconds = 0;
  hidePassword = true;
  imageError = false;
  private retryTimer?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
  }

  loginForm = this.fb.nonNullable.group({

    identifier: [
      '',
      Validators.required
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ]

  });

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onImageError(): void {
    this.imageError = true;
  }

  submit(): void {
    if (this.loading || this.retryAfterSeconds > 0) {
      return;
    }

    this.errorMessage = '';

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    this.authService
      .login(this.loginForm.getRawValue())
      .subscribe({

        next: response => {
          this.loading = false;

          if (!response?.success || !response.data?.accessToken) {
            this.errorMessage =
              response?.message ||
              'Invalid employee ID/email or password.';
            return;
          }

          this.toast.success('You have logged in successfully.');
          this.router.navigate(['/dashboard']);

        },

        error: (error: HttpErrorResponse) => {

          this.loading = false;

          if (error.status === 429) {
            this.startRetryCooldown(error);
            return;
          }

          this.errorMessage = error.error?.message ||
            'Invalid employee ID/email or password.';

        }

      });
  }

  private startRetryCooldown(error: HttpErrorResponse): void {
    const resetSeconds = Number(
      error.headers.get('RateLimit-Reset') ??
      error.headers.get('Retry-After')
    );

    if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
      this.retryAfterSeconds = Math.ceil(resetSeconds);

      if (this.retryTimer) {
        clearInterval(this.retryTimer);
      }

      this.retryTimer = setInterval(() => {
        this.retryAfterSeconds = Math.max(0, this.retryAfterSeconds - 1);

        if (this.retryAfterSeconds === 0 && this.retryTimer) {
          clearInterval(this.retryTimer);
          this.retryTimer = undefined;
        }

        this.setRateLimitMessage();
      }, 1000);
    }

    this.setRateLimitMessage();
  }

  private setRateLimitMessage(): void {
    if (this.retryAfterSeconds <= 0) {
      this.errorMessage = '';
      return;
    }

    const wait = this.retryAfterSeconds < 60
      ? `${this.retryAfterSeconds} second${this.retryAfterSeconds === 1 ? '' : 's'}`
      : `${Math.ceil(this.retryAfterSeconds / 60)} minute${Math.ceil(this.retryAfterSeconds / 60) === 1 ? '' : 's'}`;

    this.errorMessage =
      `Too many failed sign-in attempts. Please wait ${wait} before trying again.`;
  }
}