import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';
import { User } from '../../../core/models/user.model';

import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation';
import { MaterialFormModule } from '../../../shared/material-form.module';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialFormModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);

  users: User[] = [];

  loading = false;
  errorMessage = '';

  search = '';
  selectedRole: UserRole | '' = '';
  department = '';
  selectedStatus: 'active' | 'inactive' | '' = '';

  successMessage = '';

  page = 1;
  limit = 10;

  total = 0;
  totalPages = 0;

  readonly roles: UserRole[] = [
    'ADMIN',
    'FINANCE',
    'APPROVER',
    'USER'
  ];

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {

    this.loading = true;
    this.errorMessage = '';

    let isActive: boolean | null = null;

    if (this.selectedStatus === 'active') {
      isActive = true;
    }

    if (this.selectedStatus === 'inactive') {
      isActive = false;
    }

    this.userService.getUsers(
      this.page,
      this.limit,
      this.search,
      this.selectedRole,
      this.department,
      isActive
    ).subscribe({
      next: response => {

        this.users = response.data.users;

        this.total = response.data.pagination.total;
        this.totalPages = response.data.pagination.pages;

        this.loading = false;
      },

      error: error => {

        this.loading = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to load users.';

        this.toast.error(this.errorMessage);
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUsers();
  }

  searchUsers(): void {
    this.applyFilters();
  }

  resetFilters(): void {

    this.search = '';
    this.selectedRole = '';
    this.department = '';
    this.selectedStatus = '';

    this.page = 1;

    this.loadUsers();
  }

  createUser(): void {
    this.router.navigate(['/users/create']);
  }

  editUser(userId: string): void {
    this.router.navigate(['/users', userId, 'edit']);
  }

  toggleUser(user: User): void {

    const action = user.isActive
      ? 'deactivate'
      : 'activate';

    const title = user.isActive
      ? 'Deactivate User'
      : 'Activate User';

    const message = user.isActive
      ? `Are you sure you want to deactivate ${user.name}?`
      : `Are you sure you want to activate ${user.name}?`;

    this.confirmation.confirm({
      title,
      message,
      confirmText: user.isActive
        ? 'Deactivate'
        : 'Activate',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {

      if (!confirmed) {
        return;
      }

      const request$ = user.isActive
        ? this.userService.deactivateUser(user.id)
        : this.userService.activateUser(user.id);

      request$.subscribe({
        next: response => {

          this.toast.success(
            response.message ||
            `User ${action}d successfully.`
          );

          this.successMessage = response.message ||
            `User ${action}d successfully.`;

          this.loadUsers();
        },

        error: error => {

          this.toast.error(
            error?.error?.message ||
            `Unable to ${action} user.`
          );
        }
      });
    });
  }

  deleteUser(user: User): void {

    this.confirmation.confirm({
      title: 'Delete User',
      message:
        `Are you sure you want to permanently delete ${user.name}? ` +
        'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    }).subscribe(confirmed => {

      if (!confirmed) {
        return;
      }

      this.userService.deleteUser(user.id).subscribe({

        next: response => {

          this.toast.success(
            response.message ||
            'User deleted successfully.'
          );

          this.successMessage = response.message ||
            'User deleted successfully.';

          if (
            this.users.length === 1 &&
            this.page > 1
          ) {
            this.page--;
          }

          this.loadUsers();
        },

        error: error => {

          this.toast.error(
            error?.error?.message ||
            'Unable to delete user.'
          );
        }
      });
    });
  }

  activateUser(user: User): void {
    this.toggleUser(user);
  }

  deactivateUser(user: User): void {
    this.toggleUser(user);
  }

  previousPage(): void {

    if (this.page <= 1) {
      return;
    }

    this.page--;
    this.loadUsers();
  }

  nextPage(): void {

    if (this.page >= this.totalPages) {
      return;
    }

    this.page++;
    this.loadUsers();
  }

  getStartRecord(): number {

    if (this.total === 0) {
      return 0;
    }

    return ((this.page - 1) * this.limit) + 1;
  }

  getEndRecord(): number {
    return Math.min(
      this.page * this.limit,
      this.total
    );
  }

  getRoleClass(role: UserRole): string {

    switch (role) {
      case 'ADMIN':
        return 'role-admin';

      case 'FINANCE':
        return 'role-finance';

      case 'APPROVER':
        return 'role-approver';

      default:
        return 'role-user';
    }
  }
}