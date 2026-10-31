import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string;

  type?: 'danger' | 'warning' | 'info' | 'success';
}

export interface ConfirmationState {
  visible: boolean;
  config: ConfirmationConfig | null;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  private stateSubject =
    new BehaviorSubject<ConfirmationState>({
      visible: false,
      config: null
    });

  readonly state$ =
    this.stateSubject.asObservable();

  confirm(
    config: ConfirmationConfig
  ): Observable<boolean> {

    return new Observable<boolean>(subscriber => {

      this.stateSubject.next({
        visible: true,
        config,
        resolve: (result: boolean) => {

          subscriber.next(result);
          subscriber.complete();

          this.close();
        }
      });

    });
  }

  close(): void {

    this.stateSubject.next({
      visible: false,
      config: null
    });
  }

  resolve(result: boolean): void {

    const current =
      this.stateSubject.value;

    if (current.resolve) {
      current.resolve(result);
    } else {
      this.close();
    }
  }
}