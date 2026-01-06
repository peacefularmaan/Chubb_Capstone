import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;
  filterIsRead?: boolean;
  deletingId: number | null = null;

  constructor(
    private svc: NotificationsService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.svc.getAll(this.filterIsRead).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.notifications = res.data || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.snack.open('Failed to load notifications', 'Close', { duration: 3000 });
      }
    });
  }

  markRead(n: Notification): void {
    if (n.isRead) return;
    this.svc.markAsRead(n.id).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (response.success) {
            n.isRead = true;
          } else {
            this.snack.open('Failed to mark as read', 'Close', { duration: 3000 });
          }
          this.cdr.detectChanges();
        });
      },
      error: () => this.snack.open('Failed to mark as read', 'Close', { duration: 3000 })
    });
  }

  deleteNotification(n: Notification): void {
    if (this.deletingId === n.id) return; // Prevent double-click
    this.deletingId = n.id;
    this.cdr.detectChanges();
    
    this.svc.delete(n.id).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.deletingId = null;
          if (response && response.success === true) {
            this.notifications = this.notifications.filter(x => x.id !== n.id);
            this.snack.open('Notification deleted successfully', 'Close', { duration: 3000 });
          } else {
            this.snack.open(response?.message || 'Failed to delete notification', 'Close', { duration: 3000 });
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        });
        this.snack.open('Failed to delete notification', 'Close', { duration: 3000 });
      }
    });
  }

  markAllRead(): void {
    this.svc.markAllAsRead().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (response.success) {
            this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
            this.snack.open('All notifications marked as read', 'Close', { duration: 3000 });
          } else {
            this.snack.open('Failed to mark all as read', 'Close', { duration: 3000 });
          }
          this.cdr.detectChanges();
        });
      },
      error: () => this.snack.open('Failed to mark all as read', 'Close', { duration: 3000 })
    });
  }
}
