import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportsService } from '../../core/services/reports.service';
import { AuthService } from '../../core/services/auth.service';
import { BillsService } from '../../core/services/bills.service';
import { PaymentsService } from '../../core/services/payments.service';
import { MeterReadingsService } from '../../core/services/meter-readings.service';
import { ConnectionsService } from '../../core/services/connections.service';
import { UtilityTypesService } from '../../core/services/utility-types.service';
import { TariffPlansService } from '../../core/services/tariff-plans.service';
import { BillingCyclesService } from '../../core/services/billing-cycles.service';
import { DashboardSummary, User, RecentActivity, UtilityType, MeterReadingListItem, ConnectionListItem, TariffPlan, BillingCycle } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Top Header Section -->
      <header class="dashboard-hero">
        <div class="hero-content">
          <div class="greeting-section">
            <span class="greeting-label">{{ getGreeting() }}</span>
            <h1 class="user-name">{{ currentUser?.firstName || 'User' }}</h1>
            <p class="role-badge">{{ currentUser?.role || 'User' }}</p>
          </div>
          <div class="date-section">
            <div class="current-date">{{ today | date:'EEEE, MMMM d, y' }}</div>
            <button class="refresh-btn" (click)="refresh()" [disabled]="loading">
              <span class="refresh-icon" [class.spinning]="loading">↻</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Error State -->
      <div *ngIf="error" class="error-banner">
        <span class="error-icon">⚠</span>
        <span>{{ error }}</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="pulse-loader"></div>
        <span>Loading dashboard...</span>
      </div>

      <!-- Main Dashboard Content -->
      <main *ngIf="!loading && summary" class="dashboard-main">
        
        <!-- Metrics Row -->
        <section class="metrics-section">
          <div class="metrics-grid">
            
            <!-- Total Users Metric - For Admin only -->
            <article class="metric-card" *ngIf="isAdmin">
              <div class="metric-visual consumers">
                <span class="metric-icon">👥</span>
              </div>
              <div class="metric-data">
                <span class="metric-number">{{ getTotalUsers() }}</span>
                <span class="metric-title">Total Users</span>
                <span class="metric-trend positive">System users</span>
              </div>
            </article>

            <!-- Total Consumers Metric - For AccountOfficer only -->
            <article class="metric-card" *ngIf="isAccountOfficer">
              <div class="metric-visual consumers">
                <span class="metric-icon">👥</span>
              </div>
              <div class="metric-data">
                <span class="metric-number">{{ summary.totalConsumers }}</span>
                <span class="metric-title">Total Consumers</span>
                <span class="metric-trend positive">Active accounts</span>
              </div>
            </article>

            <!-- Connections Metric -->
            <article class="metric-card">
              <div class="metric-visual connections">
                <span class="metric-icon">⚡</span>
              </div>
              <div class="metric-data">
                <span class="metric-number">{{ summary.activeConnections }}</span>
                <span class="metric-title">Active Connections</span>
                <span class="metric-trend positive">Live services</span>
              </div>
            </article>

            <!-- Pending Bills Metric - For Consumer and BillingOfficer only -->
            <article class="metric-card" *ngIf="isConsumer || isBillingOfficer">
              <div class="metric-visual pending">
                <span class="metric-icon">📄</span>
              </div>
              <div class="metric-data">
                <span class="metric-number">{{ summary.pendingBills }}</span>
                <span class="metric-title">Pending Bills</span>
                <span class="metric-trend neutral">Awaiting payment</span>
              </div>
            </article>

            <!-- Overdue Bills Metric - For Consumer and BillingOfficer only -->
            <article class="metric-card" *ngIf="isConsumer || isBillingOfficer">
              <div class="metric-visual overdue">
                <span class="metric-icon">⏰</span>
              </div>
              <div class="metric-data">
                <span class="metric-number">{{ summary.overdueBills }}</span>
                <span class="metric-title">Overdue Bills</span>
                <span class="metric-trend negative">Requires attention</span>
              </div>
            </article>

          </div>
        </section>

        <!-- Financial Overview - AccountOfficer Only (Not Admin) -->
        <section class="financial-section" *ngIf="isAccountOfficer">
          <div class="financial-grid">
            
            <article class="finance-card revenue">
              <div class="finance-header">
                <span class="finance-label">Total Revenue</span>
                <span class="finance-badge">All Time</span>
              </div>
              <div class="finance-amount">
                <span class="currency">₹</span>
                <span class="amount">{{ summary.totalRevenueThisMonth | number:'1.0-0' }}</span>
                <span class="decimals">.{{ getDecimals(summary.totalRevenueThisMonth) }}</span>
              </div>
              <div class="finance-bar">
                <div class="bar-fill revenue-fill"></div>
              </div>
            </article>

            <article class="finance-card outstanding">
              <div class="finance-header">
                <span class="finance-label">Outstanding Amount</span>
                <span class="finance-badge warning">Due</span>
              </div>
              <div class="finance-amount">
                <span class="currency">₹</span>
                <span class="amount">{{ summary.totalOutstanding | number:'1.0-0' }}</span>
                <span class="decimals">.{{ getDecimals(summary.totalOutstanding) }}</span>
              </div>
              <div class="finance-bar">
                <div class="bar-fill outstanding-fill"></div>
              </div>
            </article>

          </div>
        </section>

        <!-- Charts Section - Admin Only -->
        <section class="charts-section" *ngIf="isAdmin">
          <h2 class="section-title">Administration Overview</h2>
          <div class="charts-grid">
            
            <!-- Pie Chart - User Distribution by Role -->
            <article class="chart-card">
              <header class="chart-header">
                <h3 class="chart-title">User Distribution by Role</h3>
                <span class="chart-subtitle">System users breakdown</span>
              </header>
              <div class="chart-content pie-chart-content">
                <div class="pie-chart-container">
                  <svg class="pie-chart filled" viewBox="0 0 240 240">
                    <defs>
                      <filter id="userSliceShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(0,0,0,0.25)" />
                      </filter>
                    </defs>

                    <g class="pie-slices">
                      <ng-container *ngFor="let slice of getUserRoleSlices()">
                        <path
                          class="pie-slice"
                          [attr.d]="getUserSlicePath(slice)"
                          filter="url(#userSliceShadow)"
                          [attr.fill]="slice.color">
                        </path>
                        <text
                          class="slice-label"
                          [attr.x]="getUserSliceLabelPosition(slice).x"
                          [attr.y]="getUserSliceLabelPosition(slice).y"
                          *ngIf="slice.percent >= 5">
                          {{ slice.percent }}%
                        </text>
                      </ng-container>
                    </g>

                    <circle cx="120" cy="120" r="55" class="pie-center"></circle>
                    <text x="120" y="115" class="pie-center-value">{{ getTotalUsers() }}</text>
                    <text x="120" y="135" class="pie-center-label">Total Users</text>
                  </svg>
                </div>

                <div class="pie-stats">
                  <div class="pie-stat" *ngFor="let item of usersByRole">
                    <div class="stat-label">
                      <span class="legend-color-custom" [style.background]="item.color"></span>
                      <span>{{ getRoleDisplayName(item.role) }}</span>
                    </div>
                    <div class="stat-values">
                      <span class="stat-count">{{ item.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <!-- System Overview - Utilities, Tariffs, Billing Cycles -->
            <article class="chart-card">
              <header class="chart-header">
                <h3 class="chart-title">System Overview</h3>
                <span class="chart-subtitle">Utilities, tariffs & configuration</span>
              </header>
              <div class="chart-content admin-system-content">
                <!-- Quick Stats Row -->
                <div class="admin-quick-stats">
                  <div class="admin-stat-card">
                    <span class="admin-stat-icon">🏢</span>
                    <div class="admin-stat-info">
                      <span class="admin-stat-value">{{ utilityTypes.length }}</span>
                      <span class="admin-stat-label">Utility Types</span>
                    </div>
                  </div>
                  <div class="admin-stat-card">
                    <span class="admin-stat-icon">💲</span>
                    <div class="admin-stat-info">
                      <span class="admin-stat-value">{{ getActiveTariffPlansCount() }}</span>
                      <span class="admin-stat-label">Active Tariffs</span>
                    </div>
                  </div>
                  <div class="admin-stat-card">
                    <span class="admin-stat-icon">📅</span>
                    <div class="admin-stat-info">
                      <span class="admin-stat-value">{{ getBillingCyclesCount() }}</span>
                      <span class="admin-stat-label">Billing Cycles</span>
                    </div>
                  </div>
                </div>

                <!-- Utility Details List -->
                <div class="admin-utility-list">
                  <div class="admin-utility-item" *ngFor="let stat of adminSystemStats">
                    <div class="utility-info-row">
                      <span class="utility-emoji-large">{{ stat.icon }}</span>
                      <span class="utility-name-large">{{ stat.utilityType }}</span>
                    </div>
                    <div class="utility-metrics">
                      <div class="utility-metric">
                        <span class="metric-value">{{ stat.connections }}</span>
                        <span class="metric-label">Connections</span>
                      </div>
                      <div class="utility-metric">
                        <span class="metric-value">{{ stat.tariffs }}</span>
                        <span class="metric-label">Tariff Plans</span>
                      </div>
                    </div>
                  </div>
                  <div class="empty-state" *ngIf="adminSystemStats.length === 0">
                    <span class="empty-icon">⚙️</span>
                    <span>No utility types configured</span>
                  </div>
                </div>
              </div>
            </article>

          </div>
        </section>

        <!-- Utility Billing Cycles - BillingOfficer -->
        <section class="cycles-section" *ngIf="isBillingOfficer && utilityTypes.length > 0">
          <h2 class="section-title">Billing Cycles</h2>
          <div class="cycles-grid">
            <article class="cycle-card" *ngFor="let utility of utilityTypes">
              <div class="cycle-icon" [attr.data-type]="getUtilityIconClass(utility.name)">
                {{ getUtilityEmoji(utility.name) }}
              </div>
              <div class="cycle-details">
                <span class="cycle-name">{{ utility.name }}</span>
                <span class="cycle-unit">{{ utility.unitOfMeasurement }}</span>
              </div>
              <div class="cycle-meta">
                <span class="cycle-period" [attr.data-months]="utility.billingCycleMonths">
                  {{ getBillingCycleLabel(utility.billingCycleMonths) }}
                </span>
                <span class="cycle-count">{{ utility.connectionCount }} active</span>
              </div>
            </article>
          </div>
        </section>

        <!-- Bottom Grid: Consumption & Activity -->
        <section class="insights-section">
          <div class="insights-grid">
            
            <!-- Consumer Consumption Panel - For Consumers -->
            <article class="insight-panel consumption-panel" *ngIf="isConsumer">
              <header class="panel-header">
                <h3 class="panel-title">My Consumption</h3>
                <span class="panel-subtitle">Usage across your utilities</span>
              </header>
              <div class="panel-content">
                <!-- Consumption Summary Cards -->
                <div class="consumption-summary">
                  <div class="consumption-summary-card total-usage">
                    <div class="summary-icon">⚡</div>
                    <div class="summary-details">
                      <span class="summary-label">Total Units Used</span>
                      <span class="summary-value">{{ getTotalConsumption() | number:'1.0-0' }}</span>
                    </div>
                  </div>
                  <div class="consumption-summary-card active-services">
                    <div class="summary-icon">🔌</div>
                    <div class="summary-details">
                      <span class="summary-label">Active Services</span>
                      <span class="summary-value">{{ summary.activeConnections }}</span>
                    </div>
                  </div>
                  <div class="consumption-summary-card utility-types">
                    <div class="summary-icon">📊</div>
                    <div class="summary-details">
                      <span class="summary-label">Utility Types</span>
                      <span class="summary-value">{{ summary.consumptionByUtilityType.length || 0 }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Consumption by Utility Type -->
                <div class="consumption-by-utility">
                  <div class="consumption-item" *ngFor="let item of summary.consumptionByUtilityType">
                    <div class="consumption-item-header">
                      <span class="utility-icon">{{ getUtilityEmoji(item.utilityType) }}</span>
                      <span class="utility-name">{{ item.utilityType }}</span>
                      <span class="connection-count">{{ item.connectionCount }} connection{{ item.connectionCount > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="consumption-bar-wrapper">
                      <div class="consumption-bar-container">
                        <div class="consumption-bar" 
                             [ngClass]="getBarColorClass(item.utilityType)"
                             [style.width.%]="getConsumptionBarWidth(item.totalConsumption)">
                        </div>
                      </div>
                      <div class="consumption-value">
                        <span class="consumption-amount">{{ item.totalConsumption | number:'1.0-0' }}</span>
                        <span class="consumption-unit">{{ item.unit }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="empty-state" *ngIf="!summary.consumptionByUtilityType || summary.consumptionByUtilityType.length === 0">
                    <span class="empty-icon">📊</span>
                    <span>No consumption data yet</span>
                  </div>
                </div>
              </div>
            </article>

            <!-- Billing Tasks Panel - For Billing Officers -->
            <article class="insight-panel billing-tasks-panel" *ngIf="isBillingOfficer">
              <header class="panel-header">
                <h3 class="panel-title">Billing Workflow</h3>
                <span class="panel-subtitle">Today's progress & status</span>
              </header>
              <div class="panel-content">
                
                <!-- Workflow Progress Ring -->
                <div class="workflow-visual">
                  <div class="progress-ring-container">
                    <svg class="progress-ring" viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#00F260"/>
                          <stop offset="100%" style="stop-color:#0575E6"/>
                        </linearGradient>
                        <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#f5a623"/>
                          <stop offset="100%" style="stop-color:#f7b955"/>
                        </linearGradient>
                      </defs>
                      <circle class="ring-bg" cx="60" cy="60" r="52" />
                      <circle class="ring-progress" cx="60" cy="60" r="52" 
                        [style.strokeDasharray]="getWorkflowCircumference()"
                        [style.strokeDashoffset]="getWorkflowOffset()" />
                    </svg>
                    <div class="ring-center">
                      <span class="ring-percent">{{ getWorkflowCompletionPercent() }}%</span>
                      <span class="ring-label">Complete</span>
                    </div>
                  </div>
                  <div class="workflow-legend">
                    <div class="legend-row">
                      <span class="legend-dot completed"></span>
                      <span class="legend-text">Readings Done</span>
                      <span class="legend-value">{{ summary.activeConnections - pendingReadingsConnections.length }}</span>
                    </div>
                    <div class="legend-row">
                      <span class="legend-dot pending"></span>
                      <span class="legend-text">Awaiting Reading</span>
                      <span class="legend-value">{{ pendingReadingsConnections.length }}</span>
                    </div>
                    <div class="legend-row">
                      <span class="legend-dot billed"></span>
                      <span class="legend-text">Bills Generated</span>
                      <span class="legend-value">{{ summary.totalBills }}</span>
                    </div>
                  </div>
                </div>

                <!-- Utility-wise Progress Bars -->
                <div class="utility-progress-section">
                  <h4 class="section-heading">Reading Status by Utility</h4>
                  <div class="utility-progress-list">
                    <div class="utility-progress-item" *ngFor="let utility of utilityTypes">
                      <div class="utility-info">
                        <span class="utility-emoji">{{ getUtilityEmoji(utility.name) }}</span>
                        <span class="utility-name">{{ utility.name }}</span>
                      </div>
                      <div class="progress-bar-wrapper">
                        <div class="progress-bar-track">
                          <div class="progress-bar-fill" 
                               [ngClass]="getUtilityProgressClass(utility.name)"
                               [style.width.%]="getUtilityReadingProgress(utility)">
                          </div>
                        </div>
                        <span class="progress-text">{{ utility.connectionCount }} connections</span>
                      </div>
                    </div>
                    <div class="empty-utility-state" *ngIf="utilityTypes.length === 0">
                      <div class="shimmer-bar"></div>
                      <div class="shimmer-bar short"></div>
                    </div>
                  </div>
                </div>

                <!-- Quick Action Cards -->
                <div class="quick-action-cards">
                  <a class="action-card enter-reading" routerLink="/meter-readings/new">
                    <div class="action-icon-wrapper">
                      <span class="action-glow"></span>
                      <span class="action-icon">📊</span>
                    </div>
                    <div class="action-info">
                      <span class="action-title">Enter Reading</span>
                      <span class="action-count" *ngIf="pendingReadingsConnections.length > 0">{{ pendingReadingsConnections.length }} pending</span>
                      <span class="action-count all-done" *ngIf="pendingReadingsConnections.length === 0">All done ✓</span>
                    </div>
                  </a>
                  <a class="action-card generate-bill" routerLink="/billing">
                    <div class="action-icon-wrapper">
                      <span class="action-glow"></span>
                      <span class="action-icon">🧾</span>
                    </div>
                    <div class="action-info">
                      <span class="action-title">Generate Bills</span>
                      <span class="action-count" *ngIf="unbilledReadings.length > 0">{{ unbilledReadings.length }} ready</span>
                      <span class="action-count all-done" *ngIf="unbilledReadings.length === 0">Up to date ✓</span>
                    </div>
                  </a>
                </div>

              </div>
            </article>

            <!-- Revenue Overview Panel - For Account Officers Only (Not Admin) -->
            <article class="insight-panel revenue-panel" *ngIf="isAccountOfficer">
              <header class="panel-header">
                <h3 class="panel-title">Revenue Overview</h3>
                <span class="panel-subtitle">Billing & Collection by Utility</span>
              </header>
              <div class="panel-content">
                <!-- Revenue Summary Cards -->
                <div class="revenue-summary">
                  <div class="revenue-summary-card total-billed">
                    <div class="summary-icon">💰</div>
                    <div class="summary-details">
                      <span class="summary-label">Total Billed</span>
                      <span class="summary-value">₹{{ summary.totalBilled | number:'1.0-0' }}</span>
                    </div>
                  </div>
                  <div class="revenue-summary-card total-collected">
                    <div class="summary-icon">✅</div>
                    <div class="summary-details">
                      <span class="summary-label">Collected</span>
                      <span class="summary-value">₹{{ summary.totalCollected | number:'1.0-0' }}</span>
                    </div>
                  </div>
                  <div class="revenue-summary-card collection-rate">
                    <div class="summary-icon">📊</div>
                    <div class="summary-details">
                      <span class="summary-label">Collection Rate</span>
                      <span class="summary-value">{{ getCollectionRate() | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                </div>
                
                <!-- Revenue by Utility Type -->
                <div class="revenue-by-utility">
                  <div class="revenue-item" *ngFor="let item of summary.revenueByUtilityType">
                    <div class="revenue-item-header">
                      <span class="utility-icon">{{ getUtilityEmoji(item.utilityType) }}</span>
                      <span class="utility-name">{{ item.utilityType }}</span>
                      <span class="bill-count">{{ item.billCount }} bills</span>
                    </div>
                    <div class="revenue-bars">
                      <div class="revenue-bar-container">
                        <div class="revenue-bar billed-bar" [style.width.%]="getRevenueBarWidth(item.billedAmount)">
                          <span class="bar-label" *ngIf="item.billedAmount > 0">₹{{ item.billedAmount | number:'1.0-0' }}</span>
                        </div>
                      </div>
                      <div class="revenue-bar-container">
                        <div class="revenue-bar collected-bar" [style.width.%]="getCollectedBarWidth(item.billedAmount, item.collected)">
                          <span class="bar-label" *ngIf="item.collected > 0">₹{{ item.collected | number:'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="revenue-item-footer">
                      <span class="collection-percent" [class.good]="getItemCollectionRate(item) >= 80" [class.warning]="getItemCollectionRate(item) >= 50 && getItemCollectionRate(item) < 80" [class.poor]="getItemCollectionRate(item) < 50">
                        {{ getItemCollectionRate(item) | number:'1.0-0' }}% collected
                      </span>
                    </div>
                  </div>
                  <div class="empty-state" *ngIf="!summary.revenueByUtilityType || summary.revenueByUtilityType.length === 0">
                    <span class="empty-icon">💵</span>
                    <span>No revenue data</span>
                  </div>
                </div>
                
                <!-- Legend -->
                <div class="revenue-legend">
                  <div class="legend-item"><span class="legend-color billed"></span> Billed</div>
                  <div class="legend-item"><span class="legend-color collected"></span> Collected</div>
                </div>
              </div>
            </article>

            <!-- Activity Panel - Not for Admin -->
            <article class="insight-panel activity-panel" *ngIf="!isAdmin">
              <header class="panel-header">
                <h3 class="panel-title">Recent Activity</h3>
                <span class="panel-subtitle">Latest updates</span>
              </header>
              <div class="panel-content">
                <div class="activity-list">
                  <div class="activity-item" *ngFor="let activity of summary.recentActivities" [attr.data-type]="activity.type">
                    <div class="activity-indicator" [attr.data-type]="activity.type"></div>
                    <div class="activity-content">
                      <span class="activity-text">{{ activity.description }}</span>
                      <span class="activity-time">{{ activity.timestamp | date:'MMM d, h:mm a' }}</span>
                    </div>
                  </div>
                  <div class="empty-state" *ngIf="summary.recentActivities.length === 0">
                    <span class="empty-icon">📭</span>
                    <span>No recent activity</span>
                  </div>
                </div>
              </div>
            </article>

          </div>
        </section>

      </main>
    </div>
  `,
  styles: [`
    /* ========== Base Container ========== */
    .dashboard-container {
      min-height: 100%;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ========== Hero Header ========== */
    .dashboard-hero {
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 242, 96, 0.04) 100%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      padding: 2rem 2.5rem;
      margin-bottom: 2rem;
    }

    .hero-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .greeting-section {
      .greeting-label {
        display: block;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .user-name {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .role-badge {
        display: inline-block;
        margin-top: 0.75rem;
        padding: 0.375rem 1rem;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 242, 96, 0.15));
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #00d4ff;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .date-section {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;

      .current-date {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }

      .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: rgba(0, 212, 255, 0.1);
          border-color: rgba(0, 212, 255, 0.3);
          color: #00d4ff;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-icon {
          font-size: 1.125rem;
          
          &.spinning {
            animation: spin 1s linear infinite;
          }
        }
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ========== Error & Loading States ========== */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: rgba(255, 71, 87, 0.1);
      border: 1px solid rgba(255, 71, 87, 0.3);
      border-radius: 12px;
      margin-bottom: 2rem;
      color: #ff4757;
      font-size: 0.9375rem;

      .error-icon {
        font-size: 1.25rem;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      gap: 1.5rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9375rem;

      .pulse-loader {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(0, 212, 255, 0.2);
        border-top-color: #00d4ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    /* ========== Metrics Section ========== */
    .metrics-section {
      margin-bottom: 2rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
    }

    .metric-visual {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;

      &.consumers {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      }

      &.connections {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        box-shadow: 0 8px 24px rgba(56, 239, 125, 0.4);
      }

      &.pending {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        box-shadow: 0 8px 24px rgba(245, 87, 108, 0.4);
      }

      &.overdue {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
      }
    }

    .metric-data {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .metric-number {
        font-size: 2.25rem;
        font-weight: 800;
        color: #fff;
        line-height: 1;
        letter-spacing: -0.02em;
      }

      .metric-title {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }

      .metric-trend {
        font-size: 0.75rem;
        font-weight: 500;

        &.positive { color: #38ef7d; }
        &.neutral { color: #f5a623; }
        &.negative { color: #ff4757; }
      }
    }

    /* ========== Financial Section ========== */
    .financial-section {
      margin-bottom: 2rem;
    }

    .financial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .finance-card {
      padding: 1.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .finance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .finance-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .finance-badge {
          padding: 0.25rem 0.75rem;
          background: rgba(56, 239, 125, 0.15);
          border: 1px solid rgba(56, 239, 125, 0.3);
          border-radius: 20px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #38ef7d;
          text-transform: uppercase;

          &.warning {
            background: rgba(255, 107, 107, 0.15);
            border-color: rgba(255, 107, 107, 0.3);
            color: #ff6b6b;
          }
        }
      }

      .finance-amount {
        display: flex;
        align-items: baseline;
        margin-bottom: 1.25rem;

        .currency {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-right: 0.25rem;
        }

        .amount {
          font-size: 2.75rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .decimals {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .finance-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;

        .bar-fill {
          height: 100%;
          border-radius: 3px;
          animation: barGrow 1s ease-out;

          &.revenue-fill {
            width: 70%;
            background: linear-gradient(90deg, #38ef7d, #11998e);
          }

          &.outstanding-fill {
            width: 40%;
            background: linear-gradient(90deg, #ff6b6b, #ee5a24);
          }
        }
      }
    }

    @keyframes barGrow {
      from { width: 0; }
    }

    /* ========== Actions Section ========== */
    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 1.25rem;
    }

    .actions-section {
      margin-bottom: 2rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }

    .action-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.875rem;
      padding: 1.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        background: rgba(0, 212, 255, 0.08);
        border-color: rgba(0, 212, 255, 0.3);
        transform: translateY(-4px);
        box-shadow: 0 16px 32px rgba(0, 212, 255, 0.2);

        .action-icon {
          transform: scale(1.15);
        }
      }

      .action-icon {
        font-size: 2rem;
        transition: transform 0.3s ease;
      }

      .action-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    /* ========== Cycles Section ========== */
    .cycles-section {
      margin-bottom: 2rem;
    }

    .cycles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .cycle-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .cycle-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
      }

      .cycle-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;

        .cycle-name {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9375rem;
        }

        .cycle-unit {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .cycle-meta {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .cycle-period {
          padding: 0.25rem 0.75rem;
          background: rgba(0, 212, 255, 0.15);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 12px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #00d4ff;
        }

        .cycle-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    /* ========== Insights Section ========== */
    .insights-section {
      margin-bottom: 1rem;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .insight-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      overflow: hidden;

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);

        .panel-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .panel-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
      }

      .panel-content {
        padding: 0.5rem 0;
        max-height: 320px;
        overflow-y: auto;
      }
    }

    /* Consumption Cards Grid */
    .consumption-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .consumption-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 15px;
      padding: 1rem;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      &:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      &.utility-electricity {
        border-left: 3px solid #FFD93D;
        background: linear-gradient(135deg, rgba(255, 217, 61, 0.08), rgba(255, 217, 61, 0.02));

        .card-icon { color: #FFD93D; }
      }

      &.utility-gas {
        border-left: 3px solid #FF9F5A;
        background: linear-gradient(135deg, rgba(255, 159, 90, 0.08), rgba(255, 159, 90, 0.02));

        .card-icon { color: #FF9F5A; }
      }

      &.utility-water {
        border-left: 3px solid #00D4FF;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 212, 255, 0.02));

        .card-icon { color: #00D4FF; }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;

        .card-icon {
          font-size: 1.5rem;
        }

        .card-title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .consumption-stat,
        .connection-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .stat-label {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
          }

          .stat-unit {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            margin-top: -0.25rem;
          }
        }

        .connection-stat {
          .stat-value { display: none; }

          .connection-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid rgba(0, 212, 255, 0.4);
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #00d4ff;
          }
        }
      }

      .card-footer {
        margin-top: 0.5rem;

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00D4FF, #00F5A0);
            transition: width 0.3s ease;
            border-radius: 2px;
          }
        }
      }
    }

    /* Billing Tasks Panel Styles */
    .billing-tasks-panel {
      .panel-content {
        padding: 1.25rem;
      }
    }

    /* Workflow Visual Section */
    .workflow-visual {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 242, 96, 0.05) 100%);
      border-radius: 16px;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .progress-ring-container {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 8;
    }

    .ring-progress {
      fill: none;
      stroke: url(#progressGradient);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.6s ease;
    }

    .ring-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .ring-percent {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #00F260, #00D4FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .ring-label {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0.25rem;
    }

    .workflow-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;

      &.completed {
        background: linear-gradient(135deg, #00F260, #0575E6);
        box-shadow: 0 0 8px rgba(0, 242, 96, 0.4);
      }

      &.pending {
        background: linear-gradient(135deg, #f5a623, #f7b955);
        box-shadow: 0 0 8px rgba(245, 166, 35, 0.4);
      }

      &.billed {
        background: linear-gradient(135deg, #00D4FF, #0575E6);
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
      }
    }

    .legend-text {
      flex: 1;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .legend-value {
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      min-width: 30px;
      text-align: right;
    }

    /* Utility Progress Section */
    .utility-progress-section {
      margin-bottom: 1.5rem;
    }

    .section-heading {
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }

    .utility-progress-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .utility-progress-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    .utility-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
    }

    .utility-emoji {
      font-size: 1.25rem;
    }

    .utility-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    .progress-bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .progress-bar-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;

      &.progress-electricity {
        background: linear-gradient(90deg, #f5a623, #ffd93d);
      }

      &.progress-water {
        background: linear-gradient(90deg, #00D4FF, #0575E6);
      }

      &.progress-gas {
        background: linear-gradient(90deg, #ff6b6b, #ff8e53);
      }

      &.progress-internet {
        background: linear-gradient(90deg, #a855f7, #6366f1);
      }

      &.progress-default {
        background: linear-gradient(90deg, #00F260, #0575E6);
      }
    }

    .progress-text {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      text-align: right;
    }

    .empty-utility-state {
      padding: 1rem;
    }

    .shimmer-bar {
      height: 8px;
      background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      margin-bottom: 0.75rem;
      animation: shimmer 1.5s infinite;

      &.short {
        width: 60%;
      }
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Quick Action Cards */
    .quick-action-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &.enter-reading {
        background: linear-gradient(135deg, rgba(245, 166, 35, 0.15) 0%, rgba(245, 166, 35, 0.05) 100%);
        border: 1px solid rgba(245, 166, 35, 0.25);

        &:hover {
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.25) 0%, rgba(245, 166, 35, 0.1) 100%);
          border-color: rgba(245, 166, 35, 0.4);
          transform: translateY(-2px);
        }

        .action-glow {
          background: radial-gradient(circle, rgba(245, 166, 35, 0.3) 0%, transparent 70%);
        }
      }

      &.generate-bill {
        background: linear-gradient(135deg, rgba(0, 242, 96, 0.15) 0%, rgba(0, 242, 96, 0.05) 100%);
        border: 1px solid rgba(0, 242, 96, 0.25);

        &:hover {
          background: linear-gradient(135deg, rgba(0, 242, 96, 0.25) 0%, rgba(0, 242, 96, 0.1) 100%);
          border-color: rgba(0, 242, 96, 0.4);
          transform: translateY(-2px);
        }

        .action-glow {
          background: radial-gradient(circle, rgba(0, 242, 96, 0.3) 0%, transparent 70%);
        }
      }
    }

    .action-icon-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-glow {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      opacity: 0.5;
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .action-icon {
      font-size: 1.5rem;
      position: relative;
      z-index: 1;
    }

    .action-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .action-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
    }

    .action-count {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);

      &.all-done {
        color: #00F260;
      }
    }

    /* Revenue Panel Styles */
    .revenue-panel {
      .panel-content {
        padding: 1rem;
      }
    }

    .revenue-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .revenue-summary-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);

      .summary-icon {
        font-size: 1.5rem;
      }

      .summary-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .summary-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
        }
      }

      &.total-billed {
        border-left: 3px solid #f5a623;
        .summary-value { color: #f5a623; }
      }

      &.total-collected {
        border-left: 3px solid #00F260;
        .summary-value { color: #00F260; }
      }

      &.collection-rate {
        border-left: 3px solid #00D4FF;
        .summary-value { color: #00D4FF; }
      }
    }

    .revenue-by-utility {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .revenue-item {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .revenue-item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;

        .utility-icon {
          font-size: 1.25rem;
        }

        .utility-name {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
        }

        .bill-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.08);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
      }

      .revenue-bars {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .revenue-bar-container {
        height: 24px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        overflow: hidden;
      }

      .revenue-bar {
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 0.5rem;
        min-width: 2px;
        transition: width 0.4s ease;

        .bar-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.8);
          white-space: nowrap;
        }

        &.billed-bar {
          background: linear-gradient(90deg, #f5a623, #f7b955);
        }

        &.collected-bar {
          background: linear-gradient(90deg, #00F260, #0575E6);
        }
      }

      .revenue-item-footer {
        margin-top: 0.5rem;
        text-align: right;

        .collection-percent {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;

          &.good {
            color: #00F260;
            background: rgba(0, 242, 96, 0.1);
          }

          &.warning {
            color: #f5a623;
            background: rgba(245, 166, 35, 0.1);
          }

          &.poor {
            color: #ff4757;
            background: rgba(255, 71, 87, 0.1);
          }
        }
      }
    }

    .revenue-legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;

        &.billed {
          background: linear-gradient(90deg, #f5a623, #f7b955);
        }

        &.collected {
          background: linear-gradient(90deg, #00F260, #0575E6);
        }
      }
    }

    @media (max-width: 768px) {
      .revenue-summary {
        grid-template-columns: 1fr;
      }

      .workflow-visual {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .progress-ring-container {
        width: 100px;
        height: 100px;
      }

      .workflow-legend {
        width: 100%;
      }

      .quick-action-cards {
        grid-template-columns: 1fr;
      }

      .utility-progress-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .progress-bar-wrapper {
        width: 100%;
      }
    }

    /* Consumer Consumption Panel Styles */
    .consumption-panel .panel-content {
      padding: 1rem;
    }

    .consumption-summary {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 0.75rem !important;
      margin-bottom: 1.5rem !important;
    }

    .consumption-summary-card {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 0.75rem !important;
      padding: 1rem !important;
      background: rgba(255, 255, 255, 0.03) !important;
      border-radius: 12px !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
    }

    .consumption-summary-card .summary-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .consumption-summary-card .summary-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .consumption-summary-card .summary-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .consumption-summary-card .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
    }

    .consumption-summary-card.total-usage {
      border-left: 3px solid #00D4FF;
    }
    .consumption-summary-card.total-usage .summary-value {
      color: #00D4FF;
    }

    .consumption-summary-card.active-services {
      border-left: 3px solid #00F260;
    }
    .consumption-summary-card.active-services .summary-value {
      color: #00F260;
    }

    .consumption-summary-card.utility-types {
      border-left: 3px solid #f5a623;
    }
    .consumption-summary-card.utility-types .summary-value {
      color: #f5a623;
    }

    .consumption-by-utility {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    .consumption-item {
      background: rgba(255, 255, 255, 0.02) !important;
      border-radius: 10px !important;
      padding: 1rem !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: all 0.2s ease !important;
    }

    .consumption-item:hover {
      background: rgba(255, 255, 255, 0.04) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .consumption-item-header {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 0.5rem !important;
      margin-bottom: 0.75rem !important;
    }

    .consumption-item-header .utility-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .consumption-item-header .utility-name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      flex: 1;
    }

    .consumption-item-header .connection-count {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .consumption-bar-wrapper {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 1rem !important;
    }

    .consumption-bar-container {
      flex: 1 !important;
      height: 28px !important;
      background: rgba(255, 255, 255, 0.05) !important;
      border-radius: 6px !important;
      overflow: hidden !important;
    }

    .consumption-bar {
      height: 100% !important;
      border-radius: 6px !important;
      transition: width 0.4s ease !important;
      min-width: 10px !important;
    }

    .consumption-bar.bar-electricity {
      background: linear-gradient(90deg, #f5a623, #f7b955) !important;
    }

    .consumption-bar.bar-water {
      background: linear-gradient(90deg, #00D4FF, #0099cc) !important;
    }

    .consumption-bar.bar-gas {
      background: linear-gradient(90deg, #ff6b6b, #ff8e8e) !important;
    }

    .consumption-bar.bar-internet {
      background: linear-gradient(90deg, #a855f7, #c084fc) !important;
    }

    .consumption-bar.bar-default {
      background: linear-gradient(90deg, #00F260, #0575E6) !important;
    }

    .consumption-value {
      display: flex !important;
      flex-direction: row !important;
      align-items: baseline !important;
      gap: 0.25rem !important;
      min-width: 100px !important;
      justify-content: flex-end !important;
      flex-shrink: 0 !important;
    }

    .consumption-value .consumption-amount {
      font-size: 1.1rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
    }

    .consumption-value .consumption-unit {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 768px) {
      .consumption-summary {
        grid-template-columns: 1fr !important;
      }

      .consumption-bar-wrapper {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 0.5rem !important;
      }

      .consumption-value {
        justify-content: flex-start !important;
      }
    }

    /* Activity List */
    .activity-list {
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 1.5rem;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .activity-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 0.375rem;
          flex-shrink: 0;

          &[data-type="bill"] {
            background: #f5a623;
            box-shadow: 0 0 12px rgba(245, 166, 35, 0.5);
          }

          &[data-type="payment"] {
            background: #38ef7d;
            box-shadow: 0 0 12px rgba(56, 239, 125, 0.5);
          }

          &[data-type="reading"] {
            background: #00d4ff;
            box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
          }
        }

        .activity-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .activity-text {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.4;
          }

          .activity-time {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
          }
        }
      }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2.5rem 1.5rem;
      color: rgba(255, 255, 255, 0.4);

      .empty-icon {
        font-size: 2rem;
        opacity: 0.5;
      }
    }

    /* ========== Charts Section ========== */
    .charts-section {
      margin-bottom: 2rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .chart-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      .chart-subtitle {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .chart-content {
      padding: 1.5rem;
    }

    /* Pie Chart Styles */
    .pie-chart-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .pie-chart {
      width: 240px;
      height: 240px;
    }

    .pie-slices {
      transition: opacity 0.3s ease;
    }

    .pie-slice {
      transition: transform 0.2s ease, filter 0.2s ease;
      transform-origin: 120px 120px;
      cursor: pointer;

      &:hover {
        transform: scale(1.02);
        filter: brightness(1.1);
      }
    }

    .slice-label {
      fill: #0a0e17;
      font-size: 11px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: middle;
      pointer-events: none;
    }

    .pie-center {
      fill: rgba(10, 14, 23, 0.92);
      stroke: rgba(255, 255, 255, 0.08);
      stroke-width: 1;
    }

    .pie-center-value {
      fill: #fff;
      font-size: 28px;
      font-weight: 800;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .pie-center-label {
      fill: rgba(255, 255, 255, 0.6);
      font-size: 11px;
      text-anchor: middle;
      dominant-baseline: middle;
      letter-spacing: 0.4px;
    }

    .pie-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .pie-stat {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 0.75rem 0.9rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .stat-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: rgba(255, 255, 255, 0.78);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .stat-values {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }

    .stat-count {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
    }

    .stat-percent {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.55);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      display: inline-block;

      &.paid {
        background: linear-gradient(135deg, #00f5a0, #00d4ff);
        box-shadow: 0 0 10px rgba(0, 245, 160, 0.5);
      }

      &.due {
        background: linear-gradient(135deg, #ffd93d, #ffb347);
        box-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
      }

      &.overdue {
        background: linear-gradient(135deg, #ff6b6b, #ff3b3b);
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
      }
    }

    .legend-color-custom {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      display: inline-block;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    }

    /* Admin System Overview Styles */
    .admin-system-content {
      padding: 1.25rem;
    }

    .admin-quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .admin-stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(0, 212, 255, 0.2);
      }
    }

    .admin-stat-icon {
      font-size: 1.5rem;
    }

    .admin-stat-info {
      display: flex;
      flex-direction: column;
    }

    .admin-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }

    .admin-stat-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .admin-utility-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .admin-utility-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(0, 212, 255, 0.15);
      }
    }

    .utility-info-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .utility-emoji-large {
      font-size: 1.5rem;
    }

    .utility-name-large {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .utility-metrics {
      display: flex;
      gap: 1.5rem;
    }

    .utility-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .utility-metric .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #00d4ff;
    }

    .utility-metric .metric-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Bar Chart Styles */
    .bar-chart-content {
      padding: 1rem 1.5rem;
    }

    .bar-chart-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-item {
      display: grid;
      grid-template-columns: 120px 1fr 80px;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .bar-icon {
        font-size: 1.25rem;
      }

      .bar-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .bar-track {
      height: 24px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
    }

    .bar-value {
      height: 100%;
      border-radius: 12px;
      transition: width 1s ease-out;
      min-width: 20px;

      &.bar-electricity {
        background: linear-gradient(90deg, #FFD93D, #FFA726);
        box-shadow: 0 0 15px rgba(255, 217, 61, 0.4);
      }

      &.bar-water {
        background: linear-gradient(90deg, #00D9F5, #00B4D8);
        box-shadow: 0 0 15px rgba(0, 217, 245, 0.4);
      }

      &.bar-gas {
        background: linear-gradient(90deg, #FF6B00, #FF8A50);
        box-shadow: 0 0 15px rgba(255, 107, 0, 0.4);
      }

      &.bar-internet {
        background: linear-gradient(90deg, #667eea, #764ba2);
        box-shadow: 0 0 15px rgba(102, 126, 234, 0.4);
      }

      &.bar-default {
        background: linear-gradient(90deg, #00F5A0, #00D9F5);
        box-shadow: 0 0 15px rgba(0, 245, 160, 0.4);
      }
    }

    .bar-amount {
      text-align: right;

      .bar-number {
        font-size: 1rem;
        font-weight: 700;
        color: #fff;
      }

      .bar-unit {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-left: 0.25rem;
      }
    }

    /* ========== Responsive ========== */
    @media (max-width: 768px) {
      .dashboard-hero {
        padding: 1.5rem;
      }

      .hero-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .greeting-section .user-name {
        font-size: 2rem;
      }

      .date-section {
        align-items: flex-start;
        text-align: left;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .bar-item {
        grid-template-columns: 100px 1fr 60px;
      }
    }

    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .financial-grid {
        grid-template-columns: 1fr;
      }

      .metric-card {
        padding: 1.25rem;
      }

      .metric-visual {
        width: 56px;
        height: 56px;
      }

      .metric-data .metric-number {
        font-size: 1.875rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  summary: DashboardSummary | null = null;
  currentUser: User | null = null;
  lastUpdated: Date | null = null;
  recentActivities: RecentActivity[] = [];
  utilityTypes: UtilityType[] = [];
  today = new Date();
  
  // Billing Officer specific data
  pendingReadingsConnections: ConnectionListItem[] = [];
  unbilledReadings: MeterReadingListItem[] = [];
  todaysBillsGenerated = 0;
  readingsEnteredToday = 0;
  
  // Role flags
  isAdmin = false;
  isBillingOfficer = false;
  isAccountOfficer = false;
  isConsumer = false;
  
  // Admin-specific data
  allUsers: User[] = [];
  usersByRole: { role: string; count: number; color: string }[] = [];
  tariffPlans: TariffPlan[] = [];
  billingCycles: BillingCycle[] = [];
  adminSystemStats: { 
    utilityType: string; 
    connections: number; 
    tariffs: number;
    icon: string;
  }[] = [];
  
  private refreshSubscription: Subscription | null = null;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private billsService: BillsService,
    private paymentsService: PaymentsService,
    private meterReadingsService: MeterReadingsService,
    private connectionsService: ConnectionsService,
    private utilityTypesService: UtilityTypesService,
    private tariffPlansService: TariffPlansService,
    private billingCyclesService: BillingCyclesService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
    // Set role flags
    if (this.currentUser) {
      this.isAdmin = this.currentUser.role === 'Admin';
      this.isBillingOfficer = this.currentUser.role === 'BillingOfficer';
      this.isAccountOfficer = this.currentUser.role === 'AccountOfficer';
      this.isConsumer = this.currentUser.role === 'Consumer';
    }
  }

  getRoleSubtitle(): string {
    if (this.isAdmin) return 'System overview and administration';
    if (this.isBillingOfficer) return 'Meter readings and bill generation';
    if (this.isAccountOfficer) return 'Payments and revenue management';
    if (this.isConsumer) return 'Your account overview';
    return 'Here\'s your overview for today';
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.startAutoRefresh();
    
    // Load utility types for BillingOfficer
    if (this.isBillingOfficer) {
      this.loadUtilityTypes();
      this.loadBillingOfficerData();
    }
    
    // Load admin-specific data (also load users for AccountOfficer)
    if (this.isAdmin) {
      this.loadAdminData();
    } else if (this.isAccountOfficer) {
      this.loadUsersData();
    }
  }

  private loadUsersData(): void {
    // Load users for total users count (for AccountOfficer)
    this.authService.getUsers({ pageNumber: 1, pageSize: 1000 }).pipe(
      catchError(() => of({ success: false, data: [], totalCount: 0 }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allUsers = response.data;
        }
        this.cdr.detectChanges();
      }
    });
  }

  private loadAdminData(): void {
    // Load users for role distribution
    this.authService.getUsers({ pageNumber: 1, pageSize: 1000 }).pipe(
      catchError(() => of({ success: false, data: [], totalCount: 0 }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allUsers = response.data;
          this.calculateUsersByRole();
        }
        this.cdr.detectChanges();
      }
    });

    // Load utility types for system overview
    this.utilityTypesService.getAll().pipe(
      catchError(() => of({ success: false, data: [] }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilityTypes = response.data.filter(u => u.isActive);
          this.loadTariffsForSystemStats();
        }
        this.cdr.detectChanges();
      }
    });

    // Load billing cycles (without year filter to get all cycle types)
    this.billingCyclesService.getAll({ pageNumber: 1, pageSize: 100 }).pipe(
      catchError(() => of({ success: false, data: [], totalCount: 0 }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.billingCycles = response.data;
        }
        this.cdr.detectChanges();
      }
    });
  }

  private calculateUsersByRole(): void {
    const roleMap = new Map<string, number>();
    const roleColors: { [key: string]: string } = {
      'Admin': '#ff6b6b',
      'BillingOfficer': '#4ecdc4',
      'AccountOfficer': '#45b7d1',
      'Consumer': '#ffd93d'
    };

    this.allUsers.forEach(user => {
      const role = user.role || 'Unknown';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });

    this.usersByRole = Array.from(roleMap.entries()).map(([role, count]) => ({
      role,
      count,
      color: roleColors[role] || '#888888'
    }));
  }

  private loadTariffsForSystemStats(): void {
    this.tariffPlansService.getAll().pipe(
      catchError(() => of({ success: false, data: [] }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tariffPlans = response.data;
          this.buildAdminSystemStats();
        }
        this.cdr.detectChanges();
      }
    });
  }

  private buildAdminSystemStats(): void {
    this.adminSystemStats = this.utilityTypes.map(utility => {
      const tariffCount = this.tariffPlans.filter(t => t.utilityTypeId === utility.id && t.isActive).length;
      return {
        utilityType: utility.name,
        connections: utility.connectionCount || 0,
        tariffs: tariffCount,
        icon: this.getUtilityEmoji(utility.name)
      };
    });
  }

  // Admin chart helper methods
  getTotalUsers(): number {
    return this.allUsers.length;
  }

  getUserRoleSlices(): { role: string; count: number; percent: number; color: string; startAngle: number; endAngle: number }[] {
    const total = this.getTotalUsers();
    if (total === 0) return [];

    let currentAngle = -90; // Start from top
    return this.usersByRole.map(item => {
      const percent = Math.round((item.count / total) * 100);
      const angle = (item.count / total) * 360;
      const slice = {
        role: item.role,
        count: item.count,
        percent,
        color: item.color,
        startAngle: currentAngle,
        endAngle: currentAngle + angle
      };
      currentAngle += angle;
      return slice;
    });
  }

  getUserSlicePath(slice: { startAngle: number; endAngle: number }): string {
    const cx = 120, cy = 120, r = 90;
    const startRad = (slice.startAngle * Math.PI) / 180;
    const endRad = (slice.endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  getUserSliceLabelPosition(slice: { startAngle: number; endAngle: number }): { x: number; y: number } {
    const cx = 120, cy = 120, r = 65;
    const midAngle = ((slice.startAngle + slice.endAngle) / 2 * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(midAngle),
      y: cy + r * Math.sin(midAngle)
    };
  }

  getRoleDisplayName(role: string): string {
    const names: { [key: string]: string } = {
      'Admin': 'Admins',
      'BillingOfficer': 'Billing Officers',
      'AccountOfficer': 'Account Officers',
      'Consumer': 'Consumers'
    };
    return names[role] || role;
  }

  getBillingCyclesCount(): number {
    return 3;
  }

  getActiveTariffPlansCount(): number {
    return this.tariffPlans.filter(t => t.isActive).length;
  }

  private loadBillingOfficerData(): void {
    // Note: getPendingReadings endpoint does not exist in backend
    // Initialize with empty array - this feature needs backend support
    this.pendingReadingsConnections = [];

    // Load unbilled readings
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    this.meterReadingsService.getUnbilled(currentMonth, currentYear).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unbilledReadings = response.data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.unbilledReadings = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.loadDashboard(true); // silent refresh
    });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }

  refresh(): void {
    this.loadDashboard();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = null;
      this.cdr.detectChanges();
    }

    // Consumer has different API endpoints
    if (this.isConsumer) {
      this.loadConsumerDashboard(silent);
      return;
    }

    // Fetch dashboard summary and recent activities in parallel
    // Use catchError on each to prevent one failed call from breaking the dashboard
    forkJoin({
      dashboard: this.reportsService.getDashboard().pipe(
        catchError(() => of({ success: false, data: null, message: '' }))
      ),
      bills: this.billsService.getAll({ pageNumber: 1, pageSize: 100, sortBy: 'CreatedAt', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      payments: this.paymentsService.getAll({ pageNumber: 1, pageSize: 5, sortBy: 'PaymentDate', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      readings: this.meterReadingsService.getAll({ pageNumber: 1, pageSize: 100, sortBy: 'ReadingDate', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      connections: this.connectionsService.getAll({ pageNumber: 1, pageSize: 100 }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      )
    }).subscribe({
      next: (results) => {
        this.loading = false;
        this.lastUpdated = new Date();
        
        // Process dashboard summary
        if (results.dashboard.success && results.dashboard.data) {
          this.summary = results.dashboard.data;
        } else {
          this.summary = {
            totalConsumers: 0,
            activeConnections: 0,
            totalBills: 0,
            pendingBills: 0,
            overdueBills: 0,
            totalRevenueThisMonth: 0,
            totalOutstanding: 0,
            totalCollected: 0,
            totalBilled: 0,
            recentActivities: [],
            consumptionByUtilityType: [],
            revenueByUtilityType: []
          };
        }

        // Build recent activities from bills, payments, and readings
        const activities: RecentActivity[] = [];

        // Add recent bills
        if (results.bills.success && results.bills.data) {
          results.bills.data.forEach(bill => {
            activities.push({
              type: 'bill',
              description: `Bill #${bill.billNumber} - ₹${bill.totalAmount?.toFixed(2) || '0.00'} (${bill.status})`,
              timestamp: bill.dueDate || new Date().toISOString()
            });
          });
        }

        // Add recent payments
        if (results.payments.success && results.payments.data) {
          results.payments.data.forEach(payment => {
            activities.push({
              type: 'payment',
              description: `Payment of ₹${payment.amount?.toFixed(2) || '0.00'} received via ${payment.paymentMethod || 'N/A'}`,
              timestamp: payment.paymentDate || new Date().toISOString()
            });
          });
        }

        // Add recent meter readings
        if (results.readings.success && results.readings.data) {
          results.readings.data.forEach(reading => {
            activities.push({
              type: 'reading',
              description: `Meter reading: ${reading.currentReading} units for ${reading.connectionNumber || 'Connection'}`,
              timestamp: reading.readingDate || new Date().toISOString()
            });
          });
        }

        // Sort by timestamp (most recent first) and take top 10
        const sortedActivities = [...activities].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.recentActivities = sortedActivities.slice(0, 10);

        // Update summary with our computed activities if backend returned empty
        if (this.summary?.recentActivities.length === 0) {
          this.summary.recentActivities = this.recentActivities;
        }

        // Use consumption data from backend (already provided in dashboard.consumptionByUtilityType)
        // Only calculate from bills if backend didn't provide any consumption data
        if (this.summary && (!this.summary.consumptionByUtilityType || this.summary.consumptionByUtilityType.length === 0)) {
          const consumptionMap = new Map<string, { total: number; count: number; unit: string }>();
          
          // First, populate from connections to get all utility types
          if (results.connections.success && results.connections.data) {
            results.connections.data.forEach((connection: any) => {
              const utilityType = connection.utilityType || connection.UtilityType || 'Unknown';
              const unit = this.getUnitForUtility(utilityType);
              
              if (!consumptionMap.has(utilityType)) {
                consumptionMap.set(utilityType, { total: 0, count: 0, unit });
              }
              consumptionMap.get(utilityType)!.count += 1;
            });
          }
          
          // Then add consumption data from bills
          if (results.bills.success && results.bills.data) {
            results.bills.data.forEach((bill: any) => {
              const utilityType = bill.utilityType || bill.UtilityType || 'Unknown';
              const unitsConsumed = bill.unitsConsumed || bill.UnitsConsumed || 0;
              const unit = this.getUnitForUtility(utilityType);
              
              if (consumptionMap.has(utilityType)) {
                consumptionMap.get(utilityType)!.total += unitsConsumed;
              } else {
                consumptionMap.set(utilityType, { total: unitsConsumed, count: 1, unit });
              }
            });
          }

          // Update summary's consumptionByUtilityType
          const consumptionByUtilityType = Array.from(consumptionMap.entries()).map(([utilityType, data]) => ({
            utilityType,
            totalConsumption: data.total,
            connectionCount: data.count,
            unit: data.unit
          }));

          this.summary.consumptionByUtilityType = consumptionByUtilityType;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (!silent) {
          this.error = err?.error?.message || 'Failed to load dashboard data. Is the backend running?';
        }
        this.summary = {
          totalConsumers: 0,
          activeConnections: 0,
          totalBills: 0,
          pendingBills: 0,
          overdueBills: 0,
          totalRevenueThisMonth: 0,
          totalOutstanding: 0,
          totalCollected: 0,
          totalBilled: 0,
          recentActivities: [],
          consumptionByUtilityType: [],
          revenueByUtilityType: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  loadConsumerDashboard(silent = false): void {
    // Consumer-specific dashboard - fetch bills and connections
    forkJoin({
      bills: this.billsService.getMyBills().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      connections: this.connectionsService.getMyConnections().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      payments: this.paymentsService.getMyPayments().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      )
    }).subscribe({
      next: (results) => {
        this.loading = false;
        this.lastUpdated = new Date();

        const bills = results.bills.data || [];
        const connections = results.connections.data || [];
        const payments = results.payments.data || [];
        
        const pendingBills = bills.filter(b => b.status !== 'Paid').length;
        const totalOutstanding = bills.reduce((sum, b) => sum + (b.outstandingBalance || 0), 0);
        // Check for both 'Active' and 'active' status (case-insensitive)
        const activeConnections = connections.filter((c: any) => 
          c.status?.toLowerCase() === 'active'
        ).length;

        // Build consumption by utility type from connections
        const consumptionMap = new Map<string, { total: number; count: number; unit: string }>();
        connections.forEach((conn: any) => {
          const utilityType = conn.utilityType || conn.utilityTypeName || 'Unknown';
          const lastReading = conn.lastReading || 0;
          const unit = this.getUnitForUtility(utilityType);
          
          if (consumptionMap.has(utilityType)) {
            const existing = consumptionMap.get(utilityType)!;
            existing.total += lastReading;
            existing.count += 1;
          } else {
            consumptionMap.set(utilityType, { total: lastReading, count: 1, unit });
          }
        });

        const consumptionByUtilityType = Array.from(consumptionMap.entries()).map(([utilityType, data]) => ({
          utilityType,
          totalConsumption: data.total,
          connectionCount: data.count,
          unit: data.unit
        }));

        // Build recent activities from bills and payments
        const activities: RecentActivity[] = [];

        // Add recent bills
        bills.slice(0, 5).forEach(bill => {
          activities.push({
            type: 'bill',
            description: `Bill #${bill.billNumber} - ₹${bill.totalAmount?.toFixed(2) || '0.00'} (${bill.status})`,
            timestamp: (bill as any).createdAt || bill.dueDate || new Date().toISOString()
          });
        });

        // Add recent payments
        payments.slice(0, 5).forEach((payment: any) => {
          activities.push({
            type: 'payment',
            description: `Payment of ₹${payment.amount?.toFixed(2) || '0.00'} via ${payment.paymentMethod || 'N/A'}`,
            timestamp: payment.createdAt || payment.paymentDate || new Date().toISOString()
          });
        });

        // Sort by timestamp and take top 10
        const sortedActivities = [...activities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        // Build summary from consumer's data
        this.summary = {
          totalConsumers: 0,
          activeConnections: activeConnections,
          totalBills: bills.length,
          pendingBills: pendingBills,
          overdueBills: bills.filter(b => b.status === 'Overdue').length,
          totalRevenueThisMonth: 0,
          totalOutstanding: totalOutstanding,
          totalCollected: 0,
          totalBilled: 0,
          recentActivities: sortedActivities,
          consumptionByUtilityType: consumptionByUtilityType,
          revenueByUtilityType: []
        };

        this.recentActivities = sortedActivities;

        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        if (!silent) {
          this.error = 'Failed to load your dashboard data.';
        }
        this.summary = {
          totalConsumers: 0,
          activeConnections: 0,
          totalBills: 0,
          pendingBills: 0,
          overdueBills: 0,
          totalRevenueThisMonth: 0,
          totalOutstanding: 0,
          totalCollected: 0,
          totalBilled: 0,
          recentActivities: [],
          consumptionByUtilityType: [],
          revenueByUtilityType: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  getUnitForUtility(utilityType: string): string {
    const lower = utilityType.toLowerCase();
    if (lower.includes('electric')) return 'kWh';
    if (lower.includes('water')) return 'KL';
    if (lower.includes('gas')) return 'SCM';
    return 'units';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'bill': 'receipt',
      'payment': 'payment',
      'reading': 'speed',
      'connection': 'electrical_services',
      'consumer': 'person_add'
    };
    return icons[type.toLowerCase()] || 'info';
  }

  // Utility Types for BillingOfficer
  loadUtilityTypes(): void {
    this.utilityTypesService.getAll().pipe(
      catchError(() => of({ success: false, data: [], message: '' }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilityTypes = response.data.filter(u => u.isActive);
        }
        this.cdr.detectChanges();
      }
    });
  }

  getBillingCycleLabel(months: number): string {
    switch (months) {
      case 1: return 'Monthly';
      case 2: return 'Bi-Monthly';
      case 3: return 'Quarterly';
      default: return `${months} Months`;
    }
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getUtilityIconClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'icon-electricity';
    if (lower.includes('water')) return 'icon-water';
    if (lower.includes('gas')) return 'icon-gas';
    if (lower.includes('internet')) return 'icon-internet';
    return 'icon-default';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getDecimals(value: number): string {
    const decimals = (value % 1).toFixed(2).substring(2);
    return decimals;
  }

  getUtilityEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return '⚡';
    if (lower.includes('water')) return '💧';
    if (lower.includes('gas')) return '🔥';
    if (lower.includes('internet')) return '📡';
    return '⚙️';
  }

  // ========== Chart Helper Methods ==========
  
  // Pie Chart - Get total bills count
  getTotalBills(): number {
    if (!this.summary) return 0;
    return this.getPaidBillsCount() + this.summary.pendingBills + this.summary.overdueBills;
  }

  // Calculate paid bills (estimated from total - pending - overdue)
  getPaidBillsCount(): number {
    if (!this.summary) return 0;
    // Assuming total consumers * average bills per consumer, or use a reasonable estimate
    // For now, we estimate paid bills based on active connections
    const estimatedTotalBills = Math.max(
      this.summary.activeConnections,
      this.summary.pendingBills + this.summary.overdueBills + Math.floor(this.summary.activeConnections * 0.7)
    );
    return Math.max(0, estimatedTotalBills - this.summary.pendingBills - this.summary.overdueBills);
  }

  // Pie Chart - Calculate segment arc length
  getPieSegment(type: 'paid' | 'due' | 'overdue'): string {
    const total = this.getTotalBills();
    if (total === 0) return '0 502.65';
    
    const radius = 86;
    const circumference = 2 * Math.PI * radius; // match SVG r=86
    let count = 0;
    
    switch (type) {
      case 'paid': count = this.getPaidBillsCount(); break;
      case 'due': count = this.summary?.pendingBills || 0; break;
      case 'overdue': count = this.summary?.overdueBills || 0; break;
    }
    
    const percentage = count / total;
    const arcLength = percentage * circumference;
    const gapLength = Math.max(circumference - arcLength, 0);
    return `${arcLength} ${gapLength}`;
  }

  // Pie Chart - Calculate offset for stacking segments
  getPieOffset(type: 'paid' | 'due' | 'overdue'): string {
    const total = this.getTotalBills();
    if (total === 0) return '0';
    
    const radius = 86;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    
    const paid = this.getPaidBillsCount();
    const due = this.summary?.pendingBills || 0;
    
    switch (type) {
      case 'paid': 
        offset = 0; 
        break;
      case 'due': 
        offset = -(paid / total) * circumference; 
        break;
      case 'overdue': 
        offset = -((paid + due) / total) * circumference; 
        break;
    }
    
    return offset.toString();
  }

  // Pie Chart - Percentage helper
  getBillPercent(type: 'paid' | 'due' | 'overdue'): number {
    const total = this.getTotalBills();
    if (total === 0) return 0;

    let count = 0;
    switch (type) {
      case 'paid': count = this.getPaidBillsCount(); break;
      case 'due': count = this.summary?.pendingBills || 0; break;
      case 'overdue': count = this.summary?.overdueBills || 0; break;
    }

    return Math.round((count / total) * 100);
  }

  // Pie Chart - Get filled pie slices data
  getBillSlices(): Array<{type: string, className: string, fill: string, count: number, percent: number, startAngle: number, endAngle: number}> {
    const total = this.getTotalBills();
    if (total === 0) return [];

    const paid = this.getPaidBillsCount();
    const due = this.summary?.pendingBills || 0;
    const overdue = this.summary?.overdueBills || 0;

    const slices = [
      { type: 'paid', className: 'paid', fill: 'url(#gradPaid)', count: paid, percent: this.getBillPercent('paid') },
      { type: 'due', className: 'due', fill: 'url(#gradDue)', count: due, percent: this.getBillPercent('due') },
      { type: 'overdue', className: 'overdue', fill: 'url(#gradOverdue)', count: overdue, percent: this.getBillPercent('overdue') }
    ];

    let currentAngle = 0;
    return slices.map(slice => {
      const angle = (slice.count / total) * 360;
      const result = {
        ...slice,
        startAngle: currentAngle,
        endAngle: currentAngle + angle
      };
      currentAngle += angle;
      return result;
    });
  }

  // Pie Chart - Generate SVG path for pie slice
  getSlicePath(slice: any): string {
    const cx = 120;
    const cy = 120;
    const radius = 120;
    const startAngle = (slice.startAngle - 90) * (Math.PI / 180);
    const endAngle = (slice.endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  // Pie Chart - Get label position for slice
  getSliceLabelPosition(slice: any): { x: number, y: number } {
    const cx = 120;
    const cy = 120;
    const radius = 80;
    const midAngle = ((slice.startAngle + slice.endAngle) / 2 - 90) * (Math.PI / 180);

    return {
      x: cx + radius * Math.cos(midAngle),
      y: cy + radius * Math.sin(midAngle)
    };
  }

  // Bar Chart - Get bar width percentage
  getBarWidth(consumption: number): number {
    if (!this.summary || this.summary.consumptionByUtilityType.length === 0) return 0;
    
    const maxConsumption = Math.max(
      ...this.summary.consumptionByUtilityType.map(item => item.totalConsumption)
    );
    
    if (maxConsumption === 0) return 0;
    return Math.max(5, (consumption / maxConsumption) * 100);
  }

  // Bar Chart - Get color class for utility type
  getBarColorClass(utilityType: string): string {
    const lower = utilityType.toLowerCase();
    if (lower.includes('electric')) return 'bar-electricity';
    if (lower.includes('water')) return 'bar-water';
    if (lower.includes('gas')) return 'bar-gas';
    if (lower.includes('internet')) return 'bar-internet';
    return 'bar-default';

  }

  // Bar Chart - Get max consumption for progress bar calculation
  getMaxConsumption(): number {
    if (!this.summary || this.summary.consumptionByUtilityType.length === 0) return 1;
    
    const maxConsumption = Math.max(
      ...this.summary.consumptionByUtilityType.map(item => item.totalConsumption)
    );
    
    return Math.max(1, maxConsumption);
  }

  // Revenue helpers
  getCollectionRate(): number {
    if (!this.summary || this.summary.totalBilled === 0) return 0;
    return (this.summary.totalCollected / this.summary.totalBilled) * 100;
  }

  getRevenueBarWidth(billedAmount: number): number {
    if (!this.summary || !this.summary.revenueByUtilityType) return 0;
    const maxBilled = Math.max(...this.summary.revenueByUtilityType.map(r => r.billedAmount));
    if (maxBilled === 0) return 0;
    return (billedAmount / maxBilled) * 100;
  }

  getCollectedBarWidth(billedAmount: number, collected: number): number {
    if (billedAmount === 0) return 0;
    return (collected / billedAmount) * 100;
  }

  getItemCollectionRate(item: { billedAmount: number; collected: number }): number {
    if (item.billedAmount === 0) return 0;
    return (item.collected / item.billedAmount) * 100;
  }

  // Consumer Consumption helpers
  getTotalConsumption(): number {
    if (!this.summary || !this.summary.consumptionByUtilityType) return 0;
    return this.summary.consumptionByUtilityType.reduce((sum, item) => sum + item.totalConsumption, 0);
  }

  getConsumptionBarWidth(consumption: number): number {
    if (!this.summary || !this.summary.consumptionByUtilityType || this.summary.consumptionByUtilityType.length === 0) return 0;
    const maxConsumption = Math.max(...this.summary.consumptionByUtilityType.map(item => item.totalConsumption));
    if (maxConsumption === 0) return 0;
    return Math.max(10, (consumption / maxConsumption) * 100);
  }

  // Billing Workflow helpers
  getWorkflowCircumference(): string {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  getWorkflowOffset(): string {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const percent = this.getWorkflowCompletionPercent();
    const offset = circumference - (percent / 100) * circumference;
    return offset.toString();
  }

  getWorkflowCompletionPercent(): number {
    const total = this.summary?.activeConnections || 0;
    if (total === 0) return 100;
    const completed = total - this.pendingReadingsConnections.length;
    return Math.round((completed / total) * 100);
  }

  getUtilityProgressClass(utilityType: string): string {
    const lower = utilityType.toLowerCase();
    if (lower.includes('electric')) return 'progress-electricity';
    if (lower.includes('water')) return 'progress-water';
    if (lower.includes('gas')) return 'progress-gas';
    if (lower.includes('internet')) return 'progress-internet';
    return 'progress-default';
  }

  getUtilityReadingProgress(utility: UtilityType): number {
    // Calculate based on connections that have readings vs pending
    const totalConnections = utility.connectionCount || 0;
    if (totalConnections === 0) return 100;
    
    // Count pending readings for this utility type
    const pendingForUtility = this.pendingReadingsConnections.filter(
      conn => conn.utilityType?.toLowerCase() === utility.name?.toLowerCase()
    ).length;
    
    const completed = totalConnections - pendingForUtility;
    return Math.round((completed / totalConnections) * 100);
  }
}
