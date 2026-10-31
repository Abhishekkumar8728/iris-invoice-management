import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule,
  DatePipe
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Subject,
  takeUntil
} from 'rxjs';

import {
  InvoiceService
} from '../../../core/services/invoice.service';

import {
  AuthService
} from '../../../core/services/auth.service';

import {
  Invoice,
  InvoiceAuditEntry
} from '../../../core/models/invoice.model';

import {
  ConfirmationService
} from '../../../core/services/confirmation';

import {
  ToastService
} from '../../../core/services/toast.service';
import { MaterialFormModule } from '../../../shared/material-form.module';


@Component({
  selector: 'app-invoice-approval',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MaterialFormModule
  ],

  templateUrl: './invoice-approval.html',

  styleUrl: './invoice-approval.scss'
})
export class InvoiceApprovalComponent
  implements OnInit, OnDestroy {


  

  private readonly invoiceService =
    inject(InvoiceService);

  private readonly authService =
    inject(AuthService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly confirmation =
    inject(ConfirmationService);

  private readonly toast =
    inject(ToastService);


  private readonly destroy$ =
    new Subject<void>();


  

  invoice: Invoice | null = null;

  auditHistory: InvoiceAuditEntry[] = [];


  invoiceId = '';


  

  loading = true;

  processing = false;

  errorMessage = '';

  successMessage = '';


  

  comment = '';

  showRejectReason = false;


  

  ngOnInit(): void {

    this.invoiceId =
      this.route.snapshot.paramMap.get('id') || '';


    if (!this.invoiceId) {

      this.router.navigate([
        '/invoices'
      ]);

      return;

    }


    this.loadInvoice();

  }


  

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }


  

  loadInvoice(): void {

    this.loading = true;

    this.errorMessage = '';


    this.invoiceService
      .getInvoice(this.invoiceId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: response => {

          if (!response.success) {

            this.errorMessage =
              response.message ||
              'Unable to load invoice.';

            this.loading = false;

            return;

          }


          this.invoice =
            response.data;


          this.auditHistory =
            response.data.auditHistory ||
            response.data.workflow?.history ||
            [];


          this.loading = false;

        },


        error: error => {

          console.error(
            'Invoice approval load error:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'Unable to load invoice.';


          this.loading = false;

        }

      });

  }


  

  get items() {

    return this.invoice?.items || [];

  }


  

  get currentUser() {

    return this.authService.getCurrentUser();

  }


  

  get canApprove(): boolean {

    const user =
      this.currentUser;


    return !!(
      this.invoice &&
      user &&
      this.invoice.status === 'UNDER_REVIEW' &&
      (
        user.role === 'ADMIN' ||
        user.role === 'APPROVER'
      )
    );

  }


  get canReject(): boolean {

    const user =
      this.currentUser;


    return !!(
      this.invoice &&
      user &&
      (
        this.invoice.status === 'SUBMITTED' ||
        this.invoice.status === 'UNDER_REVIEW'
      ) &&
      (
        user.role === 'ADMIN' ||
        user.role === 'APPROVER' ||
        user.role === 'FINANCE'
      )
    );

  }


  

  approve(): void {

    if (
      !this.invoice ||
      !this.canApprove ||
      this.processing
    ) {

      return;

    }


    this.confirmation
      .confirm({

        title: 'Approve Invoice',

        message:
          `Are you sure you want to approve invoice ${this.invoice.invoiceNumber}?`,

        confirmText: 'Approve',

        type: 'success'

      })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(confirmed => {

        if (!confirmed) {
          return;
        }


        this.processing = true;

        this.errorMessage = '';


        this.invoiceService
          .approveInvoice(
            this.invoiceId
          )
          .pipe(
            takeUntil(this.destroy$)
          )
          .subscribe({

            next: response => {

              this.processing = false;


              if (!response.success) {

                this.errorMessage =
                  response.message ||
                  'Unable to approve invoice.';

                return;

              }


              this.toast.success(
                'Invoice approved successfully.'
              );


              this.successMessage =
                'Invoice approved successfully.';


              setTimeout(() => {

                this.router.navigate([
                  '/invoices',
                  this.invoiceId
                ]);

              }, 500);

            },


            error: error => {

              this.processing = false;


              this.errorMessage =
                error?.error?.message ||
                'Unable to approve invoice.';

            }

          });

      });

  }


  

  openRejectBox(): void {

    if (!this.canReject) {
      return;
    }


    this.showRejectReason = true;

    this.errorMessage = '';

  }


  closeRejectBox(): void {

    if (this.processing) {
      return;
    }


    this.showRejectReason = false;

    this.comment = '';

  }


  

  reject(): void {

    if (
      !this.invoice ||
      !this.canReject ||
      this.processing
    ) {

      return;

    }


    const reason =
      this.comment.trim();


    if (!reason) {

      this.errorMessage =
        'Please enter a rejection reason.';

      return;

    }


    if (reason.length < 5) {

      this.errorMessage =
        'Rejection reason must contain at least 5 characters.';

      return;

    }


    this.confirmation
      .confirm({

        title: 'Reject Invoice',

        message:
          `Are you sure you want to reject invoice ${this.invoice.invoiceNumber}?`,

        confirmText: 'Reject',

        type: 'danger'

      })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(confirmed => {

        if (!confirmed) {
          return;
        }


        this.processing = true;

        this.errorMessage = '';


        this.invoiceService
          .rejectInvoice(
            this.invoiceId,
            reason
          )
          .pipe(
            takeUntil(this.destroy$)
          )
          .subscribe({

            next: response => {

              this.processing = false;


              if (!response.success) {

                this.errorMessage =
                  response.message ||
                  'Unable to reject invoice.';

                return;

              }


              this.toast.success(
                'Invoice rejected successfully.'
              );


              this.successMessage =
                'Invoice rejected successfully.';


              setTimeout(() => {

                this.router.navigate([
                  '/invoices',
                  this.invoiceId
                ]);

              }, 500);

            },


            error: error => {

              this.processing = false;


              this.errorMessage =
                error?.error?.message ||
                'Unable to reject invoice.';

            }

          });

      });

  }


  

  back(): void {

    this.router.navigate([
      '/invoices',
      this.invoiceId
    ]);

  }


  

  formatStatus(
    status: string
  ): string {

    if (
      status === 'UNDER_REVIEW'
    ) {

      return 'Under Review';

    }


    return status
      .replaceAll('_', ' ')
      .replace(
        /\b\w/g,
        (letter: string) =>
          letter.toUpperCase()
      );

  }


  getStatusClass(
    status: string
  ): string {

    return `status-${status
      .toLowerCase()
      .replaceAll('_', '-')}`;

  }


  

  formatCurrency(
    value: number | undefined
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',

        currency:
          this.invoice?.currency ||
          'INR',

        maximumFractionDigits: 2

      }
    ).format(
      value || 0
    );

  }


  

  getAuditAction(
    entry: InvoiceAuditEntry
  ): string {

    if (entry.action) {

      return entry.action
        .replaceAll('_', ' ')
        .replace(
          /\b\w/g,
            (letter: string) =>
            letter.toUpperCase()
        );

    }


    return 'Invoice Updated';

  }


  getAuditComment(
    entry: InvoiceAuditEntry
  ): string {

    return (
      entry.comment ||
      entry.comments ||
      ''
    );

  }


  getAuditDate(
    entry: InvoiceAuditEntry
  ): string {

    return (
      entry.timestamp ||
      entry.performedAt ||
      ''
    );

  }

}