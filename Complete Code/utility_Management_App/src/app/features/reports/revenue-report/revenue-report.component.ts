import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-revenue-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="report-page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/reports" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Revenue Report</h1>
            <p>Monthly and yearly revenue analysis</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Report Type</mat-label>
              <mat-select [(ngModel)]="mode">
                <mat-option value="monthly">Monthly</mat-option>
                <mat-option value="yearly">Yearly</mat-option>
              </mat-select>
            </mat-form-field>

            <ng-container [ngSwitch]="mode">
              <ng-container *ngSwitchCase="'monthly'">
                <mat-form-field appearance="outline">
                  <mat-label>Month</mat-label>
                  <mat-select [(ngModel)]="month">
                    <mat-option *ngFor="let m of months" [value]="m.value">{{ m.label }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Year</mat-label>
                  <input matInput type="number" [(ngModel)]="year" min="2000" max="2100">
                </mat-form-field>
              </ng-container>

              <ng-container *ngSwitchCase="'yearly'">
                <mat-form-field appearance="outline">
                  <mat-label>Year</mat-label>
                  <input matInput type="number" [(ngModel)]="year" min="2000" max="2100">
                </mat-form-field>
              </ng-container>
            </ng-container>

            <button mat-raised-button color="primary" (click)="load()" [disabled]="loading">
              <mat-icon>search</mat-icon>
              Generate Report
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Error -->
      <mat-card *ngIf="!loading && error" class="no-data-card">
        <mat-card-content>
          <mat-icon>error_outline</mat-icon>
          <h3>Error Loading Report</h3>
          <p>{{ error }}</p>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div *ngIf="!loading && !error && data" class="report-content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon total">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">₹{{ data.totalBilledAmount || data.totalRevenue || 0 | number:'1.2-2' }}</span>
                <span class="label">Total Revenue</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon billed">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">₹{{ data.totalBilledAmount || data.totalBilled || 0 | number:'1.2-2' }}</span>
                <span class="label">Total Billed</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon collected">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">₹{{ data.totalCollected || 0 | number:'1.2-2' }}</span>
                <span class="label">Total Collected</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon rate">
                <mat-icon>percent</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ data.collectionRate || 0 | number:'1.1-1' }}%</span>
                <span class="label">Collection Rate</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Revenue by Utility Type -->
        <mat-card class="data-card" *ngIf="data.byUtilityType?.length">
          <mat-card-header>
            <mat-card-title>Revenue by Utility Type</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.byUtilityType" class="full-width">
              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="billedAmount">
                <th mat-header-cell *matHeaderCellDef>Billed</th>
                <td mat-cell *matCellDef="let row">₹{{ row.billedAmount | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="collected">
                <th mat-header-cell *matHeaderCellDef>Collected</th>
                <td mat-cell *matCellDef="let row">₹{{ row.collected | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="billCount">
                <th mat-header-cell *matHeaderCellDef>Bills</th>
                <td mat-cell *matCellDef="let row">{{ row.billCount }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['utilityType', 'billedAmount', 'collected', 'billCount']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['utilityType', 'billedAmount', 'collected', 'billCount'];"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Monthly/Yearly Breakdown -->
        <mat-card class="data-card" *ngIf="data.monthlyBreakdown?.length">
          <mat-card-header>
            <mat-card-title>Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.monthlyBreakdown || []" class="full-width">
              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let row">{{ row.month }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row">₹{{ row.amount || row.collected | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="bills">
                <th mat-header-cell *matHeaderCellDef>Bills</th>
                <td mat-cell *matCellDef="let row">{{ row.billCount || row.transactionCount || '-' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['period', 'amount', 'bills']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['period', 'amount', 'bills'];"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .report-page {
      padding: 1.5rem;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .back-btn {
        color: rgba(255,255,255,0.7);
        &:hover { color: #00D2FF; }
      }

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
        background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.5); }
    }

    .filter-card {
      margin-bottom: 1.5rem;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);

      .filter-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      mat-form-field { min-width: 150px; }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
      --mdc-circular-progress-active-indicator-color: #00D2FF;
    }

    .no-data-card {
      text-align: center;
      padding: 3rem;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: rgba(255,255,255,0.3);
      }

      h3 { margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.95); }
      p { color: rgba(255,255,255,0.5); }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem !important;
      }

      .summary-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon { color: white; }

        &.total { background: linear-gradient(135deg, #00D2FF, #00A5CC); box-shadow: 0 4px 15px rgba(0,210,255,0.3); }
        &.billed { background: linear-gradient(135deg, #a855f7, #7c3aed); box-shadow: 0 4px 15px rgba(168,85,247,0.3); }
        &.collected { background: linear-gradient(135deg, #00F260, #00C050); box-shadow: 0 4px 15px rgba(0,242,96,0.3); }
        &.rate { background: linear-gradient(135deg, #FFD93D, #F5C400); box-shadow: 0 4px 15px rgba(255,217,61,0.3); }
      }

      .summary-info {
        display: flex;
        flex-direction: column;

        .value { font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.95); }
        .label { font-size: 0.875rem; color: rgba(255,255,255,0.5); }
      }
    }

    .data-card {
      margin-bottom: 1.5rem;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);

      ::ng-deep mat-card-title { font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.95); }
    }

    .full-width { width: 100%; }

    .outstanding { color: #FF6B6B; font-weight: 500; }

    ::ng-deep .mat-mdc-header-cell {
      color: rgba(255,255,255,0.6) !important;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-cell {
      color: rgba(255,255,255,0.8);
    }
  `]
})
export class RevenueReportComponent implements OnInit {
  mode: 'monthly' | 'yearly' = 'monthly';
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  data: any = null;
  loading = false;
  error: string | null = null;

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.data = null;

    if (this.mode === 'monthly') {
      this.reportService.getMonthlyRevenue(String(this.month), String(this.year)).subscribe({
        next: (res) => {
          console.log('Monthly Revenue API response:', res);
          console.log('Monthly Revenue data:', res.data);
          this.loading = false;
          this.data = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load report';
          this.cdr.detectChanges();
        }
      });
    } else if (this.mode === 'yearly') {
      this.reportService.getYearlyRevenue(String(this.year)).subscribe({
        next: (res) => {
          this.loading = false;
          this.data = this.buildYearlyReportView(res.data);
          if (!this.data) {
            this.error = 'No yearly revenue data available';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load report';
          this.cdr.detectChanges();
        }
      });
    }
  }

  getCollectionRate(): number {
    if (!this.data) return 0;
    const billed = this.data.totalBilledAmount || this.data.totalBilled || 0;
    const collected = this.data.totalCollected || 0;
    if (billed === 0) return 0;
    return (collected / billed) * 100;
  }

  private buildYearlyReportView(reports: any[] | null | undefined) {
    if (!reports || reports.length === 0) {
      return null;
    }

    const sortedReports = [...reports].sort((a, b) => (a?.month || 0) - (b?.month || 0));

    const totals = sortedReports.reduce(
      (acc, report) => {
        const billed = Number(report?.totalBilledAmount ?? report?.totalRevenue ?? 0);
        const collected = Number(report?.totalCollected ?? 0);
        const outstanding = Number(report?.totalOutstanding ?? 0);
        const bills = Number(report?.totalBills ?? 0);
        const paidBills = Number(report?.paidBills ?? 0);

        return {
          billed: acc.billed + billed,
          collected: acc.collected + collected,
          outstanding: acc.outstanding + outstanding,
          bills: acc.bills + bills,
          paidBills: acc.paidBills + paidBills
        };
      },
      { billed: 0, collected: 0, outstanding: 0, bills: 0, paidBills: 0 }
    );

    const byUtilityTypeMap = new Map<string, { billedAmount: number; collected: number; billCount: number }>();

    sortedReports.forEach((report) => {
      (report?.byUtilityType || []).forEach((item: any) => {
        const current = byUtilityTypeMap.get(item.utilityType) || { billedAmount: 0, collected: 0, billCount: 0 };
        byUtilityTypeMap.set(item.utilityType, {
          billedAmount: current.billedAmount + Number(item.billedAmount ?? 0),
          collected: current.collected + Number(item.collected ?? 0),
          billCount: current.billCount + Number(item.billCount ?? 0)
        });
      });
    });

    const byUtilityType = Array.from(byUtilityTypeMap.entries()).map(([utilityType, values]) => ({
      utilityType,
      billedAmount: values.billedAmount,
      collected: values.collected,
      billCount: values.billCount
    }));

    const monthlyBreakdown = sortedReports.map((report) => ({
      month: report?.monthName || this.getMonthLabel(report?.month),
      amount: Number(report?.totalCollected ?? report?.totalBilledAmount ?? 0),
      collected: Number(report?.totalCollected ?? 0),
      billCount: Number(report?.totalBills ?? report?.billCount ?? 0)
    }));

    return {
      totalRevenue: totals.billed,
      totalBilledAmount: totals.billed,
      totalBilled: totals.billed,
      totalCollected: totals.collected,
      totalOutstanding: totals.outstanding,
      totalBills: totals.bills,
      paidBills: totals.paidBills,
      collectionRate: totals.billed > 0 ? (totals.collected / totals.billed) * 100 : 0,
      byUtilityType,
      monthlyBreakdown
    };
  }

  private getMonthLabel(month: number | undefined): string {
    if (!month) return '';
    const match = this.months.find((m) => m.value === month);
    return match?.label || `Month ${month}`;
  }
}
