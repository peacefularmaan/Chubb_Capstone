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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { UtilityType, CreateUtilityTypeRequest, UpdateUtilityTypeRequest } from '../../../core/models';
import { BehaviorSubject } from 'rxjs';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-utility-types',
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
    <div class="utility-types-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>category</mat-icon>
          </div>
          <div class="header-text">
            <h1>Utility Types</h1>
            <p>Manage utility types (Electricity, Water, Gas, etc.)</p>
          </div>
        </div>
        <button class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          <span>Add Utility Type</span>
        </button>
      </div>

      <!-- Stats Overview -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>widgets</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ dataSource.data.length }}</span>
            <span class="stat-label">Total Types</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getActiveCount() }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon inactive">
            <mat-icon>pause_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getInactiveCount() }}</span>
            <span class="stat-label">Inactive</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading$ | async" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading utility types...</p>
      </div>

      <!-- Utility Types Table Card -->
      <div class="table-container" *ngIf="!(loading$ | async)">
        <div class="table-header">
          <h3>All Utility Types</h3>
          <span class="table-count">{{ dataSource.data.length }} items</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>NAME</th>
              <td mat-cell *matCellDef="let row">
                <div class="name-cell">
                  <div class="utility-icon" [ngClass]="getIconClass(row.name)">
                    <mat-icon>{{ getIcon(row.name) }}</mat-icon>
                  </div>
                  <span class="utility-name">{{ row.name }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>DESCRIPTION</th>
              <td mat-cell *matCellDef="let row">
                <span class="description-text">{{ row.description || '—' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="unitOfMeasurement">
              <th mat-header-cell *matHeaderCellDef>UNIT</th>
              <td mat-cell *matCellDef="let row">
                <span class="unit-badge">{{ row.unitOfMeasurement }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>STATUS</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="row.isActive ? 'active' : 'inactive'">
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
                    [matTooltip]="row.connectionCount > 0 ? 'Cannot delete: ' + row.connectionCount + ' connection(s) using this utility' : 'Delete'"
                    [disabled]="row.connectionCount > 0"
                    (click)="confirmDelete(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>inbox</mat-icon>
                <h4>No utility types found</h4>
                <p>Click "Add Utility Type" to create one.</p>
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

    .utility-types-page {
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
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.15);
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

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      &.active {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        box-shadow: 0 4px 15px rgba(0, 245, 160, 0.3);
      }

      &.inactive {
        background: linear-gradient(135deg, #FF6B6B 0%, #C44536 100%);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
      }

      .stat-label {
        font-size: 0.75rem;
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

    /* Table Styling */
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
        padding: 1rem 1rem;
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
        padding: 1rem 1rem;
      }
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .utility-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      &.electric {
        background: linear-gradient(135deg, #FFD93D 0%, #FF6B00 100%);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.25);
      }

      &.water {
        background: linear-gradient(135deg, #00D9F5 0%, #0083B0 100%);
        box-shadow: 0 4px 12px rgba(0, 217, 245, 0.25);
      }

      &.gas {
        background: linear-gradient(135deg, #FF6B6B 0%, #C44536 100%);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.25);
      }

      &.internet {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
      }

      &.default {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        box-shadow: 0 4px 12px rgba(0, 245, 160, 0.25);
      }
    }

    .utility-name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    .description-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }

    .unit-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Monaco', 'Consolas', monospace;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.active {
        background: rgba(0, 245, 160, 0.12);
        color: #00F5A0;
        border: 1px solid rgba(0, 245, 160, 0.3);

        .status-dot {
          background: #00F5A0;
          box-shadow: 0 0 8px rgba(0, 245, 160, 0.6);
        }
      }

      &.inactive {
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
      width: 38px;
      height: 38px;
      border-radius: 10px;
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
        background: rgba(0, 217, 245, 0.15);
        border-color: rgba(0, 217, 245, 0.4);
        color: #00D9F5;
      }

      &.delete:hover:not(:disabled) {
        background: rgba(255, 107, 107, 0.15);
        border-color: rgba(255, 107, 107, 0.4);
        color: #FF6B6B;
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
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

      .stats-row {
        grid-template-columns: 1fr;
      }

      .add-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class UtilityTypesComponent implements OnInit {
  dataSource = new MatTableDataSource<UtilityType>([]);
  displayedColumns = ['name', 'description', 'unitOfMeasurement', 'isActive', 'actions'];
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private utilityTypesService: UtilityTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading$.next(true);
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.loading$.next(false);
      },
      error: () => { this.loading$.next(false); }
    });
  }

  getIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getIconClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'electric';
    if (lower.includes('water')) return 'water';
    if (lower.includes('gas')) return 'gas';
    if (lower.includes('internet')) return 'internet';
    return 'default';
  }

  getActiveCount(): number {
    return this.dataSource.data.filter(item => item.isActive).length;
  }

  getInactiveCount(): number {
    return this.dataSource.data.filter(item => !item.isActive).length;
  }

  openDialog(item?: UtilityType): void {
    const dialogRef = this.dialog.open(UtilityTypeDialogComponent, {
      width: '450px',
      data: item || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  confirmDelete(item: UtilityType): void {
    if (item.connectionCount > 0) {
      this.snackBar.open(
        `Cannot delete "${item.name}": ${item.connectionCount} connection(s) are using this utility type`,
        'Close',
        { duration: 5000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { name: item.name }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.utilityTypesService.delete(item.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Utility type deleted successfully', 'Close', { duration: 3000 });
              this.load();
            } else {
              this.snackBar.open(response.message || 'Error deleting utility type', 'Close', { duration: 5000 });
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error deleting utility type', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
}

// Delete Confirmation Dialog Component
@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="delete-dialog-container">
      <div class="delete-dialog-header">
        <div class="delete-icon">
          <mat-icon>warning</mat-icon>
        </div>
        <h2>Delete Utility Type</h2>
      </div>
      
      <mat-dialog-content>
        <p>Are you sure you want to permanently delete <strong>"{{ data.name }}"</strong>?</p>
        <p class="warning-text">This action cannot be undone.</p>
      </mat-dialog-content>
      
      <mat-dialog-actions>
        <button class="btn-cancel" mat-dialog-close>Cancel</button>
        <button class="btn-delete" [mat-dialog-close]="true">Delete</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-dialog-container {
      min-width: 350px;
    }

    .delete-dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.5rem 0.5rem;

      .delete-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #FF6B6B 0%, #C44536 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: white;
        }
      }

      h2 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
    }

    ::ng-deep .mat-mdc-dialog-content {
      padding: 1rem 1.5rem !important;
      
      p {
        margin: 0 0 0.5rem;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .warning-text {
        color: #FF6B6B;
        font-size: 0.85rem;
      }
    }

    ::ng-deep .mat-mdc-dialog-actions {
      padding: 1rem 1.5rem 1.5rem !important;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.25);
      }
    }

    .btn-delete {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #FF6B6B 0%, #C44536 100%);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      }
    }
  `]
})
export class DeleteConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { name: string }) {}
}

// Dialog Component
@Component({
  selector: 'app-utility-type-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="dialog-icon">
          <mat-icon>{{ data ? 'edit' : 'add_circle' }}</mat-icon>
        </div>
        <h2>{{ data ? 'Edit' : 'Add' }} Utility Type</h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="dialog-form">
          <div class="form-group">
            <label>Name</label>
            <mat-form-field appearance="outline" class="full-width">
              <input matInput formControlName="name" placeholder="e.g., Electricity, Water">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
            </mat-form-field>
          </div>

          <div class="form-group">
            <label>Description</label>
            <mat-form-field appearance="outline" class="full-width">
              <textarea matInput formControlName="description" rows="2" placeholder="Brief description"></textarea>
            </mat-form-field>
          </div>

          <div class="form-group">
            <label>Unit of Measurement</label>
            <mat-form-field appearance="outline" class="full-width">
              <input matInput formControlName="unitOfMeasurement" placeholder="e.g., kWh, Liters, m³">
              <mat-error *ngIf="form.get('unitOfMeasurement')?.hasError('required')">Unit is required</mat-error>
            </mat-form-field>
          </div>

          <div class="status-toggle">
            <mat-checkbox formControlName="isActive" color="primary">
              <span class="checkbox-label">Active Status</span>
              <span class="checkbox-hint">Enable to make this utility type available</span>
            </mat-checkbox>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button class="btn-cancel" mat-dialog-close>Cancel</button>
        <button class="btn-save" (click)="save()" [disabled]="form.invalid || (saving$ | async)">
          <mat-spinner *ngIf="saving$ | async" diameter="18"></mat-spinner>
          <span *ngIf="!(saving$ | async)">{{ data ? 'Update' : 'Create' }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 420px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.5rem 1rem;

      .dialog-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0, 245, 160, 0.3);

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: #0a0e17;
        }
      }

      h2 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
    }

    ::ng-deep .mat-mdc-dialog-content {
      padding: 0.5rem 1.5rem !important;
    }

    .dialog-form {
      .form-group {
        margin-bottom: 0.5rem;

        label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
      }
    }

    .full-width {
      width: 100%;

      ::ng-deep {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-outline-color: rgba(255, 255, 255, 0.15);
          --mdc-outlined-text-field-hover-outline-color: rgba(0, 245, 160, 0.4);
          --mdc-outlined-text-field-focus-outline-color: #00F5A0;
        }

        .mat-mdc-form-field-subscript-wrapper {
          height: 18px;
        }

        input, textarea {
          color: rgba(255, 255, 255, 0.95) !important;
        }

        .mdc-floating-label {
          display: none;
        }
      }
    }

    .status-toggle {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 0.5rem;

      ::ng-deep .mdc-checkbox__background {
        border-color: rgba(255, 255, 255, 0.3);
      }

      .checkbox-label {
        display: block;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
      }

      .checkbox-hint {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 0.15rem;
      }
    }

    ::ng-deep .mat-mdc-dialog-actions {
      padding: 1rem 1.5rem 1.5rem !important;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.25);
      }
    }

    .btn-save {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-width: 100px;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      border: none;
      border-radius: 10px;
      color: #0a0e17;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(0, 245, 160, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      ::ng-deep .mat-mdc-progress-spinner {
        --mdc-circular-progress-active-indicator-color: #0a0e17;
      }
    }
  `]
})
export class UtilityTypeDialogComponent {
  form: FormGroup;
  saving$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private utilityTypesService: UtilityTypesService,
    private dialogRef: MatDialogRef<UtilityTypeDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: UtilityType | null
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || ''],
      unitOfMeasurement: [data?.unitOfMeasurement || '', Validators.required],
      isActive: [data?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving$.next(true);
    const formValue = this.form.value;

    const operation = this.data
      ? this.utilityTypesService.update(this.data.id, { ...formValue, id: this.data.id } as UpdateUtilityTypeRequest)
      : this.utilityTypesService.create(formValue as CreateUtilityTypeRequest);

    operation.subscribe({
      next: (response) => {
        this.saving$.next(false);
        if (response.success) {
          this.snackBar.open(`Utility type ${this.data ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
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
