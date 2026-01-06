import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-outstanding-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
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
            <h1>Outstanding Dues Report</h1>
            <p>View unpaid bills and defaulters</p>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="load()" [disabled]="loading">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <mat-card *ngIf="!loading && error" class="no-data-card">
        <mat-card-content>
          <mat-icon>error_outline</mat-icon>
          <h3>Error Loading Report</h3>
          <p>{{ error }}</p>
        </mat-card-content>
      </mat-card>

      <div *ngIf="!loading && !error && data" class="report-content">
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon total">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">₹{{ data.totalOutstanding || 0 | number:'1.2-2' }}</span>
                <span class="label">Total Outstanding</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon overdue">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ data.totalOverdueAccounts || 0 }}</span>
                <span class="label">Overdue Accounts</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon defaulters">
                <mat-icon>person_off</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ data.topDefaulters?.length || 0 }}</span>
                <span class="label">Top Defaulters</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="data-card" *ngIf="data.byAgeBucket?.length">
          <mat-card-header>
            <mat-card-title>Outstanding by Age</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.byAgeBucket" class="full-width">
              <ng-container matColumnDef="ageBucket">
                <th mat-header-cell *matHeaderCellDef>Age Bucket</th>
                <td mat-cell *matCellDef="let row">{{ row.ageBucket }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row" class="outstanding">₹{{ row.amount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="count">
                <th mat-header-cell *matHeaderCellDef>Count</th>
                <td mat-cell *matCellDef="let row">{{ row.count }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['ageBucket', 'amount', 'count']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['ageBucket', 'amount', 'count'];"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="data-card" *ngIf="data.topDefaulters?.length">
          <mat-card-header>
            <mat-card-title>Top Defaulters</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.topDefaulters" class="full-width">
              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef>Consumer</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>
              <ng-container matColumnDef="consumerNumber">
                <th mat-header-cell *matHeaderCellDef>Consumer #</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="dueAmount">
                <th mat-header-cell *matHeaderCellDef>Due</th>
                <td mat-cell *matCellDef="let row" class="due-amount">₹{{ row.dueAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="penaltyAmount">
                <th mat-header-cell *matHeaderCellDef>Penalty</th>
                <td mat-cell *matCellDef="let row" class="penalty-amount">₹{{ row.penaltyAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="outstandingAmount">
                <th mat-header-cell *matHeaderCellDef>Outstanding</th>
                <td mat-cell *matCellDef="let row" class="outstanding">₹{{ row.outstandingAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="overdueBills">
                <th mat-header-cell *matHeaderCellDef>Overdue Bills</th>
                <td mat-cell *matCellDef="let row">{{ row.overdueBills }}</td>
              </ng-container>
              <ng-container matColumnDef="oldestDueDate">
                <th mat-header-cell *matHeaderCellDef>Oldest Due Date</th>
                <td mat-cell *matCellDef="let row">{{ row.oldestDueDate | date:'mediumDate' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="defaulterColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: defaulterColumns;"></tr>
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
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .back-btn {
      color: rgba(255,255,255,0.7);
      &:hover { color: #00D2FF; }
    }
    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .page-header p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.5); }
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
    }
    .no-data-card mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: rgba(255,255,255,0.3); }
    .no-data-card h3 { margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.95); }
    .no-data-card p { color: rgba(255,255,255,0.5); }
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
    }
    .summary-card mat-card-content {
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
    }
    .summary-icon mat-icon { color: white; }
    .summary-icon.total { background: linear-gradient(135deg, #FF6B6B, #dc2626); box-shadow: 0 4px 15px rgba(255,107,107,0.3); }
    .summary-icon.overdue { background: linear-gradient(135deg, #FFD93D, #F5C400); box-shadow: 0 4px 15px rgba(255,217,61,0.3); }
    .summary-icon.defaulters { background: linear-gradient(135deg, #a855f7, #7c3aed); box-shadow: 0 4px 15px rgba(168,85,247,0.3); }
    .summary-info { display: flex; flex-direction: column; }
    .summary-info .value { font-size: 1.5rem; font-weight: 700; color: rgba(255,255,255,0.95); }
    .summary-info .label { font-size: 0.875rem; color: rgba(255,255,255,0.5); }
    .data-card {
      margin-bottom: 1.5rem;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .full-width { width: 100%; }
    .due-amount { color: #00D2FF; font-weight: 600; }
    .penalty-amount { color: #FF6B6B; font-weight: 600; }
    .outstanding { color: #a855f7; font-weight: 600; }

    ::ng-deep .mat-mdc-header-cell {
      color: rgba(255,255,255,0.6) !important;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-cell {
      color: rgba(255,255,255,0.8);
    }

    ::ng-deep mat-card-title {
      color: rgba(255,255,255,0.95) !important;
    }
  `]
})
export class OutstandingReportComponent implements OnInit {
  data: any = null;
  loading = false;
  error: string | null = null;
  defaulterColumns = ['consumerName', 'consumerNumber', 'dueAmount', 'penaltyAmount', 'outstandingAmount', 'overdueBills', 'oldestDueDate'];

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.reportService.getOutstandingDues().subscribe({
      next: (res) => {
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
  }
}
