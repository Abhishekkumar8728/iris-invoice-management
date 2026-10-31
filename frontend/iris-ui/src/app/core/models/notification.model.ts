export type NotificationType =
  | 'INVOICE_SUBMITTED'
  | 'INVOICE_APPROVED'
  | 'INVOICE_REJECTED'
  | 'INVOICE_PROCESSED'
  | 'INVOICE_PAID'
  | 'INVOICE_UPDATED'
  | 'SYSTEM';


export interface NotificationRelatedEntity {
  type?: string;
  id?: string;
}


export interface Notification {

  _id?: string;

  id?: string;

  userId?: string;

  type: NotificationType | string;

  channel?: string;

  recipient?: string;

  subject?: string;

  title: string;

  message: string;

  isRead: boolean;

  readAt?: string | null;

  relatedEntity?: NotificationRelatedEntity | null;

  createdAt: string;

  updatedAt?: string;

}


export interface NotificationListResponse {

  success: boolean;

  message: string;

  data: Notification[];

  pagination?: {

    page: number;

    limit: number;

    total: number;

    pages: number;

  };

}


export interface NotificationResponse {

  success: boolean;

  message: string;

  data?: Notification;

}