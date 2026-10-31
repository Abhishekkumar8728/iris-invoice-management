export type InvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSED'
  | 'PAID'
  | 'CANCELLED';

export interface Invoice {
  _id: string;
  invoiceNumber: string;

  vendor?: {
    vendorCode?: string;
    name?: string;
    gstin?: string;
    email?: string;
    mobile?: string;
    address?: string;
  };

  invoiceDate?: string;
  dueDate?: string;

  currency?: string;

  purchaseOrderNumber?: string;

  items?: InvoiceItem[];
  attachments?: InvoiceAttachment[];

  amounts?: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalAmount: number;
  };

  status: InvoiceStatus;

  rejectionReason?: string;

  createdBy?: string;

  createdAt: string;
  updatedAt?: string;
}


export interface InvoiceListResponse {
  success: boolean;
  message: string;

  data: {
    invoices: Invoice[];

    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}


export interface InvoiceDashboardStats {

  totalInvoices: number;

  totalValue: number;

  draft: number;

  submitted: number;

  underReview: number;

  approved: number;

  rejected: number;

  processed: number;

  paid: number;

  cancelled: number;

  recentInvoices?: Invoice[];
}



export interface InvoiceDashboardResponse {
  success: boolean;
  message: string;
  data: InvoiceDashboardStats;
}
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;

  taxableAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface CreateInvoiceRequest {
  vendor: {
    vendorCode: string;
    name: string;
    gstin?: string;
    email?: string;
    mobile?: string;
    address?: string;
  };

  invoiceDate: string;
  dueDate?: string;

  currency: string;

  purchaseOrderNumber?: string;

  items: InvoiceItem[];

  cgst: number;
  sgst: number;
  igst: number;
}

export interface CreateInvoiceResponse {
  success: boolean;
  message: string;

  data: Invoice;
}
export interface InvoiceAuditEntry {
  _id?: string;
  action: string;
  performedBy?: string;
  performedByRole?: string;
  performedAt: string;
  timestamp?: string;
  fromStatus?: InvoiceStatus;
  toStatus?: InvoiceStatus;
  comment?: string;
  comments?: string;
}

export interface InvoiceDetailsResponse {
  success: boolean;
  message: string;
  data: Invoice & {
    auditHistory?: InvoiceAuditEntry[];
    workflow?: {
      currentStatus: string;
      history?: InvoiceAuditEntry[];
    };
  };
}

export interface InvoiceActionResponse {
  success: boolean;
  message: string;
  data?: Invoice;
}

export interface InvoiceUploadResponse {
  success: boolean;
  message: string;
  data?: InvoiceAttachment[];
}

export interface InvoiceAttachment {
  _id?: string;
  originalName: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  path?: string;
  url?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}
export interface Invoice {
  _id: string;
  invoiceNumber: string;

  vendor?: {
    vendorCode?: string;
    name?: string;
    gstin?: string;
    email?: string;
    mobile?: string;
    address?: string;
  };

  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  purchaseOrderNumber?: string;

  items?: InvoiceItem[];

  amounts?: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalAmount: number;
  };

  status: InvoiceStatus;

  createdBy?: string;

  attachments?: InvoiceAttachment[];

  createdAt: string;
  updatedAt?: string;
}
