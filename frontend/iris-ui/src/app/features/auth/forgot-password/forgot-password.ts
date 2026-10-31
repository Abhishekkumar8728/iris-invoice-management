import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  RouterLink,
  Router
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-forgot-password',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MaterialFormModule
  ],

  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;

  successMessage = '';
  errorMessage = '';

  otpSent = false;

  developmentOtp = '';

  get emailControl() {
    return this.forgotForm.controls.email;
  }

  get email() {
    return this.emailControl;
  }

  forgotForm = this.fb.nonNullable.group({

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ]

  });

  submit(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {

      this.forgotForm.markAllAsTouched();

      return;
    }

    this.loading = true;

    const email =
      this.forgotForm.controls.email.value
        .trim()
        .toLowerCase();

    this.authService
      .forgotPassword(email)
      .subscribe({

        next: response => {

          this.loading = false;

          this.otpSent = true;

          this.successMessage =
            response.message ||
            'If the account exists, an OTP has been sent.';

          if (response.data?.otp) {
            this.developmentOtp =
              response.data.otp;
          }

        },

        error: error => {

          this.loading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to send OTP.';

        }

      });
  }
}