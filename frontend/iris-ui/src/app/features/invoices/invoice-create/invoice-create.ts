
import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { MaterialFormModule } from '../../../shared/material-form.module';
import { Invoice } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialFormModule
  ],
  templateUrl: './invoice-create.html',
  styleUrl: './invoice-create.scss'
})
export class InvoiceCreateComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly invoiceId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.invoiceId;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  invoiceForm = this.fb.nonNullable.group({
    vendor: this.fb.nonNullable.group({
      vendorCode: ['', Validators.required],
      name: ['', Validators.required],
      gstin: [''],
      email: ['', Validators.email],
      mobile: [''],
      address: ['']
    }),

    invoiceDate: this.fb.control<Date | null>(
      null,
      Validators.required
    ),
    dueDate: this.fb.control<Date | null>(null),
    currency: ['INR', Validators.required],
    purchaseOrderNumber: [''],

    items: this.fb.array([]),

    cgst: [0, [Validators.required, Validators.min(0)]],
    sgst: [0, [Validators.required, Validators.min(0)]],
    igst: [0, [Validators.required, Validators.min(0)]]
  });

  readonly currencies = [
    { code: 'INR', label: 'INR - Indian Rupee' },
    { code: 'USD', label: 'USD - US Dollar' },
    { code: 'EUR', label: 'EUR - Euro' },
    { code: 'GBP', label: 'GBP - British Pound' }
  ];

  ngOnInit(): void {
    if (this.invoiceId) {
      this.loadInvoice(this.invoiceId);
      return;
    }

    this.addItem();
  }

  private loadInvoice(id: string): void {
    this.isLoading = true;

    this.invoiceService.getInvoice(id).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.errorMessage = response.message || 'Unable to load invoice.';
          this.isLoading = false;
          return;
        }

        this.populateForm(response.data);
        this.isLoading = false;
      },
      error: error => {
        console.error('Invoice edit load error:', error);
        this.errorMessage =
          error?.error?.message || 'Unable to load invoice for editing.';
        this.isLoading = false;
      }
    });
  }

  private populateForm(invoice: Invoice): void {
    this.invoiceForm.patchValue({
      vendor: {
        vendorCode: invoice.vendor?.vendorCode ?? '',
        name: invoice.vendor?.name ?? '',
        gstin: invoice.vendor?.gstin ?? '',
        email: invoice.vendor?.email ?? '',
        mobile: invoice.vendor?.mobile ?? '',
        address: invoice.vendor?.address ?? ''
      },
      invoiceDate: this.parseDate(invoice.invoiceDate),
      dueDate: this.parseDate(invoice.dueDate),
      currency: invoice.currency ?? 'INR',
      purchaseOrderNumber: invoice.purchaseOrderNumber ?? '',
      cgst: invoice.amounts?.cgst ?? 0,
      sgst: invoice.amounts?.sgst ?? 0,
      igst: invoice.amounts?.igst ?? 0
    });

    this.items.clear();
    for (const item of invoice.items ?? []) {
      this.items.push(this.fb.nonNullable.group({
        description: [item.description, Validators.required],
        quantity: [item.quantity, [
          Validators.required,
          Validators.min(0.01)
        ]],
        unitPrice: [item.unitPrice, [
          Validators.required,
          Validators.min(0)
        ]],
        taxRate: [item.taxRate, [
          Validators.required,
          Validators.min(0),
          Validators.max(100)
        ]]
      }));
    }

    if (this.items.length === 0) {
      this.addItem();
    }
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  get items(): FormArray {
    return this.invoiceForm.controls.items;
  }

  createItem() {
    return this.fb.nonNullable.group({
      description: ['', Validators.required],
      quantity: [1, [
        Validators.required,
        Validators.min(0.01)
      ]],
      unitPrice: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      taxRate: [0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100)
      ]]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) {
      return;
    }

    this.items.removeAt(index);
  }

  getItemTaxableAmount(index: number): number {
    const item = this.items.at(index).getRawValue();

    return Number(item.quantity || 0) *
      Number(item.unitPrice || 0);
  }

  getItemTax(index: number): number {
    const item = this.items.at(index).getRawValue();

    return this.getItemTaxableAmount(index) *
      Number(item.taxRate || 0) / 100;
  }

  getItemTotal(index: number): number {
    return this.getItemTaxableAmount(index) +
      this.getItemTax(index);
  }

  get taxableAmount(): number {
    return this.items.controls.reduce(
      (total, _, index) => total + this.getItemTaxableAmount(index),
      0
    );
  }

  get itemTaxAmount(): number {
    return this.items.controls.reduce(
      (total, _, index) => total + this.getItemTax(index),
      0
    );
  }

  get additionalTax(): number {
    const value = this.invoiceForm.getRawValue();

    return Number(value.cgst || 0) +
      Number(value.sgst || 0) +
      Number(value.igst || 0);
  }

  get totalTax(): number {
    return this.itemTaxAmount + this.additionalTax;
  }

  get grandTotal(): number {
    return this.taxableAmount + this.totalTax;
  }

  formatCurrency(value: number): string {
    const currency = this.invoiceForm.controls.currency.value || 'INR';

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(value || 0);
    } catch {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2
      }).format(value || 0);
    }
  }

  saveDraft(): void {
    this.createInvoice('DRAFT');
  }

  submitInvoice(status: 'DRAFT' | 'SUBMITTED'): void {
    this.createInvoice(status);
  }

  private buildInvoicePayload() {
    const form = this.invoiceForm.getRawValue();

    if (!form.invoiceDate) {
      throw new Error('Invoice date is required to create an invoice.');
    }

    return {
      vendor: {
        vendorCode: form.vendor.vendorCode.trim(),
        name: form.vendor.name.trim(),
        gstin: form.vendor.gstin || undefined,
        email: form.vendor.email || undefined,
        mobile: form.vendor.mobile || undefined,
        address: form.vendor.address || undefined
      },
      invoiceDate: this.formatDate(form.invoiceDate),
      dueDate: form.dueDate
        ? this.formatDate(form.dueDate)
        : undefined,
      currency: form.currency,
      purchaseOrderNumber: form.purchaseOrderNumber || undefined,
      items: this.items.controls.map(itemControl => {
        const item = itemControl.getRawValue();

        return {
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate)
        };
      }),
      cgst: Number(form.cgst),
      sgst: Number(form.sgst),
      igst: Number(form.igst)
    };
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear().toString().padStart(4, '0');
    const month = (value.getMonth() + 1).toString().padStart(2, '0');
    const day = value.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private createInvoice(targetStatus: 'DRAFT' | 'SUBMITTED'): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.invoiceForm.invalid || this.items.length === 0) {
      this.invoiceForm.markAllAsTouched();

      this.errorMessage = this.items.length === 0
        ? 'At least one invoice item is required.'
        : 'Please complete all required fields.';

      this.toast.warning(this.errorMessage, 'Invalid invoice');
      return;
    }

    this.isLoading = true;

    if (this.invoiceId) {
      this.invoiceService.updateInvoice(
        this.invoiceId,
        this.buildInvoicePayload()
      ).subscribe({
        next: response => {
          this.isLoading = false;

          if (!response.success) {
            this.errorMessage = response.message || 'Unable to update invoice.';
            this.toast.error(this.errorMessage, 'Invoice update failed');
            return;
          }

          this.toast.success('Invoice updated successfully.');
          this.router.navigate(['/invoices']);
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage = error?.error?.message ||
            'Unable to update invoice.';
          this.toast.error(this.errorMessage, 'Invoice update failed');
        }
      });
      return;
    }

    this.invoiceService.createInvoice(this.buildInvoicePayload()).subscribe({
      next: response => {
        const invoiceId = response.data?._id;

        if (!invoiceId) {
          this.isLoading = false;
          this.errorMessage =
            response.message || 'Unable to create invoice.';

          this.toast.error(
            this.errorMessage,
            'Invoice creation failed'
          );
          return;
        }

        if (targetStatus === 'SUBMITTED') {
          this.invoiceService.submitInvoice(invoiceId).subscribe({
            next: () => {
              this.isLoading = false;

              this.toast.success(
                'Invoice created and submitted successfully.'
              );
              this.router.navigate(['/invoices']);
            },
            error: error => {
              this.isLoading = false;

              this.errorMessage = error?.error?.message ||
                'Invoice was created but could not be submitted.';

              this.toast.error(
                this.errorMessage,
                'Invoice submission failed'
              );
            }
          });

          return;
        }

        this.isLoading = false;

        this.toast.success('Invoice draft created successfully.');
        this.router.navigate(['/invoices']);
      },
      error: error => {
        this.isLoading = false;

        this.errorMessage = error?.error?.message ||
          'Unable to create invoice.';

        this.toast.error(
          this.errorMessage,
          'Invoice creation failed'
        );
      }
    });
  }

  saveChanges(): void {
    this.createInvoice('DRAFT');
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }
}
