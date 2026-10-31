import { NgModule } from '@angular/core';



import { MatButtonModule } from '@angular/material/button';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatNativeDateModule } from '@angular/material/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSelectModule } from '@angular/material/select';

import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    MatButtonModule,

    MatCheckboxModule,

    MatDatepickerModule,

    MatFormFieldModule,

    MatIconModule,

    MatInputModule,

    MatNativeDateModule,

    MatProgressSpinnerModule,

    MatSelectModule,

    MatTooltipModule,
  ],

  exports: [
    MatButtonModule,

    MatCheckboxModule,

    MatDatepickerModule,

    MatFormFieldModule,

    MatIconModule,

    MatInputModule,

    MatNativeDateModule,

    MatProgressSpinnerModule,

    MatSelectModule,

    MatTooltipModule,
  ],
})
export class MaterialFormModule {}
