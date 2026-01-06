import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TariffPlansService } from '../../../core/services/tariff-plans.service';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { TariffPlan, UtilityType, CreateTariffPlanRequest, UpdateTariffPlanRequest } from '../../../core/models';
import { BehaviorSubject } from 'rxjs';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-tariff-plans',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tariff-plans-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>request_quote</mat-icon>
          </div>
          <div class="header-text">
            <h1>Tariff Plans</h1>
            <p>Manage pricing plans for utility types</p>
          </div>
        </div>
        <button class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          <span>Add Tariff Plan</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon plans">
            <mat-icon>request_quote</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ dataSource.data.length }}</span>
            <span class="stat-label">Total Plans</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getActivePlansCount() }}</span>
            <span class="stat-label">Active Plans</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading tariff plans...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!(loading$ | async)">
        <div class="table-header">
          <h3>Tariff Plans List</h3>
          <span class="table-count">{{ dataSource.data.length }} plans</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>PLAN NAME</th>
              <td mat-cell *matCellDef="let row">
                <div class="plan-cell">
                  <div class="plan-icon">
                    <mat-icon>receipt</mat-icon>
                  </div>
                  <span class="plan-name">{{ row.name }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="utilityType">
              <th mat-header-cell *matHeaderCellDef>UTILITY TYPE</th>
              <td mat-cell *matCellDef="let row">
                <span class="utility-badge" [ngClass]="getUtilityClass(row.utilityTypeName)">
                  <mat-icon>{{ getUtilityIcon(row.utilityTypeName) }}</mat-icon>
                  {{ row.utilityTypeName }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="ratePerUnit">
              <th mat-header-cell *matHeaderCellDef>RATE/UNIT</th>
              <td mat-cell *matCellDef="let row">
                <span class="rate-badge">₹{{ row.ratePerUnit | number:'1.2-4' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="fixedCharges">
              <th mat-header-cell *matHeaderCellDef>FIXED CHARGE</th>
              <td mat-cell *matCellDef="let row">
                <span class="amount-value">₹{{ row.fixedCharges || 0 | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="taxPercentage">
              <th mat-header-cell *matHeaderCellDef>TAX %</th>
              <td mat-cell *matCellDef="let row">
                <span class="tax-badge">{{ row.taxPercentage || 0 }}%</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="latePaymentPenalty">
              <th mat-header-cell *matHeaderCellDef>PENALTY</th>
              <td mat-cell *matCellDef="let row">
                <span class="penalty-badge" *ngIf="row.latePaymentPenalty > 0">₹{{ row.latePaymentPenalty | number:'1.2-2' }}</span>
                <span class="no-penalty" *ngIf="!row.latePaymentPenalty || row.latePaymentPenalty === 0">—</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>STATUS</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="row.isActive ? 'status-active' : 'status-inactive'">
                  <span class="status-dot"></span>
                  {{ row.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>ACTIONS</th>
              <td mat-cell *matCellDef="let row">
                <div class="action-buttons">
                  <button class="action-btn edit" matTooltip="Edit" (click)="openDialog(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button 
                    class="action-btn delete" 
                    [class.disabled]="row.connectionCount > 0"
                    [matTooltip]="row.connectionCount > 0 ? 'Cannot delete: ' + row.connectionCount + ' active connection(s)' : 'Delete'"
                    (click)="row.connectionCount === 0 && delete(row)"
                    [disabled]="row.connectionCount > 0">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>request_quote</mat-icon>
                <h4>No tariff plans found</h4>
                <p>Click "Add Tariff Plan" to create one</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .tariff-plans-page {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, rgba(0, 245, 160, 0.08) 0%, rgba(0, 217, 245, 0.05) 100%);
      border: 1px solid rgba(0, 245, 160, 0.15);
      border-radius: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .header-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(0, 245, 160, 0.3);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #0a0e17;
      }
    }

    .header-text {
      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      border: none;
      border-radius: 12px;
      color: #0a0e17;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 245, 160, 0.3);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0, 245, 160, 0.4);
      }
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      &.plans {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      &.active {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        box-shadow: 0 4px 15px rgba(0, 245, 160, 0.3);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 1.35rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
      }

      .stat-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;

      p {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
      }

      ::ng-deep .mat-mdc-progress-spinner {
        --mdc-circular-progress-active-indicator-color: #00F5A0;
      }
    }

    /* Table Container */
    .table-container {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      .table-count {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
        padding: 0.35rem 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    ::ng-deep {
      .mat-mdc-header-row {
        background: rgba(0, 245, 160, 0.06);
      }

      .mat-mdc-header-cell {
        color: rgba(0, 245, 160, 0.8) !important;
        font-weight: 600;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 1rem 0.75rem;
      }

      .mat-mdc-row {
        background: transparent;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      }

      .mat-mdc-cell {
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        padding: 0.75rem;
      }
    }

    .plan-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .plan-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: white;
      }
    }

    .plan-name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.9rem;
    }

    .utility-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.55rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.electricity {
        background: rgba(255, 217, 61, 0.12);
        border: 1px solid rgba(255, 217, 61, 0.3);
        color: #FFD93D;
      }

      &.water {
        background: rgba(0, 217, 245, 0.12);
        border: 1px solid rgba(0, 217, 245, 0.3);
        color: #00D9F5;
      }

      &.gas {
        background: rgba(255, 107, 0, 0.12);
        border: 1px solid rgba(255, 107, 0, 0.3);
        color: #FF6B00;
      }

      &.internet {
        background: rgba(102, 126, 234, 0.12);
        border: 1px solid rgba(102, 126, 234, 0.3);
        color: #667eea;
      }
    }

    .rate-badge {
      display: inline-block;
      padding: 0.3rem 0.6rem;
      background: rgba(0, 217, 245, 0.12);
      border: 1px solid rgba(0, 217, 245, 0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #00D9F5;
    }

    .amount-value {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .tax-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .penalty-badge {
      font-weight: 600;
      color: #FFD93D;
      font-size: 0.85rem;
    }

    .no-penalty {
      color: rgba(255, 255, 255, 0.3);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }

      &.status-active {
        background: rgba(0, 245, 160, 0.12);
        color: #00F5A0;
        border: 1px solid rgba(0, 245, 160, 0.3);

        .status-dot {
          background: #00F5A0;
          box-shadow: 0 0 8px rgba(0, 245, 160, 0.6);
        }
      }

      &.status-inactive {
        background: rgba(255, 107, 107, 0.12);
        color: #FF6B6B;
        border: 1px solid rgba(255, 107, 107, 0.3);

        .status-dot {
          background: #FF6B6B;
          box-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.03);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.edit:hover {
        background: rgba(102, 126, 234, 0.15);
        border-color: rgba(102, 126, 234, 0.4);
        color: #667eea;
      }

      &.delete {
        &:hover:not(.disabled) {
          background: rgba(255, 107, 107, 0.15);
          border-color: rgba(255, 107, 107, 0.4);
          color: #FF6B6B;
        }

        &.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem !important;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(255, 255, 255, 0.15);
        margin-bottom: 1rem;
      }

      h4 {
        margin: 0;
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
      }

      p {
        margin: 0.5rem 0 0;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9rem;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1.25rem;
        align-items: flex-start;
      }

      .add-btn {
        width: 100%;
        justify-content: center;
      }

      .stats-row {
        flex-direction: column;
      }
    }
  `]
})
export class TariffPlansComponent implements OnInit {
  dataSource = new MatTableDataSource<TariffPlan>([]);
  displayedColumns = ['name', 'utilityType', 'ratePerUnit', 'fixedCharges', 'taxPercentage', 'latePaymentPenalty', 'isActive', 'actions'];
  loading$ = new BehaviorSubject<boolean>(false);
  utilityTypes: UtilityType[] = [];

  constructor(
    private tariffPlansService: TariffPlansService,
    private utilityTypesService: UtilityTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.loadUtilityTypes();
    this.load();
  }

  loadUtilityTypes(): void {
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.utilityTypes = (response.data || []).filter((u: UtilityType) => u.isActive);
      }
    });
  }

  load(): void {
    this.loading$.next(true);
    this.tariffPlansService.getAll().subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.loading$.next(false);
      },
      error: () => { this.loading$.next(false); }
    });
  }

  openDialog(item?: TariffPlan): void {
    const dialogRef = this.dialog.open(TariffPlanDialogComponent, {
      width: '500px',
      data: { plan: item || null, utilityTypes: this.utilityTypes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  delete(item: TariffPlan): void {
    if (confirm(`Delete tariff plan "${item.name}"? This action cannot be undone.`)) {
      this.tariffPlansService.delete(item.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Tariff plan deleted successfully', 'Close', { duration: 3000 });
            this.load();
          } else {
            this.snackBar.open(response.message || 'Error deleting tariff plan', 'Close', { duration: 5000 });
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error deleting tariff plan', 'Close', { duration: 5000 });
        }
      });
    }
  }

  getActivePlansCount(): number {
    return this.dataSource.data.filter(p => p.isActive).length;
  }

  getUtilityIcon(utilityType: string): string {
    const type = utilityType?.toLowerCase() || '';
    if (type.includes('electric')) return 'bolt';
    if (type.includes('water')) return 'water_drop';
    if (type.includes('gas')) return 'local_fire_department';
    if (type.includes('internet') || type.includes('wifi')) return 'wifi';
    return 'settings';
  }

  getUtilityClass(utilityType: string): string {
    const type = utilityType?.toLowerCase() || '';
    if (type.includes('electric')) return 'electricity';
    if (type.includes('water')) return 'water';
    if (type.includes('gas')) return 'gas';
    if (type.includes('internet') || type.includes('wifi')) return 'internet';
    return '';
  }
}

// Dialog Component
@Component({
  selector: 'app-tariff-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.plan ? 'Edit' : 'Add' }} Tariff Plan</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Utility Type</mat-label>
          <mat-select formControlName="utilityTypeId">
            <mat-option *ngFor="let ut of data.utilityTypes" [value]="ut.id">{{ ut.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('utilityTypeId')?.hasError('required')">Utility type is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Plan Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Residential, Commercial">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Rate per Unit (₹)</mat-label>
            <input matInput type="number" formControlName="ratePerUnit" step="0.01">
            <mat-error *ngIf="form.get('ratePerUnit')?.hasError('required')">Required</mat-error>
            <mat-error *ngIf="form.get('ratePerUnit')?.hasError('min')">Must be >= 0</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fixed Charge (₹)</mat-label>
            <input matInput type="number" formControlName="fixedCharges" step="0.01">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tax Percentage (%)</mat-label>
          <input matInput type="number" formControlName="taxPercentage" step="0.1">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Late Payment Penalty (₹)</mat-label>
          <input matInput type="number" formControlName="latePaymentPenalty" step="0.01">
          <mat-hint>Penalty amount added when bill becomes overdue</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="isActive" color="primary">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || (saving$ | async)">
        <mat-spinner *ngIf="saving$ | async" diameter="20"></mat-spinner>
        <span *ngIf="!(saving$ | async)">{{ data.plan ? 'Update' : 'Create' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class TariffPlanDialogComponent {
  form: FormGroup;
  saving$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private tariffPlansService: TariffPlansService,
    private dialogRef: MatDialogRef<TariffPlanDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { plan: TariffPlan | null; utilityTypes: UtilityType[] }
  ) {
    const plan = data.plan;
    this.form = this.fb.group({
      utilityTypeId: [plan?.utilityTypeId || null, Validators.required],
      name: [plan?.name || '', Validators.required],
      description: [plan?.description || ''],
      ratePerUnit: [plan?.ratePerUnit || 0, [Validators.required, Validators.min(0)]],
      fixedCharges: [plan?.fixedCharges || 0],
      taxPercentage: [plan?.taxPercentage || 0],
      latePaymentPenalty: [plan?.latePaymentPenalty || 0, [Validators.min(0)]],
      isActive: [plan?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving$.next(true);
    const formValue = this.form.value;

    const operation = this.data.plan
      ? this.tariffPlansService.update(this.data.plan.id, { ...formValue, id: this.data.plan.id } as UpdateTariffPlanRequest)
      : this.tariffPlansService.create(formValue as CreateTariffPlanRequest);

    operation.subscribe({
      next: (response) => {
        this.saving$.next(false);
        if (response.success) {
          this.snackBar.open(`Tariff plan ${this.data.plan ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message || 'Error saving', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving$.next(false);
        this.snackBar.open(err.error?.message || 'Error saving', 'Close', { duration: 3000 });
      }
    });
  }
}
