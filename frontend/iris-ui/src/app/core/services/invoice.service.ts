import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Invoice,
  InvoiceDashboardResponse,
  InvoiceListResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  InvoiceDetailsResponse,
  InvoiceActionResponse,
  InvoiceUploadResponse
} from '../models/invoice.model';



export interface ChatbotResponse {
  type: string;
  message: string;
  data: any;
}

export interface ChatbotApiResponse {
  success: boolean;
  message: string;
  data: ChatbotResponse;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;
  private readonly invoiceChangesSubject = new Subject<void>();

  readonly invoiceChanges$ = this.invoiceChangesSubject.asObservable();

  private notifyInvoiceChanged(): void {
    this.invoiceChangesSubject.next();
  }


  getDashboardStats(): Observable<InvoiceDashboardResponse> {

    return this.http.get<InvoiceDashboardResponse>(
      `${this.apiUrl}/invoices/dashboard/stats`
    );
  }


  

  sendChatbotMessage(
    message: string
  ): Observable<ChatbotApiResponse> {

    return this.http.post<ChatbotApiResponse>(
      `${this.apiUrl}/invoices/chatbot`,
      {
        message
      }
    );
  }

  

  createInvoice(
    payload: CreateInvoiceRequest
  ): Observable<CreateInvoiceResponse> {

    return this.http.post<CreateInvoiceResponse>(
      `${this.apiUrl}/invoices`,
      payload
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }

  updateInvoice(
    id: string,
    payload: CreateInvoiceRequest
  ): Observable<InvoiceActionResponse> {
    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}`,
      payload
    ).pipe(tap(() => this.notifyInvoiceChanged()));
  }


  getInvoices(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorCode?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
  } = {}): Observable<InvoiceListResponse> {

    let params = new HttpParams();

    if (filters.page) {
      params = params.set(
        'page',
        filters.page.toString()
      );
    }

    if (filters.limit) {
      params = params.set(
        'limit',
        filters.limit.toString()
      );
    }

    if (filters.search) {
      params = params.set(
        'search',
        filters.search.trim()
      );
    }

    if (filters.status) {
      params = params.set(
        'status',
        filters.status
      );
    }

    if (filters.vendorCode) {
      params = params.set(
        'vendorCode',
        filters.vendorCode.trim()
      );
    }

    if (filters.dateFrom) {
      params = params.set(
        'dateFrom',
        filters.dateFrom
      );
    }

    if (filters.dateTo) {
      params = params.set(
        'dateTo',
        filters.dateTo
      );
    }

    if (filters.minAmount !== undefined) {
      params = params.set(
        'minAmount',
        filters.minAmount.toString()
      );
    }

    if (filters.maxAmount !== undefined) {
      params = params.set(
        'maxAmount',
        filters.maxAmount.toString()
      );
    }

    return this.http.get<InvoiceListResponse>(
      `${this.apiUrl}/invoices`,
      { params }
    );
  }


  getInvoice(id: string): Observable<InvoiceDetailsResponse> {

    return this.http.get<InvoiceDetailsResponse>(
      `${this.apiUrl}/invoices/${id}`
    );

  }


  submitInvoice(id: string): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/submit`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  reviewInvoice(id: string): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/review`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  approveInvoice(id: string): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/invoices/${id}/approve`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  rejectInvoice(
    id: string,
    reason: string
  ): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/reject`,
      {
        reason
      }
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  processInvoice(id: string): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/process`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  payInvoice(id: string): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/pay`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  cancelInvoice(id: string): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/cancel`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }


  uploadAttachment(
    id: string,
    file: File
  ): Observable<any> {

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    return this.http.post(
      `${this.apiUrl}/invoices/${id}/attachments`,
      formData
    );

  }


  uploadAttachments(
    invoiceId: string,
    files: File[]
  ): Observable<InvoiceUploadResponse> {

    const formData =
      new FormData();

    files.forEach(file => {

      formData.append(
        'file',
        file
      );

    });

    return this.http.post<InvoiceUploadResponse>(
      `${this.apiUrl}/invoices/${invoiceId}/attachments`,
      formData
    );

  }


  deleteAttachment(
    invoiceId: string,
    attachmentId: string
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/invoices/${invoiceId}/attachments/${attachmentId}`
    );

  }


  downloadAttachment(
    invoiceId: string,
    attachmentId: string
  ): Observable<Blob> {

    return this.http.get(
      `${this.apiUrl}/invoices/${invoiceId}/attachments/${attachmentId}`,
      {
        responseType: 'blob'
      }
    );

  }


  resubmitInvoice(
    id: string
  ): Observable<InvoiceActionResponse> {

    return this.http.patch<InvoiceActionResponse>(
      `${this.apiUrl}/invoices/${id}/resubmit`,
      {}
    ).pipe(tap(() => this.notifyInvoiceChanged()));

  }

}