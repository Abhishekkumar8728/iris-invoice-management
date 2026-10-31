
import {
  Component,
  inject,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, debounceTime, finalize } from 'rxjs';

import {
  InvoiceService,
  ChatbotApiResponse,
} from '../../core/services/invoice.service';

import { MaterialFormModule } from '../material-form.module';

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
  type?: string;
  data?: any;
  loading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialFormModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements OnDestroy {
  private readonly invoiceService = inject(InvoiceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly invoiceChangesSubscription: Subscription;
  private summaryRefreshSubscription?: Subscription;
  private invoiceUpdatePending = false;

  isOpen = false;
  isLoading = false;
  userMessage = '';

  messages: ChatMessage[] = [
    {
      sender: 'bot',
      message:
        'Hello! 👋 I am the IRIS Invoice Assistant. I can help you with invoice information.',
      type: 'welcome',
    },
  ];

  suggestedQuestions: string[] = [
    'How many approved invoices?',
    'How many pending invoices?',
    'What is the total invoice value?',
    'What is the total paid invoice value?',
    'Show my invoice summary',
  ];

  constructor() {
    this.invoiceChangesSubscription = this.invoiceService.invoiceChanges$
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.invoiceUpdatePending = true;

        if (this.isOpen) {
          this.refreshInvoiceSummary();
        }
      });
  }

  ngOnDestroy(): void {
    this.invoiceChangesSubscription.unsubscribe();
    this.summaryRefreshSubscription?.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen && this.invoiceUpdatePending) {
      this.refreshInvoiceSummary();
    }

    this.cdr.detectChanges();
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(message?: string): void {
    const text = (message ?? this.userMessage).trim();

    if (!text || this.isLoading) {
      return;
    }

    this.messages.push({
      sender: 'user',
      message: text,
      type: 'user',
    });

    this.userMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.invoiceService
      .sendChatbotMessage(text)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: ChatbotApiResponse) => {
          this.addBotResponse(response);
        },

        error: (error) => {
          console.error('Chatbot API error:', error);

          this.messages.push({
            sender: 'bot',
            message: 'Unable to get an answer. Please try again.',
            type: 'error',
          });

          this.cdr.detectChanges();
        },
      });
  }

  private addBotResponse(response: ChatbotApiResponse): void {
    this.messages.push({
      sender: 'bot',
      message:
        response?.data?.message ??
        response?.message ??
        'No response received from the server.',
      type: response?.data?.type ?? 'text',
      data: response?.data?.data ?? {},
    });

    this.cdr.detectChanges();
  }

  private refreshInvoiceSummary(): void {
    if (!this.invoiceUpdatePending) {
      return;
    }

    this.summaryRefreshSubscription?.unsubscribe();
    this.summaryRefreshSubscription = this.invoiceService.getDashboardStats()
      .subscribe({
        next: response => {
          if (!response.success || !response.data) {
            console.error(
              'Unable to refresh invoice summary:',
              response.message
            );
            this.messages.push({
              sender: 'bot',
              message: response.message || 'Unable to refresh invoice data.',
              type: 'error',
            });
            this.cdr.detectChanges();
            return;
          }

          this.invoiceUpdatePending = false;
          this.messages.push({
            sender: 'bot',
            message: 'Invoice data updated. Here is the latest summary.',
            type: 'stats',
            data: response.data,
          });
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Unable to refresh invoice summary:', error);
          this.messages.push({
            sender: 'bot',
            message: 'Unable to refresh invoice data. Please reopen the assistant to try again.',
            type: 'error',
          });
          this.cdr.detectChanges();
        },
      });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  trackMessage(index: number, message: ChatMessage): string {
    return `${message.sender}-${index}`;
  }

  getStatusLabel(status: string): string {
    return status || 'Invoice';
  }

  getStatusCount(data: any): number {
    return Number(data?.count ?? 0);
  }

  getPendingCount(data: any): number {
    return Number(data?.pendingCount ?? 0);
  }

  getTotalValue(data: any): number {
    return Number(data?.totalValue ?? 0);
  }

  getPendingValue(data: any): number {
    return Number(data?.pendingValue ?? 0);
  }

  getPaidValue(data: any): number {
    return Number(data?.paidValue ?? 0);
  }

  getStatValue(data: any, key: string): number {
    return Number(data?.[key] ?? 0);
  }
}
