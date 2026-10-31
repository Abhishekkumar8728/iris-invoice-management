
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import {
  RegisterRequest,
  UserRole,
} from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MaterialFormModule,
  ],

  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly roles: UserRole[] = ['ADMIN', 'FINANCE', 'APPROVER', 'USER'];

  isLoading = false;

  errorMessage = '';
  successMessage = '';

  showPassword = false;
  showConfirmPassword = false;

  registerForm = this.fb.nonNullable.group({
    employeeId: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
      ],
    ],

    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    mobile: [
      '',
      [
        Validators.pattern(/^[0-9]{10}$/),
      ],
    ],

    department: [''],

    role: ['USER' as UserRole, Validators.required],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
      ],
    ],

    confirmPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
      ],
    ],
  });

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const form = this.registerForm.getRawValue();

    
    if (form.password !== form.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.registerForm.controls.confirmPassword.markAsTouched();
      return;
    }

    this.isLoading = true;

    const registrationPayload: RegisterRequest = {
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim() || undefined,
      department: form.department.trim() || undefined,
      password: form.password,
      role: form.role,
    };

    this.authService.register(registrationPayload).subscribe({
      next: response => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage =
            response.message || 'Registration failed.';
          return;
        }

        this.successMessage = 'User created successfully. Redirecting to login...';
        this.toast.success('User created successfully.');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },

      error: error => {
        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to create the account. Please try again.';
      },
    });
  }
}
