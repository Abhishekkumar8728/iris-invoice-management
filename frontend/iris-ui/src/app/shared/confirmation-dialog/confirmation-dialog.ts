import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfirmationService
} from '../../core/services/confirmation';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss'
})
export class ConfirmationDialogComponent {

  private confirmationService =
    inject(ConfirmationService);

  state$ =
    this.confirmationService.state$;

  confirm(): void {
    this.confirmationService.resolve(true);
  }

  cancel(): void {
    this.confirmationService.resolve(false);
  }

  getIcon(type?: string): string {

    switch (type) {

      case 'danger':
        return 'bi-trash3';

      case 'warning':
        return 'bi-exclamation-triangle';

      case 'success':
        return 'bi-check-circle';

      case 'info':
      default:
        return 'bi-info-circle';
    }
  }
}