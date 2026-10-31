
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { MaterialFormModule } from '../../shared/material-form.module';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    FormsModule,
    MaterialFormModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  @ViewChild('searchInput')
  searchInput?: ElementRef<HTMLInputElement>;

  @Output()
  menuToggle = new EventEmitter<void>();

  @Input()
  sidebarOpen = false;

  searchText = '';
  unreadNotifications = 0;

  user: User | null = this.authService.getStoredUser();
  userInitials = 'U';

  
  profileOpen = false;
  loggingOut = false;

  
  get profileEmail(): string {
    const profile = this.user as any;

    return profile?.email ||
      profile?.emailAddress ||
      '—';
  }

  
  get profileDepartment(): string {
    const profile = this.user as any;

    return profile?.department ||
      profile?.departmentName ||
      '—';
  }

  
  get profileCompany(): string {
    const profile = this.user as any;

    return profile?.company ||
      profile?.companyName ||
      '—';
  }

  ngOnInit(): void {
    this.loadUser();
    this.loadNotificationCount();
  }

  
  private loadUser(): void {
    this.user = this.authService.getStoredUser();
    this.userInitials = this.getUserInitials(this.user?.name);

    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = {
            ...this.user,
            ...response.data,
            name: response.data.name?.trim() ||
              this.user?.name ||
              '',
          };

          this.userInitials = this.getUserInitials(
            this.user.name
          );
        }
      },
      error: (error) => {
        console.error(
          'Unable to load the current user profile:',
          error,
        );
      },
    });
  }

  
  private getUserInitials(name?: string): string {
    if (!name?.trim()) {
      return 'U';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
      ).toUpperCase();
    }

    return parts[0].charAt(0).toUpperCase();
  }

  
  toggleMenu(): void {
    this.menuToggle.emit();
  }

  
  openNotifications(): void {
    this.profileOpen = false;
    this.router.navigate(['/notifications']);
  }

  
  loadNotificationCount(): void {
    this.notificationService.getUnreadNotifications(100).subscribe({
      next: (response) => {
        this.unreadNotifications =
          response.success ? response.data.length : 0;
      },
      error: () => {
        this.unreadNotifications = 0;
      },
    });
  }

  
  focusSearch(): void {
    this.searchInput?.nativeElement.focus();
  }

  
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    const search = this.searchText.trim();

    if (!search) {
      return;
    }

    
    this.profileOpen = false;

    this.router.navigate(['/invoices'], {
      queryParams: { search },
    });
  }

  
  @HostListener('document:keydown', ['$event'])
  handleSearchShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }

    
    if (event.key === 'Escape') {
      this.profileOpen = false;
    }
  }

  
  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen = !this.profileOpen;
  }

  
  @HostListener('document:click', ['$event'])
  closeProfileOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.profile-container')) {
      this.profileOpen = false;
    }
  }

  
  logout(): void {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    this.profileOpen = false;

    this.authService.logout().subscribe({
      error: (error) => {
        console.error('Unable to revoke the logout token:', error);
      },
    });

    this.authService.clearSession();
    this.user = null;
    this.userInitials = 'U';
    this.router.navigateByUrl('/login');
  }
}
