import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,

  imports: [RouterLink, RouterLinkActive],

  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  

  @Input() isOpen = false;

  

  unreadNotifications = 0;

  

  @Output()
  sidebarStateChange = new EventEmitter<boolean>();

  

  ngOnInit(): void {
    this.loadNotificationCount();
  }

  

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;

    this.sidebarStateChange.emit(this.isOpen);
  }

  

  onNavigation(): void {
    

    if (window.innerWidth <= 900) {
      this.isOpen = false;

      this.sidebarStateChange.emit(false);
    }
  }

  

  loadNotificationCount(): void {
    this.notificationService.getUnreadNotifications(100).subscribe({
      next: (response) => {
        this.unreadNotifications = response.success ? response.data.length : 0;
      },

      error: () => {
        this.unreadNotifications = 0;
      },
    });
  }
}
