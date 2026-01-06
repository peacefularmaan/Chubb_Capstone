import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Notification } from '../../../core/models';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="notification-popup">
      <div class="popup-header">
        <div class="header-content">
          <div class="bell-wrapper">
            <mat-icon class="bell-icon">notifications_active</mat-icon>
            <span class="badge">{{ data.notifications.length }}</span>
          </div>
          <div class="header-text">
            <h2>New Notifications</h2>
            <p>You have {{ data.notifications.length }} unread message{{ data.notifications.length > 1 ? 's' : '' }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="popup-content">
        <div class="notification-card" 
             *ngFor="let notification of data.notifications; let i = index"
             [style.animation-delay]="i * 0.05 + 's'"
             [class]="'type-' + getTypeClass(notification.type)">
          <div class="card-indicator"></div>
          <div class="card-icon">
            <mat-icon [class]="getIconClass(notification.type)">{{ getIcon(notification.type) }}</mat-icon>
          </div>
          <div class="card-content">
            <div class="card-title">{{ notification.title }}</div>
            <div class="card-message">{{ notification.message }}</div>
            <div class="card-time">
              <mat-icon>schedule</mat-icon>
              {{ getTimeAgo(notification.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <button mat-button class="mark-read-btn" (click)="markAllRead()">
          <mat-icon>done_all</mat-icon>
          Mark all as read
        </button>
        <button mat-flat-button color="primary" class="view-all-btn" (click)="viewAll()">
          View All
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-popup {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      overflow: hidden;
      margin: -24px;
      border-radius: 16px;
      background: rgba(22, 33, 62, 0.95);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, rgba(0,210,255,0.2) 0%, rgba(0,242,96,0.15) 100%);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      color: white;

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .bell-wrapper {
          position: relative;
          background: rgba(0,210,255,0.2);
          border-radius: 12px;
          padding: 10px;
          
          .bell-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
            color: #00D2FF;
            animation: ring 2s ease-in-out infinite;
          }

          .badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #FF6B6B;
            color: white;
            font-size: 11px;
            font-weight: 600;
            min-width: 20px;
            height: 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(22,33,62,0.95);
          }
        }

        .header-text {
          h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: rgba(255,255,255,0.95);
          }

          p {
            margin: 4px 0 0;
            font-size: 13px;
            color: rgba(255,255,255,0.6);
          }
        }
      }

      .close-btn {
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.05);
        transition: all 0.2s;

        &:hover {
          background: rgba(255,255,255,0.1);
          color: #FF6B6B;
        }
      }
    }

    @keyframes ring {
      0%, 100% { transform: rotate(0deg); }
      5% { transform: rotate(-15deg); }
      10% { transform: rotate(15deg); }
      15% { transform: rotate(-10deg); }
      20% { transform: rotate(10deg); }
      25% { transform: rotate(0deg); }
    }

    .popup-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: rgba(10,10,15,0.5);
      max-height: 400px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 3px;
      }
    }

    .notification-card {
      display: flex;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      overflow: hidden;
      animation: slideIn 0.3s ease-out forwards;
      opacity: 0;
      transform: translateX(-10px);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        background: rgba(255,255,255,0.07);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .card-indicator {
        width: 4px;
        flex-shrink: 0;
      }

      &.type-success .card-indicator { background: linear-gradient(180deg, #00F260, #00c853); }
      &.type-warning .card-indicator { background: linear-gradient(180deg, #FFD93D, #f59e0b); }
      &.type-error .card-indicator { background: linear-gradient(180deg, #FF6B6B, #ef4444); }
      &.type-info .card-indicator { background: linear-gradient(180deg, #00D2FF, #0891b2); }
      &.type-bill .card-indicator { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
      &.type-payment .card-indicator { background: linear-gradient(180deg, #00D2FF, #00F260); }

      .card-icon {
        padding: 16px 12px 16px 16px;
        display: flex;
        align-items: flex-start;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          padding: 8px;
          border-radius: 10px;
        }

        .icon-success {
          background: rgba(0,242,96,0.15);
          color: #00F260;
        }

        .icon-warning {
          background: rgba(255,217,61,0.15);
          color: #FFD93D;
        }

        .icon-error {
          background: rgba(255,107,107,0.15);
          color: #FF6B6B;
        }

        .icon-info {
          background: rgba(0,210,255,0.15);
          color: #00D2FF;
        }

        .icon-bill {
          background: rgba(139,92,246,0.15);
          color: #8b5cf6;
        }

        .icon-payment {
          background: rgba(0,210,255,0.15);
          color: #00D2FF;
        }
      }

      .card-content {
        flex: 1;
        padding: 14px 16px 14px 4px;
        min-width: 0;

        .card-title {
          font-weight: 600;
          font-size: 14px;
          color: rgba(255,255,255,0.95);
          margin-bottom: 4px;
        }

        .card-message {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-time {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .popup-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: rgba(22,33,62,0.9);
      border-top: 1px solid rgba(255,255,255,0.08);

      .mark-read-btn {
        color: rgba(255,255,255,0.6);
        font-weight: 500;

        mat-icon {
          margin-right: 6px;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          color: #00D2FF;
          background: rgba(0,210,255,0.1);
        }
      }

      .view-all-btn {
        background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%);
        color: #0a0a0f;
        border-radius: 8px;
        padding: 0 20px;
        font-weight: 600;

        mat-icon {
          margin-left: 6px;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }
  `]
})
export class NotificationPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notifications: Notification[] },
    private notificationsService: NotificationsService
  ) {}

  getIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'billgenerated':
        return 'receipt_long';
      case 'paymentreceived':
        return 'payments';
      case 'paymentdue':
        return 'warning_amber';
      case 'success':
      case 'connectionapproved':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
      case 'connectionrejected':
        return 'cancel';
      default:
        return 'notifications';
    }
  }

  getIconClass(type: string): string {
    return 'icon-' + this.getTypeClass(type);
  }

  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'billgenerated':
        return 'bill';
      case 'paymentreceived':
        return 'payment';
      case 'paymentdue':
        return 'warning';
      case 'success':
      case 'connectionapproved':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'connectionrejected':
        return 'error';
      default:
        return 'info';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe(() => {
      this.dialogRef.close('marked');
    });
  }

  viewAll(): void {
    this.dialogRef.close('viewAll');
  }

  close(): void {
    this.dialogRef.close();
  }
}
