
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  readonly toasts$ = this.toastService.toasts$;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'warning':
        return '⚠';
      default:
        return 'i';
    }
  }
}
