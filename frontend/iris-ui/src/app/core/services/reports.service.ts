
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ReportType = 'invoices' | 'vendors' | 'payments' | 'purchase-orders';

export interface ReportSummary {
  total: number;
  totalAmount: number;
  paid: number;
  pending: number;
}

export interface ReportTrend {
  label: string;
  submitted: number;
  completed: number;
}

export interface ReportStatus {
  label: string;
  value: number;
  color: string;
}

export interface ReportData {
  summary: ReportSummary;
  trend: ReportTrend[];
  statusDistribution: ReportStatus[];
}

export interface ReportApiResponse {
  success: boolean;
  data: ReportData;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);

  
  private readonly baseUrl = 'http://localhost:4000/api/v1/reports';

  getReport(
    type: ReportType,
    dateFrom: string,
    dateTo: string,
  ): Observable<ReportApiResponse> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);

    return this.http.get<ReportApiResponse>(
      `${this.baseUrl}/${type}`,
      { params },
    );
  }
}
