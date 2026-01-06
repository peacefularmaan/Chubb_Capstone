import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BillsService } from '../../../core/services/bills.service';
import { AuthService } from '../../../core/services/auth.service';
import { BillListItem, PaginationParams } from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="bills-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ isConsumer ? 'My Bills' : 'Bills' }}</h1>
            <p>{{ isConsumer ? 'View your utility bills' : 'Manage utility bills' }}</p>
          </div>
        </div>
        <button class="add-btn" routerLink="/billing/generate" *ngIf="canGenerateBill">
          <mat-icon>receipt_long</mat-icon>
          <span>Generate Bill</span>
        </button>
      </div>

      <!-- Search & Filter Section -->
      <div class="filter-section" *ngIf="!isConsumer">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (keyup.enter)="search()" 
            placeholder="Search by bill # or consumer...">
          <button class="clear-btn" *ngIf="searchTerm" (click)="searchTerm = ''; search()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="filter-group">
          <div class="filter-item">
            <label>Status</label>
            <select [(ngModel)]="selectedStatus" (change)="search()">
              <option [ngValue]="null">All Status</option>
              <option value="Due">Due</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <mat-icon>filter_alt_off</mat-icon>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon bills">
            <mat-icon>receipt</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRecords }}</span>
            <span class="stat-label">Total Bills</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading bills...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading">
        <div class="table-header">
          <h3>Bill History</h3>
          <span class="table-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="billNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>BILL #</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/billing', row.id]" class="bill-link">{{ row.billNumber }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="consumerName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>CONSUMER</th>
              <td mat-cell *matCellDef="let row">
                <div class="consumer-cell">
                  <div class="avatar">{{ getInitials(row.consumerName) }}</div>
                  <span class="consumer-name">{{ row.consumerName }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="utilityType">
              <th mat-header-cell *matHeaderCellDef>TYPE</th>
              <td mat-cell *matCellDef="let row">
                <span class="utility-badge" [ngClass]="getUtilityClass(row.utilityType)">
                  <mat-icon>{{ getUtilityIcon(row.utilityType) }}</mat-icon>
                  {{ row.utilityType }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="billingPeriod">
              <th mat-header-cell *matHeaderCellDef>PERIOD</th>
              <td mat-cell *matCellDef="let row">
                <span class="period-badge">{{ row.billingPeriod }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="dueAmount">
              <th mat-header-cell *matHeaderCellDef>DUE</th>
              <td mat-cell *matCellDef="let row">
                <span class="amount-value">₹{{ row.dueAmount | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="penaltyAmount">
              <th mat-header-cell *matHeaderCellDef>PENALTY</th>
              <td mat-cell *matCellDef="let row">
                <span class="penalty-value" *ngIf="row.penaltyAmount > 0">₹{{ row.penaltyAmount | number:'1.2-2' }}</span>
                <span class="no-penalty" *ngIf="!row.penaltyAmount || row.penaltyAmount === 0">—</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="outstandingBalance">
              <th mat-header-cell *matHeaderCellDef>OUTSTANDING</th>
              <td mat-cell *matCellDef="let row">
                <span class="outstanding-badge" [class.zero]="row.outstandingBalance === 0">
                  ₹{{ row.outstandingBalance | number:'1.2-2' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>DUE DATE</th>
              <td mat-cell *matCellDef="let row">
                <span class="date-text" [class.overdue]="isOverdue(row)">
                  {{ row.dueDate | date:'mediumDate' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>STATUS</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="getStatusClass(row.status)">
                  <span class="status-dot"></span>
                  {{ row.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>ACTIONS</th>
              <td mat-cell *matCellDef="let row">
                <div class="action-buttons">
                  <button class="action-btn view" [routerLink]="['/billing', row.id]" matTooltip="View Details">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button class="action-btn pay" [routerLink]="['/payments/new']" [queryParams]="{billId: row.id}" 
                          *ngIf="(canRecordPayment || isConsumer) && row.status !== 'Paid'" matTooltip="Pay Now">
                    <mat-icon>payment</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>receipt_long</mat-icon>
                <h4>No bills found</h4>
                <p>Try adjusting your search or filter criteria</p>
              </td>
            </tr>
          </table>
        </div>

        <div class="paginator-wrapper">
          <mat-paginator
            [length]="totalRecords"
            [pageSize]="pageSize"
            [pageIndex]="pageNumber - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .bills-page {
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
      text-decoration: none;

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

    /* Filter Section */
    .filter-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-container {
      flex: 1;
      min-width: 280px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 1.25rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      transition: all 0.3s ease;

      &:focus-within {
        border-color: rgba(0, 245, 160, 0.4);
        box-shadow: 0 0 20px rgba(0, 245, 160, 0.1);
      }
    }

    .search-icon {
      color: rgba(255, 255, 255, 0.4);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .search-input {
      flex: 1;
      padding: 1rem 0;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.95);

      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }

    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: rgba(255, 107, 107, 0.2);
        color: #FF6B6B;
      }
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      select {
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        cursor: pointer;
        min-width: 130px;
        outline: none;
        transition: all 0.2s ease;

        &:hover, &:focus {
          border-color: rgba(0, 245, 160, 0.4);
        }

        option {
          background: #1a1f2e;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .clear-filters-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: rgba(255, 107, 107, 0.1);
        border-color: rgba(255, 107, 107, 0.3);
        color: #FF6B6B;
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

      &.bills {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
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
        padding: 1rem 0.5rem;
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
        padding: 0.75rem 0.5rem;
      }
    }

    .bill-link {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.8rem;
      color: #00D9F5;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        text-shadow: 0 0 12px rgba(0, 217, 245, 0.6);
      }
    }

    .consumer-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 600;
      color: white;
    }

    .consumer-name {
      font-weight: 500;
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

    .period-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .amount-value {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
    }

    .penalty-value {
      font-weight: 600;
      color: #FFD93D;
      font-size: 0.85rem;
    }

    .no-penalty {
      color: rgba(255, 255, 255, 0.3);
    }

    .outstanding-badge {
      display: inline-block;
      padding: 0.3rem 0.6rem;
      background: rgba(255, 107, 107, 0.12);
      border: 1px solid rgba(255, 107, 107, 0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #FF6B6B;

      &.zero {
        background: rgba(0, 245, 160, 0.12);
        border-color: rgba(0, 245, 160, 0.3);
        color: #00F5A0;
      }
    }

    .date-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;

      &.overdue {
        color: #FF6B6B;
        font-weight: 500;
      }
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

      &.status-paid {
        background: rgba(0, 245, 160, 0.12);
        color: #00F5A0;
        border: 1px solid rgba(0, 245, 160, 0.3);

        .status-dot {
          background: #00F5A0;
          box-shadow: 0 0 8px rgba(0, 245, 160, 0.6);
        }
      }

      &.status-due {
        background: rgba(255, 217, 61, 0.12);
        color: #FFD93D;
        border: 1px solid rgba(255, 217, 61, 0.3);

        .status-dot {
          background: #FFD93D;
          box-shadow: 0 0 8px rgba(255, 217, 61, 0.6);
        }
      }

      &.status-overdue {
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

      &.view:hover {
        background: rgba(102, 126, 234, 0.15);
        border-color: rgba(102, 126, 234, 0.4);
        color: #667eea;
      }

      &.pay:hover {
        background: rgba(0, 245, 160, 0.15);
        border-color: rgba(0, 245, 160, 0.4);
        color: #00F5A0;
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

    .paginator-wrapper {
      padding: 0.5rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);

      ::ng-deep .mat-mdc-paginator {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
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

      .filter-section {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
        flex-wrap: wrap;
      }

      .filter-item {
        flex: 1;
        min-width: 100px;
      }
    }
  `]
})
export class BillListComponent implements OnInit {
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<BillListItem>([]);
  displayedColumns = ['billNumber', 'consumerName', 'utilityType', 'billingPeriod', 'dueAmount', 'penaltyAmount', 'outstandingBalance', 'dueDate', 'status', 'actions'];

  loading = false;
  searchTerm = '';
  selectedStatus: string | null = null;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canRecordPayment = false;
  canGenerateBill = false;
  isConsumer = false;

  constructor(
    private billsService: BillsService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // BillingOfficer can only generate bills, not record payments
    // AccountOfficer is view-only - only Admin can record payments
    this.canRecordPayment = this.authService.hasRole(['Admin']);
    this.canGenerateBill = this.authService.hasRole(['Admin', 'BillingOfficer']);
    this.isConsumer = this.authService.hasRole(['Consumer']);
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    
    // Consumer uses a different API endpoint
    if (this.isConsumer) {
      this.billsService.getMyBills().subscribe({
        next: (response) => {
          this.loading = false;
          console.log('My Bills API response:', response);
          // Map the response data to include dueAmount (totalAmount - penaltyAmount)
          const bills = (response.data || []).map(bill => ({
            ...bill,
            dueAmount: bill.dueAmount ?? (bill.totalAmount - (bill.penaltyAmount || 0))
          }));
          this.dataSource.data = bills;
          this.totalRecords = bills.length;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading my bills:', err);
          this.loading = false; 
          this.cdr.detectChanges(); 
        }
      });
      return;
    }

    // Staff uses paginated endpoint
    const params: PaginationParams & { status?: string } = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus ?? undefined
    };

    this.billsService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Bills API response:', response);
        if (response.data && response.data.length > 0) {
          console.log('First bill data:', response.data[0]);
        }
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadBills();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBills();
  }

  isOverdue(bill: BillListItem): boolean {
    return new Date(bill.dueDate) < new Date() && bill.status !== 'Paid';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Due': return 'status-due';
      case 'Overdue': return 'status-overdue';
      default: return '';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
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
