import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConnectionsService } from '../../../core/services/connections.service';
import { AuthService } from '../../../core/services/auth.service';
import { Connection } from '../../../core/models';

@Component({
  selector: 'app-connection-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <!-- Hero Header -->
      <div class="hero-header">
        <button mat-icon-button routerLink="/connections" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="hero-content" *ngIf="connection">
          <div class="hero-icon">
            <span class="utility-emoji">{{ getUtilityEmoji(connection.utilityTypeName) }}</span>
          </div>
          <div class="hero-text">
            <h1>{{ connection.connectionNumber }}</h1>
            <div class="hero-meta">
              <span class="meta-item">
                <mat-icon>speed</mat-icon>
                {{ connection.meterNumber }}
              </span>
              <span class="status-badge" [class]="connection.status === 'Active' ? 'active' : 'inactive'">
                {{ connection.status }}
              </span>
            </div>
          </div>
        </div>
        <div class="hero-actions" *ngIf="connection && canEdit">
          <button mat-flat-button class="edit-btn" [routerLink]="['/connections', connection.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit Connection
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading && connection" class="detail-content">
        <!-- Main Info Cards Row -->
        <div class="cards-row">
          <!-- Connection Details Card -->
          <div class="glass-card connection-card">
            <div class="card-header">
              <div class="card-icon">⚡</div>
              <h2>Connection Details</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <div class="info-block">
                  <span class="info-label">Utility Type</span>
                  <span class="info-value highlight">{{ connection.utilityTypeName }}</span>
                </div>
                <div class="info-block">
                  <span class="info-label">Tariff Plan</span>
                  <span class="info-value">{{ connection.tariffPlanName }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-block">
                  <span class="info-label">Connection Date</span>
                  <span class="info-value">{{ connection.connectionDate | date:'MMMM d, yyyy' }}</span>
                </div>
                <div class="info-block" *ngIf="connection.loadSanctioned">
                  <span class="info-label">Load Sanctioned</span>
                  <span class="info-value">{{ connection.loadSanctioned }} kW</span>
                </div>
              </div>
              <div class="address-block" *ngIf="connection.installationAddress">
                <span class="info-label">📍 Installation Address</span>
                <span class="info-value address">{{ connection.installationAddress }}</span>
              </div>
            </div>
          </div>

          <!-- Consumer Info Card -->
          <div class="glass-card consumer-card">
            <div class="card-header">
              <div class="card-icon">👤</div>
              <h2>Consumer Information</h2>
            </div>
            <div class="card-body">
              <div class="consumer-profile">
                <div class="avatar">
                  {{ getInitials(connection.consumerName) }}
                </div>
                <div class="consumer-details">
                  <h3>{{ connection.consumerName }}</h3>
                  <span class="consumer-number">{{ connection.consumerNumber }}</span>
                </div>
              </div>
              <button mat-flat-button class="profile-btn" [routerLink]="['/consumers', connection.consumerId]">
                <mat-icon>person</mat-icon>
                View Full Profile
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon cyan">📊</div>
            <div class="stat-info">
              <span class="stat-label">Meter Number</span>
              <span class="stat-value">{{ connection.meterNumber }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div class="stat-info">
              <span class="stat-label">Status</span>
              <span class="stat-value" [class.text-green]="connection.status === 'Active'" [class.text-red]="connection.status !== 'Active'">
                {{ connection.status }}
              </span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">📅</div>
            <div class="stat-info">
              <span class="stat-label">Connected Since</span>
              <span class="stat-value">{{ connection.connectionDate | date:'MMM yyyy' }}</span>
            </div>
          </div>
          <div class="stat-card" *ngIf="connection.loadSanctioned">
            <div class="stat-icon orange">⚡</div>
            <div class="stat-info">
              <span class="stat-label">Sanctioned Load</span>
              <span class="stat-value">{{ connection.loadSanctioned }} kW</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.5s ease-out;
      max-width: 1400px;
      margin: 0 auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Hero Header */
    .hero-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem 2.5rem;
      background: linear-gradient(135deg, rgba(0, 210, 255, 0.08) 0%, rgba(0, 131, 176, 0.04) 100%);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 20px;
      margin-bottom: 2rem;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .back-btn {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 210, 255, 0.15);
        border-color: rgba(0, 210, 255, 0.3);
        color: #00D2FF;
        transform: translateX(-3px);
      }
    }

    .hero-content {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
    }

    .hero-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(0, 131, 176, 0.1) 100%);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;

      .utility-emoji {
        font-size: 32px;
      }
    }

    .hero-text {
      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.02em;
      }
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #00D2FF;
        }
      }
    }

    .status-badge {
      padding: 0.375rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      &.active {
        background: linear-gradient(135deg, rgba(0, 242, 96, 0.2) 0%, rgba(0, 200, 83, 0.1) 100%);
        color: #00F260;
        border: 1px solid rgba(0, 242, 96, 0.3);
        box-shadow: 0 0 20px rgba(0, 242, 96, 0.15);
      }

      &.inactive {
        background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 90, 0.1) 100%);
        color: #FF6B6B;
        border: 1px solid rgba(255, 107, 107, 0.3);
      }
    }

    .hero-actions {
      .edit-btn {
        background: linear-gradient(135deg, #00D2FF 0%, #0083B0 100%);
        color: #000;
        font-weight: 600;
        padding: 0.5rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 210, 255, 0.3);
        transition: all 0.3s ease;

        mat-icon {
          margin-right: 0.5rem;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(0, 210, 255, 0.4);
        }
      }
    }

    /* Loading */
    .loading {
      display: flex;
      justify-content: center;
      padding: 4rem;
      --mdc-circular-progress-active-indicator-color: #00D2FF;
    }

    /* Cards Row */
    .cards-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(255, 255, 255, 0.02);

      .card-icon {
        font-size: 24px;
      }

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
    }

    .card-body {
      padding: 1.75rem;
    }

    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .info-block {
      .info-label {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.5rem;
      }

      .info-value {
        display: block;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;

        &.highlight {
          color: #00D2FF;
          font-weight: 600;
        }
      }
    }

    .address-block {
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);

      .info-label {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.5rem;
      }

      .info-value.address {
        display: block;
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
      }
    }

    /* Consumer Card */
    .consumer-profile {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .avatar {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }

    .consumer-details {
      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #fff;
      }

      .consumer-number {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Monaco', 'Consolas', monospace;
      }
    }

    .profile-btn {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #00D2FF;
      font-weight: 500;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      transition: all 0.3s ease;

      mat-icon {
        margin-right: 0.5rem;
      }

      &:hover {
        background: rgba(0, 210, 255, 0.1);
        border-color: rgba(0, 210, 255, 0.3);
        box-shadow: 0 0 20px rgba(0, 210, 255, 0.15);
      }
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-2px);
      }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.cyan {
        background: linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(0, 131, 176, 0.1) 100%);
        border: 1px solid rgba(0, 210, 255, 0.2);
      }

      &.green {
        background: linear-gradient(135deg, rgba(0, 242, 96, 0.2) 0%, rgba(0, 200, 83, 0.1) 100%);
        border: 1px solid rgba(0, 242, 96, 0.2);
      }

      &.purple {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.1) 100%);
        border: 1px solid rgba(102, 126, 234, 0.2);
      }

      &.orange {
        background: linear-gradient(135deg, rgba(255, 159, 67, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
        border: 1px solid rgba(255, 159, 67, 0.2);
      }
    }

    .stat-info {
      .stat-label {
        display: block;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.25rem;
      }

      .stat-value {
        display: block;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
    }

    .text-green { color: #00F260 !important; }
    .text-red { color: #FF6B6B !important; }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #FF6B6B;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 107, 107, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 107, 107, 0.2);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem;
      }

      .hero-actions {
        width: 100%;
        .edit-btn { width: 100%; }
      }

      .cards-row {
        grid-template-columns: 1fr;
      }

      .info-row {
        grid-template-columns: 1fr;
      }

      .stats-row {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class ConnectionDetailComponent implements OnInit {
  connection: Connection | null = null;
  loading = true;
  error: string | null = null;
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private connectionsService: ConnectionsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Only Admin can edit - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadConnection(id);
    } else {
      this.error = 'Invalid connection ID';
      this.loading = false;
    }
  }

  loadConnection(id: number): void {
    this.connectionsService.getById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.connection = response.data;
        } else {
          this.error = response.message || 'Connection not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load connection';
        this.cdr.detectChanges();
      }
    });
  }

  getUtilityEmoji(utilityType: string): string {
    const emojiMap: { [key: string]: string } = {
      'Electricity': '⚡',
      'Electric': '⚡',
      'Water': '💧',
      'Gas': '🔥',
      'Internet': '🌐',
      'Sewage': '🚰',
      'Waste': '🗑️'
    };
    return emojiMap[utilityType] || '⚡';
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
