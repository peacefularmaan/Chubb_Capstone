import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsumersService } from '../../../core/services/consumers.service';
import { AuthService } from '../../../core/services/auth.service';
import { Consumer } from '../../../core/models';

@Component({
  selector: 'app-consumer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <!-- Hero Header -->
      <div class="hero-header">
        <button mat-icon-button routerLink="/consumers" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="hero-content" *ngIf="consumer">
          <div class="avatar">
            {{ getInitials(consumer.firstName, consumer.lastName) }}
          </div>
          <div class="hero-text">
            <h1>{{ consumer.firstName }} {{ consumer.lastName }}</h1>
            <div class="hero-meta">
              <span class="consumer-id">{{ consumer.consumerNumber }}</span>
              <span class="status-badge" [class]="consumer.isActive ? 'active' : 'inactive'">
                {{ consumer.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
        <div class="hero-actions" *ngIf="consumer && canEdit">
          <button mat-flat-button class="edit-btn" [routerLink]="['/consumers', consumer.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit Profile
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading && consumer" class="detail-content">
        <!-- Quick Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon cyan">📧</div>
            <div class="stat-info">
              <span class="stat-label">Email</span>
              <span class="stat-value">{{ consumer.email }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">📱</div>
            <div class="stat-info">
              <span class="stat-label">Phone</span>
              <span class="stat-value">{{ consumer.phone || 'Not provided' }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">📅</div>
            <div class="stat-info">
              <span class="stat-label">Member Since</span>
              <span class="stat-value">{{ consumer.registrationDate | date:'MMM yyyy' }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">⚡</div>
            <div class="stat-info">
              <span class="stat-label">Connections</span>
              <span class="stat-value">{{ consumer.connections.length }}</span>
            </div>
          </div>
        </div>

        <!-- Cards Row -->
        <div class="cards-row">
          <!-- Contact & Info Card -->
          <div class="glass-card info-card">
            <div class="card-header">
              <div class="card-icon">👤</div>
              <h2>Personal Information</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <div class="info-block">
                  <span class="info-label">Full Name</span>
                  <span class="info-value highlight">{{ consumer.firstName }} {{ consumer.lastName }}</span>
                </div>
                <div class="info-block">
                  <span class="info-label">Consumer ID</span>
                  <span class="info-value mono">{{ consumer.consumerNumber }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-block">
                  <span class="info-label">Email Address</span>
                  <span class="info-value">{{ consumer.email }}</span>
                </div>
                <div class="info-block">
                  <span class="info-label">Phone Number</span>
                  <span class="info-value">{{ consumer.phone || 'Not provided' }}</span>
                </div>
              </div>
              <div class="info-row single">
                <div class="info-block">
                  <span class="info-label">Registration Date</span>
                  <span class="info-value">{{ consumer.registrationDate | date:'MMMM d, yyyy' }}</span>
                </div>
                <div class="info-block">
                  <span class="info-label">Account Status</span>
                  <span class="info-value" [class.text-green]="consumer.isActive" [class.text-red]="!consumer.isActive">
                    {{ consumer.isActive ? '✓ Active' : '✗ Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Address Card -->
          <div class="glass-card address-card">
            <div class="card-header">
              <div class="card-icon">📍</div>
              <h2>Address Details</h2>
            </div>
            <div class="card-body">
              <div class="address-display">
                <div class="address-main">
                  <span class="street">{{ consumer.address }}</span>
                  <span class="city-state">{{ consumer.city }}, {{ consumer.state }}</span>
                  <span class="postal">{{ consumer.postalCode }}</span>
                </div>
                <div class="address-map-placeholder">
                  <div class="map-icon">🗺️</div>
                </div>
              </div>
              <div class="address-breakdown">
                <div class="address-item">
                  <span class="addr-label">Street</span>
                  <span class="addr-value">{{ consumer.address }}</span>
                </div>
                <div class="address-item">
                  <span class="addr-label">City</span>
                  <span class="addr-value">{{ consumer.city }}</span>
                </div>
                <div class="address-item">
                  <span class="addr-label">State</span>
                  <span class="addr-value">{{ consumer.state }}</span>
                </div>
                <div class="address-item">
                  <span class="addr-label">Postal Code</span>
                  <span class="addr-value">{{ consumer.postalCode }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Connections Section -->
        <div class="glass-card connections-card">
          <div class="card-header">
            <div class="card-icon">⚡</div>
            <h2>Utility Connections</h2>
            <span class="connection-count">{{ consumer.connections.length }} {{ consumer.connections.length === 1 ? 'connection' : 'connections' }}</span>
            <button mat-flat-button class="add-btn" [routerLink]="['/connections/new']" [queryParams]="{consumerId: consumer.id}" *ngIf="canEdit">
              <mat-icon>add</mat-icon>
              Add New
            </button>
          </div>
          <div class="card-body connections-body">
            <div *ngIf="consumer.connections.length > 0" class="connections-grid">
              <div *ngFor="let conn of consumer.connections" class="connection-card" [routerLink]="['/connections', conn.id]">
                <div class="conn-icon">{{ getUtilityEmoji(conn.utilityType) }}</div>
                <div class="conn-info">
                  <div class="conn-header">
                    <span class="conn-number">{{ conn.connectionNumber }}</span>
                    <span class="conn-status" [class]="conn.status === 'Active' ? 'active' : 'inactive'">
                      {{ conn.status }}
                    </span>
                  </div>
                  <span class="conn-meter">Meter: {{ conn.meterNumber }}</span>
                  <span class="conn-type">{{ conn.utilityType }} • {{ conn.tariffPlan }}</span>
                </div>
                <mat-icon class="conn-arrow">chevron_right</mat-icon>
              </div>
            </div>
            <div *ngIf="consumer.connections.length === 0" class="no-connections">
              <div class="empty-icon">🔌</div>
              <h3>No Connections Yet</h3>
              <p>This consumer doesn't have any utility connections.</p>
              <button mat-flat-button class="add-connection-btn" [routerLink]="['/connections/new']" [queryParams]="{consumerId: consumer.id}" *ngIf="canEdit">
                <mat-icon>add</mat-icon>
                Add First Connection
              </button>
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
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
      border: 1px solid rgba(102, 126, 234, 0.2);
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
        background: rgba(102, 126, 234, 0.15);
        border-color: rgba(102, 126, 234, 0.3);
        color: #667eea;
        transform: translateX(-3px);
      }
    }

    .hero-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
    }

    .avatar {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
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

      .consumer-id {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        font-weight: 600;
        padding: 0.5rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;

        mat-icon { margin-right: 0.5rem; }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.4);
        }
      }
    }

    /* Loading */
    .loading {
      display: flex;
      justify-content: center;
      padding: 4rem;
      --mdc-circular-progress-active-indicator-color: #667eea;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
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
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
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

      .card-icon { font-size: 24px; }

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }

      .connection-count {
        margin-left: auto;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.375rem 0.875rem;
        border-radius: 20px;
      }

      .add-btn {
        background: rgba(0, 210, 255, 0.15);
        color: #00D2FF;
        border: 1px solid rgba(0, 210, 255, 0.2);
        font-size: 0.85rem;
        padding: 0.375rem 1rem;
        border-radius: 10px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 0.375rem;
        }

        &:hover {
          background: rgba(0, 210, 255, 0.25);
          border-color: rgba(0, 210, 255, 0.4);
        }
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

      &.single { margin-bottom: 0; }
    }

    .info-block {
      .info-label {
        display: block;
        font-size: 0.7rem;
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
          color: #667eea;
          font-weight: 600;
        }

        &.mono {
          font-family: 'Monaco', 'Consolas', monospace;
        }
      }
    }

    .text-green { color: #00F260 !important; }
    .text-red { color: #FF6B6B !important; }

    /* Address Card */
    .address-display {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .address-main {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      .street {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
      }

      .city-state {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .postal {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Monaco', 'Consolas', monospace;
      }
    }

    .address-map-placeholder {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(0, 210, 255, 0.1) 0%, rgba(0, 131, 176, 0.05) 100%);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      .map-icon { font-size: 32px; }
    }

    .address-breakdown {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .address-item {
      .addr-label {
        display: block;
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.25rem;
      }

      .addr-value {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    /* Connections Card */
    .connections-body {
      padding: 1.5rem;
    }

    .connections-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .connection-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 210, 255, 0.05);
        border-color: rgba(0, 210, 255, 0.2);
        transform: translateX(4px);

        .conn-arrow { color: #00D2FF; transform: translateX(4px); }
      }
    }

    .conn-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(0, 210, 255, 0.15) 0%, rgba(0, 131, 176, 0.08) 100%);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .conn-info {
      flex: 1;

      .conn-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
      }

      .conn-number {
        font-weight: 600;
        color: #fff;
        font-size: 1rem;
      }

      .conn-status {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        padding: 0.25rem 0.625rem;
        border-radius: 10px;

        &.active {
          background: rgba(0, 242, 96, 0.15);
          color: #00F260;
          border: 1px solid rgba(0, 242, 96, 0.25);
        }

        &.inactive {
          background: rgba(255, 107, 107, 0.15);
          color: #FF6B6B;
          border: 1px solid rgba(255, 107, 107, 0.25);
        }
      }

      .conn-meter {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Monaco', 'Consolas', monospace;
        margin-bottom: 0.125rem;
      }

      .conn-type {
        display: block;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .conn-arrow {
      color: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .no-connections {
      text-align: center;
      padding: 3rem 2rem;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 1rem;
        opacity: 0.8;
      }

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      p {
        margin: 0 0 1.5rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .add-connection-btn {
        background: linear-gradient(135deg, #00D2FF 0%, #0083B0 100%);
        color: #000;
        font-weight: 600;
        padding: 0.75rem 1.75rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 210, 255, 0.3);

        mat-icon { margin-right: 0.5rem; }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(0, 210, 255, 0.4);
        }
      }
    }

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

      .hero-content { flex-direction: column; align-items: flex-start; }

      .hero-actions {
        width: 100%;
        .edit-btn { width: 100%; }
      }

      .cards-row { grid-template-columns: 1fr; }
      .info-row { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .address-breakdown { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class ConsumerDetailComponent implements OnInit {
  consumer: Consumer | null = null;
  loading = true;
  error: string | null = null;
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consumersService: ConsumersService,
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
      this.loadConsumer(id);
    } else {
      this.error = 'Invalid consumer ID';
      this.loading = false;
    }
  }

  loadConsumer(id: number): void {
    this.consumersService.getById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.consumer = response.data;
        } else {
          this.error = response.message || 'Consumer not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load consumer';
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase() || '??';
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
}
