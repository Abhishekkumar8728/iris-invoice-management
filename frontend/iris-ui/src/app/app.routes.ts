import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: '',
    canActivate: [authGuard],

    loadComponent: () =>
      import('./layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list/user-list').then((m) => m.UserListComponent),
      },

      {
        path: 'users/create',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-create/user-create').then((m) => m.UserCreateComponent),
      },

      {
        path: 'users/edit/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-edit/user-edit').then((m) => m.UserEditComponent),
      },
      {
        path: 'users',

        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/user-list/user-list').then((m) => m.UserListComponent),
          },

          {
            path: 'create',
            loadComponent: () =>
              import('./features/users/user-create/user-create').then((m) => m.UserCreateComponent),
          },

          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/users/user-create/user-create').then((m) => m.UserCreateComponent),
          },
        ],
      },

      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoice-list/invoice-list').then(
            (m) => m.InvoiceListComponent,
          ),
      },

      {
        path: 'invoices/create',
        loadComponent: () =>
          import('./features/invoices/invoice-create/invoice-create').then(
            (m) => m.InvoiceCreateComponent,
          ),
      },

      {
        path: 'invoices/:id/edit',
        canActivate: [roleGuard(['ADMIN', 'FINANCE', 'APPROVER'])],
        loadComponent: () =>
          import('./features/invoices/invoice-create/invoice-create').then(
            (m) => m.InvoiceCreateComponent,
          ),
      },

      {
        path: 'invoices/:id/approval',
        canActivate: [roleGuard(['ADMIN', 'APPROVER', 'FINANCE'])],
        loadComponent: () =>
          import('./features/invoices/invoice-approval/invoice-approval').then(
            (m) => m.InvoiceApprovalComponent,
          ),
      },

      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('./features/invoices/invoice-details/invoice-details').then(
            (m) => m.InvoiceDetailsComponent,
          ),
      },
      
{
  path: 'reports',
  loadComponent: () =>
    import('./features/reports/reports')
      .then(m => m.ReportsComponent)
},

      {
        path: 'vendors',
        loadComponent: () => import('./features/vendors/vendors').then((m) => m.VendorsComponent),
      },
      {
        path: 'vendors/create',
        loadComponent: () =>
          import('./features/vendors/vendor-create/vendor-create').then(
            (m) => m.VendorCreateComponent,
          ),
      },

      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications').then((m) => m.NotificationsComponent),
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];
