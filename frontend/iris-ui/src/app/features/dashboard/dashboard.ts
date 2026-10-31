
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { MaterialFormModule } from '../../shared/material-form.module';
import { InvoiceService } from '../../core/services/invoice.service';
import { InvoiceDashboardStats } from '../../core/models/invoice.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MaterialFormModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private refreshSubscription?: Subscription;
  private invoiceChangesSubscription?: Subscription;
  private animationFrame?: number;

  stats: InvoiceDashboardStats = {
    totalInvoices: 0,
    totalValue: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    processed: 0,
    paid: 0,
    cancelled: 0,
    recentInvoices: []
  };

  animatedTotalInvoices = 0;
  animatedTotalValue = 0;
  animatedSubmitted = 0;
  animatedInProcess = 0;
  animatedPaid = 0;
  animatedRejected = 0;
  animatedCancelled = 0;

  isLoading = true;
  isRefreshing = false;
  errorMessage = '';
  lastUpdated: Date | null = null;
  workflowRunning = true;

  ngOnInit(): void {
    this.loadDashboard();
    this.invoiceChangesSubscription =
      this.invoiceService.invoiceChanges$.subscribe(() => {
        this.loadDashboard(true);
      });

    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadDashboard(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.invoiceChangesSubscription?.unsubscribe();

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  loadDashboard(silent = false): void {
    if (silent) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }

    this.errorMessage = '';

    this.invoiceService.getDashboardStats().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.stats = {
            ...this.stats,
            ...response.data,
            recentInvoices: response.data.recentInvoices || []
          };

          this.lastUpdated = new Date();
          this.animateCounters();
        } else {
          this.errorMessage =
            response.message || 'Unable to load dashboard.';
        }

        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: error => {
        console.error('Dashboard error:', error);
        this.errorMessage =
          error?.error?.message || 'Unable to load dashboard data.';
        this.toast.error(this.errorMessage, 'Dashboard error');
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  toggleWorkflowAnimation(): void {
    this.workflowRunning = !this.workflowRunning;
  }

  private animateCounters(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }

    const targets = {
      total: Number(this.stats.totalInvoices) || 0,
      value: Number(this.stats.totalValue) || 0,
      submitted: Number(this.stats.submitted) || 0,
      inProcess:
        (Number(this.stats.underReview) || 0) +
        (Number(this.stats.approved) || 0) +
        (Number(this.stats.processed) || 0),
      paid: Number(this.stats.paid) || 0,
      rejected: Number(this.stats.rejected) || 0,
      cancelled: Number(this.stats.cancelled) || 0
    };

    const starts = {
      total: this.animatedTotalInvoices,
      value: this.animatedTotalValue,
      submitted: this.animatedSubmitted,
      inProcess: this.animatedInProcess,
      paid: this.animatedPaid,
      rejected: this.animatedRejected,
      cancelled: this.animatedCancelled
    };

    const startTime = performance.now();
    const duration = 850;

    const animate = (now: number): void => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.animatedTotalInvoices = Math.round(
        starts.total + (targets.total - starts.total) * eased
      );
      this.animatedTotalValue =
        starts.value + (targets.value - starts.value) * eased;
      this.animatedSubmitted = Math.round(
        starts.submitted +
        (targets.submitted - starts.submitted) * eased
      );
      this.animatedInProcess = Math.round(
        starts.inProcess +
        (targets.inProcess - starts.inProcess) * eased
      );
      this.animatedPaid = Math.round(
        starts.paid + (targets.paid - starts.paid) * eased
      );
      this.animatedRejected = Math.round(
        starts.rejected +
        (targets.rejected - starts.rejected) * eased
      );
      this.animatedCancelled = Math.round(
        starts.cancelled +
        (targets.cancelled - starts.cancelled) * eased
      );

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'DRAFT': return 'status-draft';
      case 'SUBMITTED': return 'status-submitted';
      case 'UNDER_REVIEW': return 'status-review';
      case 'APPROVED': return 'status-approved';
      case 'PROCESSED': return 'status-processed';
      case 'PAID': return 'status-paid';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      PROCESSED: 'Processed',
      PAID: 'Paid',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    };

    return labels[(status || '').toUpperCase()] || status || 'Unknown';
  }

  getInProcessCount(): number {
    return (
      (Number(this.stats.underReview) || 0) +
      (Number(this.stats.approved) || 0) +
      (Number(this.stats.processed) || 0)
    );
  }

  getStatusTotal(): number {
    return (
      (Number(this.stats.submitted) || 0) +
      this.getInProcessCount() +
      (Number(this.stats.paid) || 0) +
      (Number(this.stats.rejected) || 0) +
      (Number(this.stats.cancelled) || 0) +
      (Number(this.stats.draft) || 0)
    );
  }

  getStatusPercent(value: number): number {
    const total = this.getStatusTotal();
    return total > 0 ? Math.min((value / total) * 100, 100) : 0;
  }

  
  invoiceNumber(invoice: any): string {
    return invoice?.invoiceNumber ??
      invoice?.invoiceNo ??
      invoice?.invoice_number ??
      invoice?.id ??
      '—';
  }

  vendorName(invoice: any): string {
    return invoice?.vendorName ??
      invoice?.vendor?.name ??
      invoice?.vendor ??
      invoice?.supplierName ??
      '—';
  }

  invoiceStatus(invoice: any): string {
    return invoice?.status ?? 'UNKNOWN';
  }

  invoiceDate(invoice: any): string | Date | null {
    return invoice?.createdAt ??
      invoice?.created_at ??
      invoice?.invoiceDate ??
      null;
  }

  invoiceAmount(invoice: any): number {
    return Number(
      invoice?.amounts?.totalAmount ??
      invoice?.totalAmount ??
      invoice?.amount ??
      invoice?.total ??
      0
    );
  }

  trackInvoice(index: number, invoice: any): string | number {
    return invoice?.id ??
      invoice?.invoiceNumber ??
      invoice?.invoiceNo ??
      index;
  }
}
