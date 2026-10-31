import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-reset-password',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MaterialFormModule
  ],

  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;

  errorMessage = '';
  successMessage = '';
  success = false;
  token = '';

  resetForm = this.fb.nonNullable.group({

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ],

    confirmPassword: [
      '',
      Validators.required
    ]

  });

  ngOnInit(): void {
    this.token =
      this.route.snapshot.queryParamMap.get('token') || '';
  }

  get password() {
    return this.resetForm.controls.password;
  }

  get confirmPassword() {
    return this.resetForm.controls.confirmPassword;
  }

  submit(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetForm.invalid) {

      this.resetForm.markAllAsTouched();

      return;
    }

    const value =
      this.resetForm.getRawValue();

    if (
      value.password !==
      value.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match.';

      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid or missing password reset token.';
      return;
    }

    this.loading = true;

    this.authService
      .resetPassword(
        this.token,
        value.password,
        value.confirmPassword
      )
      .subscribe({

        next: response => {

          this.loading = false;
          this.success = true;

          this.successMessage =
            response.message ||
            'Password reset successfully.';

          setTimeout(() => {

            this.router.navigate([
              '/login'
            ]);

          }, 1500);

        },

        error: error => {

          this.loading = false;

          this.errorMessage =
            error?.error?.message ||
            'Invalid or expired OTP.';

        }

      });
  }
}