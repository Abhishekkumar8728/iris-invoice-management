import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { MaterialFormModule } from '../../../shared/material-form.module';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-vendor-create',
  standalone: true,

  imports: [CommonModule, ReactiveFormsModule, MaterialFormModule],

  templateUrl: './vendor-create.html',

  styleUrl: './vendor-create.scss',
})
export class VendorCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  

  isLoading = false;
  errorMessage = '';

  successMessage = '';

  

  vendorTypes = ['Manufacturer', 'Distributor', 'Supplier', 'Service Provider', 'Other'];

  countries = ['India', 'Germany', 'United States', 'United Kingdom', 'Other'];

  states = [
    'Andhra Pradesh',
    'Delhi',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Punjab',
    'Rajasthan',
    'Tamil Nadu',
    'Telangana',
    'Uttar Pradesh',
    'West Bengal',
    'Other',
  ];

  paymentTerms = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days'];

  currencies = [
    {
      code: 'INR',
      name: 'Indian Rupee',
    },
    {
      code: 'EUR',
      name: 'Euro',
    },
    {
      code: 'USD',
      name: 'US Dollar',
    },
    {
      code: 'GBP',
      name: 'British Pound',
    },
  ];

  

  vendorForm = this.fb.nonNullable.group({
    

    vendorCode: ['', [Validators.required, Validators.maxLength(50)]],

    vendorName: ['', [Validators.required, Validators.maxLength(150)]],

    gstNumber: ['', [Validators.required, Validators.maxLength(20)]],

    panNumber: ['', [Validators.required, Validators.maxLength(20)]],

    vendorType: ['', Validators.required],

    country: ['India', Validators.required],

    status: ['ACTIVE', Validators.required],

    

    addressLine1: ['', [Validators.required, Validators.maxLength(250)]],

    addressLine2: ['', Validators.maxLength(250)],

    city: ['', [Validators.required, Validators.maxLength(100)]],

    state: ['', Validators.required],

    pinCode: ['', [Validators.pattern(/^[0-9]{6}$/)]],

    

    contactPerson: ['', Validators.maxLength(100)],

    emailAddress: ['', [Validators.required, Validators.email]],

    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{10,15}$/)]],

    alternatePhoneNumber: ['', Validators.pattern(/^[0-9+\-\s]{10,15}$/)],

    

    paymentTerms: ['', Validators.required],

    currency: ['INR', Validators.required],

    remarks: ['', Validators.maxLength(500)],
  });

  

  ngOnInit(): void {
    this.errorMessage = '';

    this.successMessage = '';
  }

  

  get form() {
    return this.vendorForm.controls;
  }

  

  saveVendor(): void {
    this.errorMessage = '';

    this.successMessage = '';

    

    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();

      this.errorMessage = 'Please complete all required fields.';
      this.toast.warning(this.errorMessage, 'Invalid vendor information');

      return;
    }

    this.isLoading = true;

    const form = this.vendorForm.getRawValue();

    

    const vendorPayload = {
      vendorCode: form.vendorCode.trim(),

      vendorName: form.vendorName.trim(),

      gstNumber: form.gstNumber.trim(),

      panNumber: form.panNumber.trim(),

      vendorType: form.vendorType,

      country: form.country,

      status: form.status,

      address: {
        addressLine1: form.addressLine1.trim(),

        addressLine2: form.addressLine2.trim(),

        city: form.city.trim(),

        state: form.state,

        pinCode: form.pinCode.trim(),
      },

      contact: {
        contactPerson: form.contactPerson.trim(),

        emailAddress: form.emailAddress.trim(),

        phoneNumber: form.phoneNumber.trim(),

        alternatePhoneNumber: form.alternatePhoneNumber.trim(),
      },

      paymentTerms: form.paymentTerms,

      currency: form.currency,

      remarks: form.remarks.trim(),
    };

    

    console.log('Vendor payload:', vendorPayload);

    

    setTimeout(() => {
      this.isLoading = false;

      this.successMessage = 'Vendor information is ready to be saved.';
      this.toast.success(this.successMessage);
    }, 500);
  }

  

  cancel(): void {
    this.router.navigate(['/vendors']);
  }

  

  backToVendors(): void {
    this.router.navigate(['/vendors']);
  }

  

  hasError(controlName: keyof typeof this.vendorForm.controls): boolean {
    const control = this.vendorForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }
}
