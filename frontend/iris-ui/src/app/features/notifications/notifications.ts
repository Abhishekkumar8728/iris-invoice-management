import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { Router } from '@angular/router';

import { MaterialFormModule } from '../../shared/material-form.module';

import { Subject, takeUntil } from 'rxjs';

import { NotificationService } from '../../core/services/notification.service';

import { Notification } from '../../core/models/notification.model';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications',

  standalone: true,

  imports: [CommonModule, DatePipe, MaterialFormModule],

  templateUrl: './notifications.html',

  styleUrl: './notifications.scss',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  

  private readonly notificationService = inject(NotificationService);

  private readonly router = inject(Router);

  private readonly toast = inject(ToastService);

  private readonly destroy$ = new Subject<void>();

  

  notifications: Notification[] = [];

  

  loading = true;

  processing = false;

  errorMessage = '';

  

  selectedCategory: 'ALL' | 'UNREAD' | 'INVOICES' | 'PURCHASE_ORDERS' | 'SYSTEM' = 'ALL';

  

  searchTerm = '';

  

  ngOnInit(): void {
    this.loadNotifications();
  }

  

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }

  

  loadNotifications(): void {
    this.loading = true;

    this.errorMessage = '';

    

    this.notificationService
      .getNotifications(1, 50, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage = response.message || 'Unable to load notifications.';

            this.loading = false;

            return;
          }

          this.notifications = response.data || [];

          this.loading = false;
        },

        error: error => {

  console.error(
    'Notification error:',
    error
  );

  
  if (error?.status === 404) {

    this.notifications = [];

    this.errorMessage = '';

    this.loading = false;

    return;

  }


  
  this.errorMessage =
    error?.error?.message ||
    'Unable to load notifications.';

  this.loading = false;

},
      });
  }

  

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input?.value?.trim() || '';
  }

  

  get filteredNotifications(): Notification[] {
    let result = [...this.notifications];

    

    switch (this.selectedCategory) {
      case 'UNREAD':
        result = result.filter((notification) => !notification.isRead);

        break;

      case 'INVOICES':
        result = result.filter((notification) => this.isInvoiceNotification(notification));

        break;

      case 'PURCHASE_ORDERS':
        result = result.filter((notification) => this.isPurchaseOrderNotification(notification));

        break;

      case 'SYSTEM':
        result = result.filter((notification) => this.isSystemNotification(notification));

        break;

      case 'ALL':

      default:
        break;
    }

    

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();

      result = result.filter((notification) => {
        const title = notification.title?.toLowerCase() || '';

        const message = notification.message?.toLowerCase() || '';

        const type = notification.type?.toLowerCase() || '';

        return title.includes(search) || message.includes(search) || type.includes(search);
      });
    }

    return result;
  }

  

  setCategory(category: 'ALL' | 'UNREAD' | 'INVOICES' | 'PURCHASE_ORDERS' | 'SYSTEM'): void {
    this.selectedCategory = category;
  }

  

  getCategoryCount(category: 'ALL' | 'UNREAD' | 'INVOICES' | 'PURCHASE_ORDERS' | 'SYSTEM'): number {
    switch (category) {
      case 'ALL':
        return this.notifications.length;

      case 'UNREAD':
        return this.notifications.filter((notification) => !notification.isRead).length;

      case 'INVOICES':
        return this.notifications.filter((notification) => this.isInvoiceNotification(notification))
          .length;

      case 'PURCHASE_ORDERS':
        return this.notifications.filter((notification) =>
          this.isPurchaseOrderNotification(notification),
        ).length;

      case 'SYSTEM':
        return this.notifications.filter((notification) => this.isSystemNotification(notification))
          .length;

      default:
        return 0;
    }
  }

  

  private isInvoiceNotification(notification: Notification): boolean {
    const type = String(notification.type || '').toUpperCase();

    const relatedType = String(notification.relatedEntity?.type || '').toUpperCase();

    return relatedType === 'INVOICE' || type.startsWith('INVOICE_');
  }

  

  private isPurchaseOrderNotification(notification: Notification): boolean {
    const type = String(notification.type || '').toUpperCase();

    const relatedType = String(notification.relatedEntity?.type || '').toUpperCase();

    return (
      relatedType === 'PURCHASE_ORDER' ||
      relatedType === 'PO' ||
      type.includes('PURCHASE_ORDER') ||
      type.startsWith('PO_')
    );
  }

  

  private isSystemNotification(notification: Notification): boolean {
    return (
      !this.isInvoiceNotification(notification) && !this.isPurchaseOrderNotification(notification)
    );
  }

  

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.isRead).length;
  }

  

  markAsRead(notification: Notification): void {
    if (notification.isRead || this.processing) {
      return;
    }

    const id = this.notificationService.getId(notification);

    if (!id) {
      return;
    }

    this.notificationService
      .markAsRead(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            return;
          }

          notification.isRead = true;

          notification.readAt = new Date().toISOString();
        },

        error: (error) => {
          console.error('Mark notification read error:', error);
        },
      });
  }

  

  markAllAsRead(): void {
    if (this.unreadCount === 0 || this.processing) {
      return;
    }

    this.processing = true;

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.processing = false;

          if (!response.success) {
            this.toast.error(response.message || 'Unable to mark notifications as read.');

            return;
          }

          this.notifications = this.notifications.map((notification) => ({
            ...notification,

            isRead: true,

            readAt: new Date().toISOString(),
          }));

          this.toast.success('All notifications marked as read.');
        },

        error: (error) => {
          this.processing = false;

          this.toast.error(error?.error?.message || 'Unable to mark notifications as read.');
        },
      });
  }

  

  openNotification(notification: Notification): void {
    this.markAsRead(notification);

    const entity = notification.relatedEntity;

    if (entity?.type === 'INVOICE' && entity.id) {
      this.router.navigate(['/invoices', entity.id]);

      return;
    }
  }

  

  getIcon(notification: Notification): string {
    switch (notification.type) {
      case 'INVOICE_SUBMITTED':
        return 'send';

      case 'INVOICE_APPROVED':
        return 'check_circle';

      case 'INVOICE_REJECTED':
        return 'cancel';

      case 'INVOICE_PROCESSED':
        return 'settings';

      case 'INVOICE_PAID':
        return 'currency_rupee';

      case 'INVOICE_UPDATED':
        return 'edit';

      default:
        return 'notifications';
    }
  }

  

  getIconClass(notification: Notification): string {
    switch (notification.type) {
      case 'INVOICE_APPROVED':

      case 'INVOICE_PAID':
        return 'icon-success';

      case 'INVOICE_REJECTED':
        return 'icon-danger';

      case 'INVOICE_SUBMITTED':

      case 'INVOICE_UPDATED':
        return 'icon-info';

      default:
        return 'icon-default';
    }
  }

  

  get emptyMessage(): string {
    switch (this.selectedCategory) {
      case 'UNREAD':
        return 'You have no unread notifications.';

      case 'INVOICES':
        return 'You have no invoice notifications yet.';

      case 'PURCHASE_ORDERS':
        return 'You have no purchase order notifications yet.';

      case 'SYSTEM':
        return 'You have no system notifications yet.';

      default:
        return 'You do not have any notifications yet.';
    }
  }

  

  trackNotification(index: number, notification: Notification): string {
    return this.notificationService.getId(notification) || String(index);
  }
}
