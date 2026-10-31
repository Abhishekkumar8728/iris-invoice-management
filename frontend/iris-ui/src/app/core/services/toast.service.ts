
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly duration = 2_000;
  private nextId = 0;

  private readonly toastSubject =
    new BehaviorSubject<ToastMessage[]>([]);

  readonly toasts$ = this.toastSubject.asObservable();

  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string, title = 'Success'): void {
    this.show('success', title, message);
  }

  error(message: string, title = 'Error'): void {
    this.show('error', title, message);
  }

  warning(message: string, title = 'Warning'): void {
    this.show('warning', title, message);
  }

  info(message: string, title = 'Information'): void {
    this.show('info', title, message);
  }

  show(type: ToastType, title: string, message: string): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();

    const id = ++this.nextId;

    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      createdAt: Date.now(),
    };

    this.toastSubject.next([toast]);

    const timer = setTimeout(() => {
      this.dismiss(id);
    }, this.duration);

    this.timers.set(id, timer);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastSubject.next(
      this.toastSubject.value.filter(toast => toast.id !== id),
    );
  }

  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.toastSubject.next([]);
  }
}
