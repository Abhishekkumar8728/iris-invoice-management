import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutStateService {

  private sidebarSubject =
    new BehaviorSubject<boolean>(false);

  readonly sidebarOpen$ =
    this.sidebarSubject.asObservable();

  toggleSidebar(): void {

    this.sidebarSubject.next(
      !this.sidebarSubject.value
    );
  }

  closeSidebar(): void {
    this.sidebarSubject.next(false);
  }
}