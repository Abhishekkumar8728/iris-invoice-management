import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialFormModule],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userId = '';

  loading = false;
  loadingUser = true;

  errorMessage = '';
  successMessage = '';

  userForm = this.fb.nonNullable.group({
    employeeId: [{ value: '', disabled: true }],

    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],

    email: ['', [Validators.required, Validators.email]],

    mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

    role: ['USER', Validators.required],

    department: [''],

    designation: [''],

    isActive: [true],
  });

  get f() {
    return this.userForm.controls;
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.userId) {
      this.router.navigate(['/users']);
      return;
    }

    this.loadUser();
  }

  loadUser(): void {
    this.loadingUser = true;
    this.errorMessage = '';

    this.userService.getUser(this.userId).subscribe({
      next: (response) => {
        const user = response.data;

        this.userForm.patchValue({
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          mobile: user.mobile || '',
          role: user.role,
          department: user.department || '',
          designation: user.designation || '',
          isActive: user.isActive,
        });

        this.loadingUser = false;
      },

      error: (error) => {
        console.error(error);

        this.errorMessage = error?.error?.message || 'Unable to load user.';

        this.loadingUser = false;
      },
    });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const value = this.userForm.getRawValue();

    this.userService
      .updateUser(this.userId, {
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        mobile: value.mobile.trim() || undefined,
        role: value.role as 'ADMIN' | 'FINANCE' | 'APPROVER' | 'USER',
        department: value.department.trim() || undefined,
        designation: value.designation.trim() || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: () => {
          this.loading = false;

          this.successMessage = 'User updated successfully.';

          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 800);
        },

        error: (error) => {
          this.loading = false;

          this.errorMessage = error?.error?.message || 'Unable to update user.';
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
