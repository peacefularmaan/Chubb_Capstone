import { Component, ViewChild, OnInit, OnDestroy, PLATFORM_ID, Inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { User } from '../../core/models';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule, MatBadgeModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer?: MatSidenav;

  currentUser$: Observable<User | null>;
  isBrowser: boolean;
  unreadCount = 0;
  isCollapsed = false;
  private subscriptions: Subscription[] = [];

  navItems = [
    { label: 'Dashboard', link: '/dashboard', icon: 'dashboard' },
    { label: 'Consumers', link: '/consumers', icon: 'people', roles: ['Admin'] },
    { label: 'Connections', link: '/connections', icon: 'electrical_services', roles: ['Admin', 'BillingOfficer'] },
    { label: 'Request Utility', link: '/connection-requests/request', icon: 'add_circle', roles: ['Consumer'] },
    { label: 'Connection Requests', link: '/connection-requests/manage', icon: 'pending_actions', roles: ['Admin'] },
    { label: 'Meter Readings', link: '/meter-readings', icon: 'speed', roles: ['BillingOfficer'] },
    { label: 'Bills', link: '/billing', icon: 'receipt', roles: ['BillingOfficer', 'Consumer'] },
    { label: 'Payments', link: '/payments', icon: 'payment', roles: ['AccountOfficer', 'Consumer'] },
    { label: 'Reports', link: '/reports', icon: 'assessment', roles: ['AccountOfficer', 'Consumer'] },
    { label: 'Billing Cycles', link: '/admin/billing-cycles', icon: 'event_repeat', roles: ['Admin'] },
    { label: 'Utility Types', link: '/admin/utility-types', icon: 'category', roles: ['Admin'] },
    { label: 'Tariff Plans', link: '/admin/tariff-plans', icon: 'price_change', roles: ['Admin'] },
    { label: 'User Management', link: '/admin/users', icon: 'manage_accounts', roles: ['Admin'] },
    { label: 'My Account', link: '/my-account', icon: 'account_circle', roles: ['Consumer'] }
  ];

  constructor(
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Reload user from storage on client-side after SSR hydration
    if (this.isBrowser) {
      this.authService.reloadUser();
      
      // Subscribe to unread count
      this.subscriptions.push(
        this.notificationsService.unreadCount$.subscribe(count => {
          this.ngZone.run(() => {
            this.unreadCount = count;
            this.cdr.detectChanges();
          });
        })
      );

      // Load initial unread count
      this.notificationsService.getUnreadNotifications().subscribe();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  navigate(link: string): void {
    // Force navigation using NgZone to ensure change detection
    this.ngZone.run(() => {
      this.router.navigateByUrl(link);
    });
  }

  toggleSidenav(): void {
    this.drawer?.toggle();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  canView(itemRoles?: string[]): boolean {
    if (!itemRoles || itemRoles.length === 0) {
      return true;
    }
    return this.authService.hasRole(itemRoles);
  }

  logout(): void {
    this.authService.logout();
  }
}
