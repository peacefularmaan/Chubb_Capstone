import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { UtilityType } from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-billing-cycles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="billing-cycles-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>event_repeat</mat-icon>
          </div>
          <div class="header-text">
            <h1>Billing Cycles</h1>
            <p>Configure billing frequency for each utility service</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ dataSource.data.length }}</span>
            <span class="stat-label">Utility Types</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading utility types...</p>
      </div>

      <!-- Utility Cards Grid -->
      <div class="utility-grid" *ngIf="!loading">
        <div class="utility-card" *ngFor="let utility of dataSource.data">
          <!-- Card Header with Icon -->
          <div class="card-header">
            <div class="utility-icon" [ngClass]="getIconClass(utility.name)">
              <mat-icon>{{ getIcon(utility.name) }}</mat-icon>
            </div>
            <div class="utility-info">
              <h3>{{ utility.name }}</h3>
              <span class="utility-unit">{{ utility.unitOfMeasurement }}</span>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="card-stats">
            <div class="stat">
              <mat-icon>cable</mat-icon>
              <div class="stat-content">
                <span class="stat-number">{{ utility.connectionCount || 0 }}</span>
                <span class="stat-text">Active Connections</span>
              </div>
            </div>
          </div>

          <!-- Billing Cycle Selector -->
          <div class="card-footer">
            <label class="cycle-label">Billing Cycle</label>
            <div class="cycle-selector">
              <button 
                *ngFor="let option of cycleOptions" 
                class="cycle-option"
                [class.active]="utility.billingCycleMonths === option.value"
                (click)="selectCycle(utility, option.value)">
                <span class="option-duration">{{ option.months }}</span>
                <span class="option-label">{{ option.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>inbox</mat-icon>
          <h3>No Utility Types Found</h3>
          <p>Add utility types to configure their billing cycles</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .billing-cycles-page {
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
      margin-bottom: 2rem;
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

    .header-stats {
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #00F5A0;
      }

      .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    /* Loading State */
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

    /* Utility Grid */
    .utility-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    /* Utility Card */
    .utility-card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.5rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(0, 245, 160, 0.3);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 245, 160, 0.1);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .utility-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.electric {
        background: linear-gradient(135deg, #FFD93D 0%, #FF6B00 100%);
        box-shadow: 0 6px 20px rgba(255, 107, 0, 0.3);
      }

      &.water {
        background: linear-gradient(135deg, #00D9F5 0%, #0083B0 100%);
        box-shadow: 0 6px 20px rgba(0, 217, 245, 0.3);
      }

      &.gas {
        background: linear-gradient(135deg, #FF6B6B 0%, #C44536 100%);
        box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
      }

      &.internet {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
      }

      &.default {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        box-shadow: 0 6px 20px rgba(0, 245, 160, 0.3);
      }
    }

    .utility-info {
      h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }

      .utility-unit {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.06);
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        display: inline-block;
        margin-top: 0.25rem;
      }
    }

    .card-stats {
      padding: 1rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 1.25rem;

      .stat {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.4);
        }

        .stat-content {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
        }

        .stat-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .card-footer {
      .cycle-label {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
      }
    }

    .cycle-selector {
      display: flex;
      gap: 0.5rem;
    }

    .cycle-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      padding: 0.75rem 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s ease;

      .option-duration {
        font-size: 1rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.8);
      }

      .option-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.active {
        background: linear-gradient(135deg, rgba(0, 245, 160, 0.15) 0%, rgba(0, 217, 245, 0.1) 100%);
        border-color: rgba(0, 245, 160, 0.5);

        .option-duration {
          color: #00F5A0;
        }

        .option-label {
          color: rgba(0, 245, 160, 0.7);
        }
      }
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(255, 255, 255, 0.2);
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: rgba(255, 255, 255, 0.7);
      }

      p {
        margin: 0.5rem 0 0;
        color: rgba(255, 255, 255, 0.4);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1.25rem;
        align-items: flex-start;
      }

      .utility-grid {
        grid-template-columns: 1fr;
      }

      .cycle-selector {
        flex-direction: column;
      }

      .cycle-option {
        flex-direction: row;
        justify-content: center;
        gap: 0.5rem;
      }
    }
  `]
})
export class BillingCyclesComponent implements OnInit {
  dataSource = new MatTableDataSource<UtilityType>([]);
  displayedColumns = ['name', 'unit', 'connections', 'billingCycle'];
  loading = false;

  cycleOptions = [
    { value: 1, months: '1', label: 'Monthly' },
    { value: 2, months: '2', label: 'Bi-Monthly' },
    { value: 3, months: '3', label: 'Quarterly' }
  ];

  constructor(
    private utilityTypesService: UtilityTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.loading = false;
        this.dataSource.data = response.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
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

  selectCycle(utility: UtilityType, cycleValue: number): void {
    if (utility.billingCycleMonths === cycleValue) return;
    utility.billingCycleMonths = cycleValue;
    this.updateBillingCycle(utility);
  }

  updateBillingCycle(utility: UtilityType): void {
    this.utilityTypesService.update(utility.id, { billingCycleMonths: utility.billingCycleMonths }).subscribe({
      next: (response) => {
        if (response.success) {
          const cycleText = utility.billingCycleMonths === 1 ? 'Monthly' : 
                           utility.billingCycleMonths === 2 ? 'Bi-Monthly' : 'Quarterly';
          this.snackBar.open(`${utility.name} billing cycle set to ${cycleText}`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(response.message || 'Error updating', 'Close', { duration: 3000 });
          this.load();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error updating', 'Close', { duration: 3000 });
        this.load();
      }
    });
  }
}
