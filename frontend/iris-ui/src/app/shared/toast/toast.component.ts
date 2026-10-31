import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ToastMessage,
  ToastService
} from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {

  private toastService =
    inject(ToastService);

  toasts$ =
    this.toastService.toasts$;

  remove(id: number): void {
    this.toastService.dismiss(id);
  }

  getIcon(type: ToastMessage['type']): string {

    switch (type) {

      case 'success':
        return 'bi-check-circle-fill';

      case 'error':
        return 'bi-x-circle-fill';

      case 'warning':
        return 'bi-exclamation-triangle-fill';

      case 'info':
      default:
        return 'bi-info-circle-fill';
    }
  }
}