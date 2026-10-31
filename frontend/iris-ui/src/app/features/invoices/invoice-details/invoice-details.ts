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
  Observable,
  takeUntil
} from 'rxjs';

import {
  InvoiceService
} from '../../../core/services/invoice.service';

import {
  Invoice,
  InvoiceAuditEntry,
  InvoiceActionResponse
} from '../../../core/models/invoice.model';

import {
  AuthService
} from '../../../core/services/auth.service';
import { MaterialFormModule } from '../../../shared/material-form.module';


@Component({
  selector: 'app-invoice-details',

  standalone: true,

  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MaterialFormModule
  ],

  templateUrl: './invoice-details.html',

  styleUrl: './invoice-details.scss'
})
export class InvoiceDetailsComponent
  implements OnInit, OnDestroy {


  

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly invoiceService =
    inject(InvoiceService);

  private readonly authService =
    inject(AuthService);


  private readonly destroy$ =
    new Subject<void>();


  

  invoice: Invoice | null = null;

  auditHistory: InvoiceAuditEntry[] = [];


  

  isLoading = true;

  actionLoading = false;

  isGeneratingPdf = false;


  errorMessage = '';

  successMessage = '';


  

  rejectionReason = '';

  showRejectBox = false;


  

  user =
    this.authService.getStoredUser();


  

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');

        if (!id) {
          this.invoice = null;
          this.errorMessage = 'Invalid invoice ID.';
          this.isLoading = false;
          return;
        }

        this.loadInvoice(id);
      });

  }


  

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }


  

  loadInvoice(id?: string): void {

    const invoiceId =
      id ||
      this.route.snapshot.paramMap.get('id');


    if (!invoiceId) {

      this.errorMessage =
        'Invalid invoice ID.';

      this.isLoading = false;

      return;

    }


    this.isLoading = true;

    this.errorMessage = '';
    this.invoice = null;


    this.invoiceService
      .getInvoice(invoiceId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: response => {

          if (!response.success || !response.data) {

            this.errorMessage =
              response.message ||
              'Unable to load invoice.';

            this.isLoading = false;

            return;

          }


          this.invoice =
            response.data;


          this.auditHistory =
            response.data.auditHistory ||
            response.data.workflow?.history ||
            [];


          this.isLoading = false;

        },


        error: error => {

          console.error(
            'Invoice details error:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'Unable to load invoice.';


          this.isLoading = false;

        }

      });

  }


  

  get invoiceId(): string | null {

    return this.invoice?._id || null;

  }


  

  get invoiceItems() {

    return this.invoice?.items || [];

  }

  get processSteps() {
    const steps = this.auditHistory.map(entry => {
      const status = entry.toStatus || entry.action;

      return {
        label: this.formatStatus(status),
        date: entry.performedAt || entry.timestamp,
        current: status === this.invoice?.status
      };
    });

    if (
      this.invoice &&
      !steps.some(step => step.current)
    ) {
      steps.push({
        label: this.formatStatus(this.invoice.status),
        date: undefined,
        current: true
      });
    }

    return steps;
  }


  

  get canSubmit(): boolean {

    return (
      this.invoice?.status === 'DRAFT' &&
      this.isCreator()
    );

  }


  get canReview(): boolean {

    return (
      this.invoice?.status === 'SUBMITTED' &&
      this.hasRole([
        'ADMIN',
        'FINANCE',
        'APPROVER'
      ])
    );

  }


  get canApprove(): boolean {

    return (
      this.invoice?.status === 'UNDER_REVIEW' &&
      this.hasRole([
        'ADMIN',
        'APPROVER'
      ])
    );

  }


  get canReject(): boolean {

    return (
      (
        this.invoice?.status === 'SUBMITTED' ||
        this.invoice?.status === 'UNDER_REVIEW'
      ) &&
      this.hasRole([
        'ADMIN',
        'FINANCE',
        'APPROVER'
      ])
    );

  }


  get canProcess(): boolean {

    return (
      this.invoice?.status === 'APPROVED' &&
      this.hasRole([
        'ADMIN',
        'FINANCE'
      ])
    );

  }


  get canPay(): boolean {

    return (
      this.invoice?.status === 'PROCESSED' &&
      this.hasRole([
        'ADMIN',
        'FINANCE'
      ])
    );

  }


  get canResubmit(): boolean {

    return (
      this.invoice?.status === 'REJECTED' &&
      this.isCreator()
    );

  }


  

  get canCancel(): boolean {

    return (
      this.invoice?.status === 'DRAFT' &&
      (
        this.isCreator() ||
        this.hasRole([
          'ADMIN'
        ])
      )
    );

  }


  

  isCreator(): boolean {

    if (
      !this.invoice ||
      !this.user ||
      !this.invoice.createdBy
    ) {

      return false;

    }


    return (
      this.invoice.createdBy ===
      this.user.id
    );

  }


  hasRole(
    roles: string[]
  ): boolean {

    return !!this.user &&
      roles.includes(
        this.user.role
      );

  }


  

  submit(): void {

    if (!this.invoiceId) {
      return;
    }


    this.executeAction(
      () =>
        this.invoiceService
          .submitInvoice(
            this.invoiceId!
          )
    );

  }


  

  review(): void {

    if (!this.invoiceId) {
      return;
    }


    this.executeAction(
      () =>
        this.invoiceService
          .reviewInvoice(
            this.invoiceId!
          )
    );

  }


  

  approve(): void {

    if (!this.invoiceId) {
      return;
    }


    this.executeAction(
      () =>
        this.invoiceService
          .approveInvoice(
            this.invoiceId!
          )
    );

  }


  

  reject(): void {

    if (!this.invoiceId) {
      return;
    }


    const reason =
      this.rejectionReason.trim();


    if (!reason) {

      this.errorMessage =
        'Please provide a rejection reason.';

      return;

    }


    this.executeAction(
      () =>
        this.invoiceService
          .rejectInvoice(
            this.invoiceId!,
            reason
          )
    );

  }


  

  resubmit(): void {

    if (
      !this.invoiceId ||
      !this.canResubmit
    ) {

      return;

    }


    this.executeAction(
      () =>
        this.invoiceService
          .resubmitInvoice(
            this.invoiceId!
          )
    );

  }


  

  process(): void {

    if (!this.invoiceId) {
      return;
    }


    this.executeAction(
      () =>
        this.invoiceService
          .processInvoice(
            this.invoiceId!
          )
    );

  }


  

  pay(): void {

    if (!this.invoiceId) {
      return;
    }


    this.executeAction(
      () =>
        this.invoiceService
          .payInvoice(
            this.invoiceId!
          )
    );

  }


  

  cancel(): void {

    if (
      !this.invoiceId ||
      !this.canCancel
    ) {

      return;

    }


    this.executeAction(
      () =>
        this.invoiceService
          .cancelInvoice(
            this.invoiceId!
          )
    );

  }


  

  executeAction(
    action: () => Observable<InvoiceActionResponse>
  ): void {

    this.actionLoading = true;

    this.errorMessage = '';

    this.successMessage = '';


    action()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: (response: InvoiceActionResponse) => {

          if (!response?.success) {

            this.errorMessage =
              response?.message ||
              'Action failed.';

            this.actionLoading = false;

            return;

          }


          this.successMessage =
            response.message ||
            'Invoice updated successfully.';


          this.showRejectBox = false;

          this.rejectionReason = '';


          this.actionLoading = false;


          setTimeout(() => {

            this.loadInvoice();

          }, 300);

        },


        error: (error: { error?: { message?: string } }) => {

          console.error(
            'Invoice action error:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'Unable to perform this action.';


          this.actionLoading = false;

        }

      });

  }


  

  openApproval(): void {

    if (!this.invoice) {
      return;
    }


    this.router.navigate([
      '/invoices',
      this.invoice._id,
      'approval'
    ]);

  }


  

  backToInvoices(): void {

    this.router.navigate([
      '/invoices'
    ]);

  }

  downloadInvoicePdf(): void {
    if (!this.invoice) {
      this.errorMessage = 'Invoice details are not available for download.';
      return;
    }

    if (this.isGeneratingPdf) {
      return;
    }

    void this.generateInvoicePdf();
  }

  private async generateInvoicePdf(): Promise<void> {
    this.isGeneratingPdf = true;

    try {
      const { jsPDF } = await import('jspdf');
      const invoice = this.invoice;
      if (!invoice) {
        this.errorMessage = 'Invoice details are not available for download.';
        return;
      }

      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const currency = invoice.currency || 'INR';
      const money = (value: number | undefined): string =>
        `${currency} ${new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Number(value ?? 0))}`;
      const date = (value?: string): string => {
        if (!value) {
          return '—';
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime())
          ? '—'
          : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsed);
      };
      const setDarkText = (): void => {
        pdf.setTextColor(15, 39, 35);
      };
      const drawPageHeader = (): void => {
        pdf.setFillColor(4, 18, 17);
        pdf.rect(0, 0, pageWidth, 39, 'F');
        pdf.setTextColor(110, 225, 203);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('IRIS  /  INVOICE MANAGEMENT', margin, 12);
        pdf.setTextColor(239, 255, 251);
        pdf.setFontSize(19);
        pdf.text(invoice.invoiceNumber || 'Invoice', margin, 24);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(174, 210, 201);
        pdf.text(`STATUS  ${this.formatStatus(invoice.status)}`, margin, 32);
      };
      const drawInfoCard = (
        x: number,
        y: number,
        width: number,
        title: string,
        lines: string[]
      ): void => {
        pdf.setFillColor(241, 248, 245);
        pdf.setDrawColor(198, 220, 212);
        pdf.roundedRect(x, y, width, 44, 2, 2, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setDarkText();
        pdf.text(title, x + 4, y + 7);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        let textY = y + 14;
        for (const line of lines) {
          const wrapped = pdf.splitTextToSize(line, width - 8) as string[];
          pdf.text(wrapped, x + 4, textY);
          textY += Math.max(4, wrapped.length * 3.8);
        }
      };

      pdf.setProperties({
        title: `Invoice ${invoice.invoiceNumber}`,
        subject: 'Invoice details',
        creator: 'IRIS Invoice Management'
      });

      drawPageHeader();
      const cardGap = 6;
      const cardWidth = (contentWidth - cardGap) / 2;
      drawInfoCard(margin, 46, cardWidth, 'VENDOR INFORMATION', [
        invoice.vendor?.name || 'Vendor name unavailable',
        `Vendor code: ${invoice.vendor?.vendorCode || '—'}`,
        `GSTIN: ${invoice.vendor?.gstin || '—'}`,
        `Email: ${invoice.vendor?.email || '—'}`
      ]);
      drawInfoCard(
        margin + cardWidth + cardGap,
        46,
        cardWidth,
        'INVOICE INFORMATION',
        [
          `Invoice date: ${date(invoice.invoiceDate)}`,
          `Due date: ${date(invoice.dueDate)}`,
          `PO number: ${invoice.purchaseOrderNumber || '—'}`,
          `Currency: ${currency}`
        ]
      );

      let y = 101;
      const columns = [
        { label: 'Description', width: 49, align: 'left' as const },
        { label: 'Qty', width: 11, align: 'right' as const },
        { label: 'Unit price', width: 24, align: 'right' as const },
        { label: 'Tax %', width: 13, align: 'right' as const },
        { label: 'Taxable', width: 27, align: 'right' as const },
        { label: 'Tax', width: 25, align: 'right' as const },
        { label: 'Total', width: 33, align: 'right' as const }
      ];
      const drawTableHeader = (): void => {
        pdf.setFillColor(8, 58, 53);
        pdf.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(229, 250, 244);
        let x = margin + 2;
        for (const column of columns) {
          const textX = column.align === 'left' ? x : x + column.width - 2;
          pdf.text(column.label, textX, y + 5.8, {
            align: column.align,
            maxWidth: column.width - 3
          });
          x += column.width;
        }
        y += 9;
      };

      drawTableHeader();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      setDarkText();

      for (const item of invoice.items || []) {
        const descriptionLines = pdf.splitTextToSize(
          item.description || '—',
          columns[0].width - 4
        ) as string[];
        const rowHeight = Math.max(8, descriptionLines.length * 4 + 3);

        if (y + rowHeight > pageHeight - 30) {
          pdf.addPage();
          drawPageHeader();
          y = 47;
          drawTableHeader();
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          setDarkText();
        }

        pdf.setDrawColor(215, 229, 224);
        pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
        let x = margin + 2;
        const row = [
          { value: descriptionLines, align: 'left' as const, width: columns[0].width },
          { value: String(item.quantity ?? 0), align: 'right' as const, width: columns[1].width },
          { value: money(item.unitPrice), align: 'right' as const, width: columns[2].width },
          { value: `${Number(item.taxRate ?? 0)}%`, align: 'right' as const, width: columns[3].width },
          { value: money(item.taxableAmount), align: 'right' as const, width: columns[4].width },
          { value: money(item.taxAmount), align: 'right' as const, width: columns[5].width },
          { value: money(item.totalAmount), align: 'right' as const, width: columns[6].width }
        ];

        for (const cell of row) {
          const textX = cell.align === 'left' ? x : x + cell.width - 2;
          pdf.text(cell.value, textX, y + 5.5, {
            align: cell.align,
            maxWidth: cell.width - 4
          });
          x += cell.width;
        }

        y += rowHeight;
      }

      const amounts = invoice.amounts;
      const totals = [
        ['Taxable amount', money(amounts?.taxableAmount)],
        ['CGST', money(amounts?.cgst)],
        ['SGST', money(amounts?.sgst)],
        ['IGST', money(amounts?.igst)],
        ['Total tax', money(amounts?.totalTax)]
      ];
      const summaryHeight = totals.length * 6 + 19;
      if (y + summaryHeight > pageHeight - margin) {
        pdf.addPage();
        drawPageHeader();
        y = 48;
      } else {
        y += 9;
      }

      const summaryX = pageWidth - margin - 78;
      pdf.setFillColor(241, 248, 245);
      pdf.setDrawColor(198, 220, 212);
      pdf.roundedRect(summaryX, y, 78, summaryHeight, 2, 2, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setDarkText();
      for (const [label, value] of totals) {
        pdf.text(label, summaryX + 5, y + 7);
        pdf.text(value, pageWidth - margin - 5, y + 7, { align: 'right' });
        y += 6;
      }
      pdf.setDrawColor(25, 122, 109);
      pdf.line(summaryX + 5, y + 2, pageWidth - margin - 5, y + 2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(7, 88, 78);
      pdf.text('GRAND TOTAL', summaryX + 5, y + 10);
      pdf.text(
        money(amounts?.totalAmount),
        pageWidth - margin - 5,
        y + 10,
        { align: 'right' }
      );

      const filename = (invoice.invoiceNumber || 'invoice')
        .replace(/[^a-zA-Z0-9._-]+/g, '_');
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Invoice PDF generation error:', error);
      this.errorMessage = 'Unable to generate the invoice PDF. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
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
        letter =>
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


}