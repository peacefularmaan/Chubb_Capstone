import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-report',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports</h1>
        <p>View and generate various reports</p>
      </div>

      <div class="reports-grid">
        <!-- My Consumption - Consumer only -->
        <mat-card class="report-card" *ngIf="isConsumer" routerLink="/reports/my-consumption">
          <mat-card-content>
            <div class="report-icon my-consumption">
              <mat-icon>bolt</mat-icon>
            </div>
            <div class="report-info">
              <h3>My Consumption</h3>
              <p>View your utility consumption history</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Revenue Report - Admin, AccountOfficer -->
        <mat-card class="report-card" *ngIf="canAccessRevenue" routerLink="/reports/revenue-report">
          <mat-card-content>
            <div class="report-icon revenue">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="report-info">
              <h3>Revenue Report</h3>
              <p>Monthly and yearly revenue analysis</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Outstanding Balance Report - Admin, AccountOfficer -->
        <mat-card class="report-card" *ngIf="canAccessOutstanding" routerLink="/reports/outstanding-report">
          <mat-card-content>
            <div class="report-icon outstanding">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="report-info">
              <h3>Outstanding Balance</h3>
              <p>View consumers with pending dues</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Consumption Report - Admin, BillingOfficer -->
        <mat-card class="report-card" *ngIf="canAccessConsumption" routerLink="/reports/consumption-report">
          <mat-card-content>
            <div class="report-icon consumption">
              <mat-icon>speed</mat-icon>
            </div>
            <div class="report-info">
              <h3>Consumption Report</h3>
              <p>Utility consumption analysis</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      padding: 0;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      p {
        margin: 0.375rem 0 0;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.75rem;
    }

    .report-card {
      cursor: pointer;
      background: rgba(255, 255, 255, 0.03) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 20px !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4) !important;
        border-color: rgba(255, 255, 255, 0.15) !important;
        background: rgba(255, 255, 255, 0.05) !important;
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.75rem !important;
      }
    }

    .report-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      &.revenue {
        background: linear-gradient(135deg, #00F260, #00c853);
        box-shadow: 0 4px 20px rgba(0, 242, 96, 0.4);
      }

      &.outstanding {
        background: linear-gradient(135deg, #FFD93D, #f5a623);
        box-shadow: 0 4px 20px rgba(255, 217, 61, 0.4);
      }

      &.consumption {
        background: linear-gradient(135deg, #00D2FF, #0096c7);
        box-shadow: 0 4px 20px rgba(0, 210, 255, 0.4);
      }

      &.my-consumption {
        background: linear-gradient(135deg, #a855f7, #7c3aed);
        box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
      }
    }

    .report-info {
      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }

      p {
        margin: 0.375rem 0 0;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  `]
})
export class DashboardReportComponent implements OnInit {
  canAccessRevenue = false;
  canAccessOutstanding = false;
  canAccessConsumption = false;
  isConsumer = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Consumer sees My Consumption
      this.isConsumer = user.role === 'Consumer';
      // Revenue Report - Admin, AccountOfficer
      this.canAccessRevenue = ['Admin', 'AccountOfficer'].includes(user.role);
      // Outstanding Dues - Admin, AccountOfficer
      this.canAccessOutstanding = ['Admin', 'AccountOfficer'].includes(user.role);
      // Consumption Report - Admin, BillingOfficer
      this.canAccessConsumption = ['Admin', 'BillingOfficer'].includes(user.role);
    }
  }
}
