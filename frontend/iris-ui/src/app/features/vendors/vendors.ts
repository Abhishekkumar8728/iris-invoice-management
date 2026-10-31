import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { MaterialFormModule } from '../../shared/material-form.module';

interface Vendor {
  id: string;

  vendorCode: string;

  vendorName: string;

  gstNumber: string;

  country: string;

  status: 'ACTIVE' | 'INACTIVE';

  createdAt: string;
}

@Component({
  selector: 'app-vendors',

  standalone: true,

  imports: [
    CommonModule,

    ReactiveFormsModule,

    MaterialFormModule,

    
    
    
    

    RouterLink,
  ],

  templateUrl: './vendors.html',

  styleUrl: './vendors.scss',
})
export class VendorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  

  isLoading = false;

  errorMessage = '';

  currentPage = 1;

  pageSize = 10;

  

  filterForm = this.fb.nonNullable.group({
    search: [''],

    status: ['ALL'],

    country: ['ALL'],
  });

  

  vendors: Vendor[] = [
    {
      id: '1',

      vendorCode: 'VND001',

      vendorName: 'ABC Auto Components Pvt Ltd',

      gstNumber: '27AABC1234F125',

      country: 'India',

      status: 'ACTIVE',

      createdAt: '2026-10-01',
    },

    {
      id: '2',

      vendorCode: 'VND002',

      vendorName: 'Global Parts Suppliers',

      gstNumber: '27BCCC5678F126',

      country: 'India',

      status: 'ACTIVE',

      createdAt: '2026-09-25',
    },

    {
      id: '3',

      vendorCode: 'VND003',

      vendorName: 'Skoda Auto India Pvt Ltd',

      gstNumber: '27CCCA9876F127',

      country: 'India',

      status: 'INACTIVE',

      createdAt: '2026-09-20',
    },

    {
      id: '4',

      vendorCode: 'VND004',

      vendorName: 'Volkswagen Group Services',

      gstNumber: '27DDA4321F128',

      country: 'Germany',

      status: 'ACTIVE',

      createdAt: '2026-09-18',
    },

    {
      id: '5',

      vendorCode: 'VND005',

      vendorName: 'AutoTech Solutions',

      gstNumber: '27EEEA8765F129',

      country: 'India',

      status: 'ACTIVE',

      createdAt: '2026-09-15',
    },

    {
      id: '6',

      vendorCode: 'VND006',

      vendorName: 'Premium Mobility Systems',

      gstNumber: '27FFFA7654F130',

      country: 'Germany',

      status: 'ACTIVE',

      createdAt: '2026-09-10',
    },

    {
      id: '7',

      vendorCode: 'VND007',

      vendorName: 'NextGen Automotive',

      gstNumber: '27GGGA6543F131',

      country: 'India',

      status: 'INACTIVE',

      createdAt: '2026-09-08',
    },

    {
      id: '8',

      vendorCode: 'VND008',

      vendorName: 'European Auto Parts',

      gstNumber: '27HHHA5432F132',

      country: 'Germany',

      status: 'ACTIVE',

      createdAt: '2026-09-05',
    },

    {
      id: '9',

      vendorCode: 'VND009',

      vendorName: 'TechDrive Components',

      gstNumber: '27IIIA4321F133',

      country: 'India',

      status: 'ACTIVE',

      createdAt: '2026-09-02',
    },

    {
      id: '10',

      vendorCode: 'VND010',

      vendorName: 'Mobility Works India',

      gstNumber: '27JJJA3210F134',

      country: 'India',

      status: 'ACTIVE',

      createdAt: '2026-08-30',
    },
  ];

  

  ngOnInit(): void {
    this.applyFilters();
  }

  

  get filteredVendors(): Vendor[] {
    const filters = this.filterForm.getRawValue();

    const search = filters.search.trim().toLowerCase();

    return this.vendors.filter((vendor) => {
      const matchesSearch =
        !search ||
        vendor.vendorCode.toLowerCase().includes(search) ||
        vendor.vendorName.toLowerCase().includes(search) ||
        vendor.gstNumber.toLowerCase().includes(search);

      const matchesStatus = filters.status === 'ALL' || vendor.status === filters.status;

      const matchesCountry = filters.country === 'ALL' || vendor.country === filters.country;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }

  

  get totalVendors(): number {
    return this.vendors.length;
  }

  get activeVendors(): number {
    return this.vendors.filter((vendor) => vendor.status === 'ACTIVE').length;
  }

  get inactiveVendors(): number {
    return this.vendors.filter((vendor) => vendor.status === 'INACTIVE').length;
  }

  get newVendors(): number {
    return this.vendors.filter((vendor) => {
      const created = new Date(vendor.createdAt);

      const now = new Date();

      const difference = now.getTime() - created.getTime();

      const days = difference / (1000 * 60 * 60 * 24);

      return days <= 30;
    }).length;
  }

  

  get countries(): string[] {
    return [...new Set(this.vendors.map((vendor) => vendor.country))];
  }

  

  applyFilters(): void {
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',

      status: 'ALL',

      country: 'ALL',
    });

    this.currentPage = 1;
  }

  

  addVendor(): void {
    this.router.navigate(['/vendors/create']);
  }

  

  viewVendor(vendor: Vendor): void {
    this.router.navigate(['/vendors', vendor.id]);
  }

  

  editVendor(vendor: Vendor): void {
    this.router.navigate(['/vendors', vendor.id, 'edit']);
  }

  

  getStatusClass(status: Vendor['status']): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: Vendor['status']): string {
    return status === 'ACTIVE' ? 'Active' : 'Inactive';
  }

  

  get totalPages(): number {
    return Math.max(
      Math.ceil(this.filteredVendors.length / this.pageSize),

      1,
    );
  }

  get paginatedVendors(): Vendor[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredVendors.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },

      (_, index) => index + 1,
    );
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  get showingFrom(): number {
    if (this.filteredVendors.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage * this.pageSize,

      this.filteredVendors.length,
    );
  }
}
