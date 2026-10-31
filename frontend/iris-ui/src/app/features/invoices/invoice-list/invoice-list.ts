
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import {
  CommonModule,
  DatePipe
} from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil
} from 'rxjs';

import { InvoiceService } from '../../../core/services/invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MaterialFormModule } from '../../../shared/material-form.module';

import {
  Invoice,
  InvoiceActionResponse,
  InvoiceStatus
} from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MaterialFormModule
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceListComponent implements OnInit, OnDestroy {

  readonly Math = Math;

  private readonly invoiceService = inject(InvoiceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  invoices: Invoice[] = [];

  isLoading = false;
  errorMessage = '';

  
  
  showAdvancedFilters = false;
  showFilters = false;

  currentPage = 1;
  pageSize = 10;
  totalInvoices = 0;
  totalPages = 1;
  private hasInitializedSearch = false;
  readonly forwardingInvoiceIds = new Set<string>();

  filterForm = this.fb.nonNullable.group({
    search: [''],
    status: this.fb.control<string | null>(null),
    vendorCode: [''],
    dateFrom: this.fb.control<Date | null>(null),
    dateTo: this.fb.control<Date | null>(null),
    minAmount: [''],
    maxAmount: ['']
  });

  statuses: InvoiceStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PROCESSED',
    'PAID',
    'CANCELLED'
  ];

  ngOnInit(): void {
    this.setupSearch();

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const search = params.get('search') ?? '';
        const searchControl = this.filterForm.controls.search;

        if (search !== searchControl.value) {
          searchControl.setValue(search);
        } else if (!this.hasInitializedSearch) {
          this.loadInvoices();
        }

        this.hasInitializedSearch = true;
      });

    this.invoiceService.invoiceChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadInvoices());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.filterForm.controls.search.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadInvoices();
      });
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters = this.filterForm.getRawValue();

    this.invoiceService.getInvoices({
      page: this.currentPage,
      limit: this.pageSize,

      
      search: filters.search.trim(),

      
      status: filters.status || '',
      vendorCode: filters.vendorCode.trim(),

      dateFrom: filters.dateFrom
        ? this.formatDate(filters.dateFrom)
        : undefined,

      dateTo: filters.dateTo
        ? this.formatDate(filters.dateTo)
        : undefined,

      minAmount: filters.minAmount
        ? Number(filters.minAmount)
        : undefined,

      maxAmount: filters.maxAmount
        ? Number(filters.maxAmount)
        : undefined
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: response => {
        if (!response.success) {
          this.errorMessage =
            response.message || 'Unable to load invoices.';
          this.isLoading = false;
          return;
        }

        this.invoices = [...(response.data?.invoices || [])]
          .sort((a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );

        const pagination = response.data?.pagination;

        if (pagination) {
          this.currentPage = pagination.page;
          this.pageSize = pagination.limit;
          this.totalInvoices = pagination.total;
          this.totalPages = Math.max(pagination.totalPages, 1);
        } else {
          this.totalInvoices = this.invoices.length;
          this.totalPages = 1;
        }

        this.isLoading = false;
      },
      error: error => {
        console.error('Invoice list error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load invoices. Please try again.';

        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const {
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
    } = this.filterForm.getRawValue();

    if (
      dateFrom &&
      dateTo &&
      this.formatDate(dateFrom) > this.formatDate(dateTo)
    ) {
      this.errorMessage = 'From date cannot be after To date.';
      return;
    }

    if (
      minAmount &&
      maxAmount &&
      Number(minAmount) > Number(maxAmount)
    ) {
      this.errorMessage =
        'Minimum amount cannot be greater than maximum amount.';
      return;
    }

    this.currentPage = 1;
    this.loadInvoices();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: null,
      vendorCode: '',
      dateFrom: null,
      dateTo: null,
      minAmount: '',
      maxAmount: ''
    });

    this.currentPage = 1;
    this.loadInvoices();
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear().toString().padStart(4, '0');
    const month = (value.getMonth() + 1).toString().padStart(2, '0');
    const day = value.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  changePageSize(value: string | number): void {
    const newSize = Number(value);

    if (!Number.isFinite(newSize) || newSize < 1) {
      return;
    }

    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadInvoices();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
    this.loadInvoices();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.loadInvoices();
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.currentPage = page;
    this.loadInvoices();
  }

  get pages(): number[] {
    const result: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let page = start; page <= end; page++) {
      result.push(page);
    }

    return result;
  }

  get showingFrom(): number {
    if (this.totalInvoices === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.totalInvoices
    );
  }

  countStatus(status: InvoiceStatus): number {
    return this.invoices.filter(
      invoice => invoice.status === status
    ).length;
  }

  viewInvoice(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice._id]);
  }

  createInvoice(): void {
    this.router.navigate(['/invoices/create']);
  }

  editInvoice(invoice: Invoice): void {
    if (!this.canEditInvoice(invoice)) {
      return;
    }

    this.router.navigate(['/invoices', invoice._id, 'edit']);
  }

  canEditInvoice(invoice: Invoice): boolean {
    const user = this.authService.getStoredUser();
    const supportedRole = ['ADMIN', 'FINANCE', 'APPROVER'].includes(user?.role ?? '');
    const isOwner = invoice.createdBy === user?.id;

    return supportedRole &&
      (user?.role === 'ADMIN' || isOwner) &&
      ['DRAFT', 'REJECTED'].includes(invoice.status);
  }

  canForwardForReview(invoice: Invoice): boolean {
    const user = this.authService.getStoredUser();

    return invoice.status === 'SUBMITTED' &&
      ['ADMIN', 'FINANCE', 'APPROVER'].includes(user?.role ?? '');
  }

  forwardForReview(invoice: Invoice): void {
    if (!this.canForwardForReview(invoice) ||
        this.forwardingInvoiceIds.has(invoice._id)) {
      return;
    }

    this.forwardingInvoiceIds.add(invoice._id);
    this.invoiceService.reviewInvoice(invoice._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InvoiceActionResponse) => {
          this.forwardingInvoiceIds.delete(invoice._id);

          if (!response.success) {
            this.toast.error(
              response.message || 'Unable to forward invoice for review.'
            );
            return;
          }

          this.toast.success('Invoice forwarded for review.');
        },
        error: error => {
          this.forwardingInvoiceIds.delete(invoice._id);
          console.error('Invoice submission error:', error);
          this.toast.error(
            error?.error?.message ||
              'Unable to forward invoice for review.'
          );
        }
      });
  }

  formatStatus(status: InvoiceStatus): string {
    switch (status) {
      case 'UNDER_REVIEW':
        return 'In Process';

      case 'PROCESSED':
        return 'Processed';

      default:
        return status
          .replaceAll('_', ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
    }
  }

  getStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'status-draft';

      case 'SUBMITTED':
        return 'status-submitted';

      case 'UNDER_REVIEW':
        return 'status-review';

      case 'APPROVED':
        return 'status-approved';

      case 'REJECTED':
        return 'status-rejected';

      case 'PROCESSED':
        return 'status-processed';

      case 'PAID':
        return 'status-paid';

      case 'CANCELLED':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

}
