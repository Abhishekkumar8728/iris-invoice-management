
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import {
  ReportData,
  ReportStatus,
  ReportTrend,
  ReportType,
  ReportsService,
} from '../../core/services/reports.service';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly toast = inject(ToastService);

  activeTab: ReportType = 'invoices';
  selectedPeriod = 'monthly';

  
  dateFrom: Date | null = new Date(2025, 0, 1);
  dateTo: Date | null = new Date(2025, 11, 31);

  isLoading = false;
  errorMessage = '';

  summary = {
    total: 0,
    totalAmount: 0,
    paid: 0,
    pending: 0,
  };

  trend: ReportTrend[] = [];
  statusDistribution: ReportStatus[] = [];

  readonly tabs: { id: ReportType; label: string }[] = [
    { id: 'invoices', label: 'Invoice Reports' },
    { id: 'vendors', label: 'Vendor Reports' },
    { id: 'payments', label: 'Payment Reports' },
    { id: 'purchase-orders', label: 'PO Reports' },
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  get pageTitle(): string {
    return (
      this.tabs.find(tab => tab.id === this.activeTab)?.label ?? 'Reports'
    );
  }

  get trendTitle(): string {
    const titles: Record<ReportType, string> = {
      invoices: 'Invoice Trend',
      vendors: 'Vendor Activity Trend',
      payments: 'Payment Trend',
      'purchase-orders': 'Purchase Order Trend',
    };

    return titles[this.activeTab];
  }

  get distributionTitle(): string {
    const titles: Record<ReportType, string> = {
      invoices: 'Invoice Status Distribution',
      vendors: 'Vendor Status Distribution',
      payments: 'Payment Status Distribution',
      'purchase-orders': 'Purchase Order Status Distribution',
    };

    return titles[this.activeTab];
  }

  
  selectTab(tab: ReportType): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.loadReport();
  }

  
  onDateRangeChange(): void {
    if (!this.dateFrom || !this.dateTo) {
      return;
    }

    if (this.dateFrom > this.dateTo) {
      this.errorMessage = 'Start date must be before the end date.';
      this.toast.error(this.errorMessage);
      return;
    }

    this.errorMessage = '';
    this.loadReport();
  }

  
  loadReport(): void {
    if (!this.dateFrom || !this.dateTo) {
      return;
    }

    if (this.dateFrom > this.dateTo) {
      this.errorMessage = 'Start date must be before the end date.';
      this.toast.error(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.reportsService
      .getReport(
        this.activeTab,
        this.toApiDate(this.dateFrom),
        this.toApiDate(this.dateTo),
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: response => {
          if (!response?.success || !response.data) {
            this.clearReport();

            this.errorMessage =
              response?.message || 'No report data was returned.';

            this.toast.error(this.errorMessage);
            return;
          }

          this.applyReport(response.data);
        },

        error: (error: HttpErrorResponse) => {
          this.clearReport();

          if (error.status === 404) {
            this.errorMessage =
              `The ${this.activeTab} report endpoint was not found. ` +
              'Check the backend report API configuration.';
          } else {
            this.errorMessage =
              error.error?.message || 'Unable to load report data.';
          }

          this.toast.error(this.errorMessage);
        },
      });
  }

  private applyReport(data: ReportData): void {
    this.summary = {
      total: data.summary?.total ?? 0,
      totalAmount: data.summary?.totalAmount ?? 0,
      paid: data.summary?.paid ?? 0,
      pending: data.summary?.pending ?? 0,
    };

    this.trend = data.trend ?? [];
    this.statusDistribution = data.statusDistribution ?? [];
  }

  private clearReport(): void {
    this.summary = {
      total: 0,
      totalAmount: 0,
      paid: 0,
      pending: 0,
    };

    this.trend = [];
    this.statusDistribution = [];
  }

  
  private toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value ?? 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value ?? 0);
  }

  
  getTrendPoints(series: 'submitted' | 'completed'): string {
    if (!this.trend.length) {
      return '';
    }

    const width = 360;
    const height = 135;

    const maxValue = Math.max(
      10,
      ...this.trend.map(item =>
        Math.max(item.submitted, item.completed),
      ),
    );

    return this.trend
      .map((item, index) => {
        const x =
          this.trend.length === 1
            ? 192
            : 12 + (index * width) / (this.trend.length - 1);

        const value =
          series === 'submitted' ? item.submitted : item.completed;

        const y = height - (value / maxValue) * height + 8;

        return `${x},${y}`;
      })
      .join(' ');
  }

  getTrendArea(series: 'submitted' | 'completed'): string {
    const points = this.getTrendPoints(series);

    return points ? `12,150 ${points} 372,150` : '';
  }

  
  getTrendY(value: number): number {
    const maxValue = Math.max(
      10,
      ...this.trend.map(item =>
        Math.max(item.submitted, item.completed),
      ),
    );

    return 143 - (value / maxValue) * 135;
  }

  
  getTrendX(index: number): number {
    return this.trend.length === 1
      ? 192
      : 12 + (index * 360) / (this.trend.length - 1);
  }

  
  getDonutSegments(): (ReportStatus & {
    dashArray: string;
    dashOffset: number;
  })[] {
    const circumference = 2 * Math.PI * 65;

    const total = this.statusDistribution.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    if (!total) {
      return [];
    }

    let offset = 0;

    return this.statusDistribution.map(item => {
      const length = (item.value / total) * circumference;

      const segment = {
        ...item,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
      };

      offset += length;

      return segment;
    });
  }

  
  exportReport(): void {
    const rows: (string | number)[][] = [
      ['Report', this.pageTitle],
      ['From', this.dateFrom ? this.toApiDate(this.dateFrom) : ''],
      ['To', this.dateTo ? this.toApiDate(this.dateTo) : ''],
      [],
      ['Summary', 'Value'],
      ['Total', this.summary.total],
      ['Total Amount (INR)', this.summary.totalAmount],
      ['Paid / Completed', this.summary.paid],
      ['Pending', this.summary.pending],
      [],
      ['Period', 'Submitted', 'Completed'],
      ...this.trend.map(item => [
        item.label,
        item.submitted,
        item.completed,
      ]),
      [],
      ['Status', 'Count'],
      ...this.statusDistribution.map(item => [
        item.label,
        item.value,
      ]),
    ];

    const csv = rows
      .map(row =>
        row
          .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `iris-${this.activeTab}-report.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }
}
