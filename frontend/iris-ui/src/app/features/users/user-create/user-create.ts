import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  UserRole
} from '../../../core/models/auth.model';

import {
  CreateUserRequest,
  UpdateUserRequest,
  User
} from '../../../core/models/user.model';

import {
  UserService
} from '../../../core/services/user.service';

import {
  ToastService
} from '../../../core/services/toast.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialFormModule
  ],
  templateUrl: './user-create.html',
  styleUrl: './user-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCreateComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isEditMode = false;
  userId = '';

  loading = false;
  saving = false;

  errorMessage = '';

  employeeId = '';
  name = '';
  email = '';
  mobile = '';
  role: UserRole = 'USER';
  department = '';
  designation = '';
  password = '';
  confirmPassword = '';
  isActive = true;

  showPassword = false;
  showConfirmPassword = false;

  readonly roles: UserRole[] = [
    'ADMIN',
    'FINANCE',
    'APPROVER',
    'USER'
  ];

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.userId = id;
      this.loadUser(id);
    }
  }

  loadUser(id: string): void {

    this.loading = true;
    this.errorMessage = '';

    this.userService.getUser(id).subscribe({

      next: response => {

        const user = response.data;

        this.employeeId = user.employeeId;
        this.name = user.name;
        this.email = user.email;
        this.mobile = user.mobile || '';
        this.role = user.role;
        this.department = user.department || '';
        this.designation = user.designation || '';
        this.isActive = user.isActive;

        this.loading = false;
      },

      error: error => {

        this.loading = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to load user details.';

        this.toast.error(this.errorMessage);
      }
    });
  }

  save(): void {

    this.errorMessage = '';

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {

    const payload: CreateUserRequest = {
      employeeId: this.employeeId.trim(),
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      mobile: this.mobile.trim() || undefined,
      password: this.password,
      role: this.role,
      department: this.department.trim() || undefined,
      designation: this.designation.trim() || undefined,
      isActive: this.isActive
    };

    this.userService.createUser(payload).subscribe({

      next: response => {

        this.saving = false;

        this.toast.success(
          response.message ||
          'User created successfully.'
        );

        this.router.navigate(['/users']);
      },

      error: error => {

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to create user.';

        this.toast.error(this.errorMessage);
      }
    });
  }

  private updateUser(): void {

    const payload: UpdateUserRequest = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      mobile: this.mobile.trim() || undefined,
      role: this.role,
      department: this.department.trim() || undefined,
      designation: this.designation.trim() || undefined,
      isActive: this.isActive
    };

    this.userService.updateUser(
      this.userId,
      payload
    ).subscribe({

      next: response => {

        this.saving = false;

        this.toast.success(
          response.message ||
          'User updated successfully.'
        );

        this.router.navigate(['/users']);
      },

      error: error => {

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to update user.';

        this.toast.error(this.errorMessage);
      }
    });
  }

  validateForm(): boolean {

    this.employeeId = this.employeeId.trim();
    this.name = this.name.trim();
    this.email = this.email.trim();
    this.mobile = this.mobile.trim();
    this.department = this.department.trim();
    this.designation = this.designation.trim();

    if (!this.employeeId) {
      this.showValidation('Employee ID is required.');
      return false;
    }

    if (!/^[A-Za-z0-9_-]{2,30}$/.test(this.employeeId)) {
      this.showValidation(
        'Employee ID must contain only letters, numbers, hyphens or underscores.'
      );
      return false;
    }

    if (!this.name) {
      this.showValidation('Name is required.');
      return false;
    }

    if (this.name.length < 2) {
      this.showValidation('Name must contain at least 2 characters.');
      return false;
    }

    if (!this.email) {
      this.showValidation('Email address is required.');
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.showValidation('Please enter a valid email address.');
      return false;
    }

    if (this.mobile && !/^[6-9]\d{9}$/.test(this.mobile)) {
      this.showValidation(
        'Please enter a valid 10-digit Indian mobile number.'
      );
      return false;
    }

    if (!this.role) {
      this.showValidation('Please select a role.');
      return false;
    }

    if (!this.isEditMode) {

      if (!this.password) {
        this.showValidation('Password is required.');
        return false;
      }

      if (this.password.length < 8) {
        this.showValidation(
          'Password must contain at least 8 characters.'
        );
        return false;
      }

      if (!/[A-Z]/.test(this.password)) {
        this.showValidation(
          'Password must contain at least one uppercase letter.'
        );
        return false;
      }

      if (!/[a-z]/.test(this.password)) {
        this.showValidation(
          'Password must contain at least one lowercase letter.'
        );
        return false;
      }

      if (!/[0-9]/.test(this.password)) {
        this.showValidation(
          'Password must contain at least one number.'
        );
        return false;
      }

      if (this.password !== this.confirmPassword) {
        this.showValidation(
          'Password and confirm password do not match.'
        );
        return false;
      }
    }

    return true;
  }

  private isValidEmail(email: string): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private showValidation(message: string): void {

    this.errorMessage = message;

    this.toast.error(message);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  get passwordStrength(): string {

    if (!this.password) {
      return '';
    }

    let score = 0;

    if (this.password.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(this.password)) {
      score++;
    }

    if (/[a-z]/.test(this.password)) {
      score++;
    }

    if (/[0-9]/.test(this.password)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(this.password)) {
      score++;
    }

    if (score <= 2) {
      return 'weak';
    }

    if (score <= 4) {
      return 'medium';
    }

    return 'strong';
  }
}