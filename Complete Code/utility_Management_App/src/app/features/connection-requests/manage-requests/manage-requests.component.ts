import { Component, OnInit, ChangeDetectorRef, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { ConnectionRequestsService } from '../../../core/services/connection-requests.service';
import {
  ConnectionRequestListDto,
  ConnectionRequestDto,
  ProcessConnectionRequestDto
} from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-manage-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <div class="requests-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="header-text">
            <h1>Connection Requests</h1>
            <p>Review and process consumer connection requests</p>
          </div>
        </div>
      </div>

      <!-- Search & Filter Section -->
      <div class="filter-section">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (keyup.enter)="search()" 
            placeholder="Search by request number, consumer...">
          <button class="clear-btn" *ngIf="searchTerm" (click)="searchTerm = ''; search()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="filter-group">
          <div class="filter-item">
            <label>Status</label>
            <select [(ngModel)]="statusFilter" (change)="onStatusFilterChange()">
              <option value="">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button class="refresh-btn" (click)="loadRequests()">
            <mat-icon>refresh</mat-icon>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRecords }}</span>
            <span class="stat-label">Total Requests</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value pending-val">{{ pendingCount }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading requests...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading">
        <div class="table-header">
          <h3>All Requests</h3>
          <span class="table-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" *ngIf="dataSource.data.length > 0">
            <ng-container matColumnDef="requestNumber">
              <th mat-header-cell *matHeaderCellDef>REQUEST #</th>
              <td mat-cell *matCellDef="let row">
                <span class="code-badge">{{ row.requestNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="consumerName">
              <th mat-header-cell *matHeaderCellDef>CONSUMER</th>
              <td mat-cell *matCellDef="let row">
                <div class="consumer-cell">
                  <div class="avatar">{{ getInitials(row.consumerName) }}</div>
                  <div class="consumer-info">
                    <span class="consumer-name">{{ row.consumerName }}</span>
                    <span class="consumer-num">{{ row.consumerNumber }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="utilityTypeName">
              <th mat-header-cell *matHeaderCellDef>UTILITY</th>
              <td mat-cell *matCellDef="let row">
                <span class="utility-badge" [ngClass]="getUtilityClass(row.utilityTypeName)">
                  <mat-icon>{{ getUtilityIcon(row.utilityTypeName) }}</mat-icon>
                  {{ row.utilityTypeName }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="tariffPlanName">
              <th mat-header-cell *matHeaderCellDef>PLAN</th>
              <td mat-cell *matCellDef="let row">
                <span class="plan-text">{{ row.tariffPlanName }}</span>
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

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>REQUESTED</th>
              <td mat-cell *matCellDef="let row">
                <span class="date-text">{{ row.createdAt | date:'short' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>ACTIONS</th>
              <td mat-cell *matCellDef="let row">
                <div class="action-buttons">
                  <button class="action-btn view" matTooltip="View Details" (click)="viewDetails(row)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button class="action-btn process" matTooltip="Process Request"
                          *ngIf="row.status === 'Pending'" (click)="openProcessDialog(row)">
                    <mat-icon>task_alt</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                [class.pending-row]="row.status === 'Pending'"></tr>
          </table>

          <!-- Empty State -->
          <div *ngIf="dataSource.data.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h4>No Requests Found</h4>
            <p>There are no connection requests matching your criteria.</p>
          </div>
        </div>

        <!-- Paginator -->
        <div class="paginator-wrapper" *ngIf="totalRecords > 0">
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

    .requests-page {
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
        min-width: 150px;
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

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 1rem;
      background: rgba(0, 245, 160, 0.1);
      border: 1px solid rgba(0, 245, 160, 0.3);
      border-radius: 10px;
      color: #00F5A0;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: rgba(0, 245, 160, 0.2);
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

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      &.pending {
        background: linear-gradient(135deg, #FFD93D 0%, #FF6B00 100%);
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 1.35rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);

        &.pending-val {
          color: #FFD93D;
        }
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
        padding: 1rem 0.65rem;
      }

      .mat-mdc-row {
        background: transparent;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        &.pending-row {
          background: rgba(255, 217, 61, 0.03);
        }
      }

      .mat-mdc-cell {
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        padding: 0.75rem 0.65rem;
      }
    }

    .code-badge {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.75rem;
      color: #00D9F5;
      background: rgba(0, 217, 245, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(0, 217, 245, 0.2);
    }

    .consumer-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
    }

    .consumer-info {
      display: flex;
      flex-direction: column;
    }

    .consumer-name {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.9rem;
    }

    .consumer-num {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .utility-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
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

    .plan-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
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

      &.pending {
        background: rgba(255, 217, 61, 0.12);
        color: #FFD93D;
        border: 1px solid rgba(255, 217, 61, 0.3);

        .status-dot {
          background: #FFD93D;
          box-shadow: 0 0 8px rgba(255, 217, 61, 0.6);
        }
      }

      &.approved {
        background: rgba(0, 245, 160, 0.12);
        color: #00F5A0;
        border: 1px solid rgba(0, 245, 160, 0.3);

        .status-dot {
          background: #00F5A0;
          box-shadow: 0 0 8px rgba(0, 245, 160, 0.6);
        }
      }

      &.rejected {
        background: rgba(255, 107, 107, 0.12);
        color: #FF6B6B;
        border: 1px solid rgba(255, 107, 107, 0.3);

        .status-dot {
          background: #FF6B6B;
          box-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
        }
      }

      &.cancelled {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.15);

        .status-dot {
          background: rgba(255, 255, 255, 0.4);
        }
      }
    }

    .date-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
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

      &.process:hover {
        background: rgba(0, 245, 160, 0.15);
        border-color: rgba(0, 245, 160, 0.4);
        color: #00F5A0;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      text-align: center;

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
      .filter-section {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
        flex-wrap: wrap;
      }

      .filter-item {
        flex: 1;
      }

      .stats-row {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ManageRequestsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<ConnectionRequestListDto>([]);
  displayedColumns = ['requestNumber', 'consumerName', 'utilityTypeName', 'tariffPlanName', 'status', 'createdAt', 'actions'];

  loading = false;
  pendingCount = 0;
  totalRecords = 0;
  pageNumber = 1;
  pageSize = 10;
  statusFilter = '';
  searchTerm = '';

  constructor(
    private connectionRequestsService: ConnectionRequestsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.loadRequests();
    this.loadPendingCount();
  }

  loadRequests(): void {
    this.loading = true;
    this.connectionRequestsService.getAll({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      status: this.statusFilter
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingCount(): void {
    this.connectionRequestsService.getPendingRequests().subscribe({
      next: (response) => {
        this.pendingCount = response.data?.length || 0;
        this.cdr.detectChanges();
      }
    });
  }

  onStatusFilterChange(): void {
    this.pageNumber = 1;
    this.loadRequests();
  }

  search(): void {
    this.pageNumber = 1;
    this.loadRequests();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRequests();
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getUtilityClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'electricity';
    if (lower.includes('water')) return 'water';
    if (lower.includes('gas')) return 'gas';
    if (lower.includes('internet')) return 'internet';
    return '';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  viewDetails(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        this.dialog.open(AdminRequestDetailsDialogComponent, {
          width: '550px',
          data: response.data
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }

  openProcessDialog(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(ProcessRequestDialogComponent, {
          width: '550px',
          data: response.data
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadRequests();
            this.loadPendingCount();
          }
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }
}

// Dialog to view request details (Admin view)
@Component({
  selector: 'app-admin-request-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>
      Request Details
      <mat-chip [ngClass]="getStatusClass(data.status)" class="status-chip">{{ data.status }}</mat-chip>
    </h2>
    <mat-dialog-content>
      <div class="detail-section">
        <h4>Request Information</h4>
        <div class="detail-row">
          <span>Request Number:</span>
          <strong class="request-num">{{ data.requestNumber }}</strong>
        </div>
        <div class="detail-row">
          <span>Requested On:</span>
          <strong>{{ data.createdAt | date:'medium' }}</strong>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Consumer Details</h4>
        <div class="detail-row">
          <span>Consumer Name:</span>
          <strong>{{ data.consumerName }}</strong>
        </div>
        <div class="detail-row">
          <span>Consumer Number:</span>
          <strong>{{ data.consumerNumber }}</strong>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Utility Details</h4>
        <div class="detail-row">
          <span>Utility Type:</span>
          <strong>{{ data.utilityTypeName }}</strong>
        </div>
        <div class="detail-row">
          <span>Tariff Plan:</span>
          <strong>{{ data.tariffPlanName }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.loadSanctioned">
          <span>Load Sanctioned:</span>
          <strong>{{ data.loadSanctioned }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.installationAddress">
          <span>Installation Address:</span>
          <strong>{{ data.installationAddress }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.remarks">
          <span>Consumer Remarks:</span>
          <strong>{{ data.remarks }}</strong>
        </div>
      </div>

      <mat-divider *ngIf="data.processedAt"></mat-divider>

      <div class="detail-section" *ngIf="data.processedAt">
        <h4>Processing Information</h4>
        <div class="detail-row">
          <span>Processed On:</span>
          <strong>{{ data.processedAt | date:'medium' }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.processedByUserName">
          <span>Processed By:</span>
          <strong>{{ data.processedByUserName }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.adminRemarks">
          <span>Admin Remarks:</span>
          <strong>{{ data.adminRemarks }}</strong>
        </div>
        <div class="detail-row success" *ngIf="data.createdConnectionNumber">
          <span>Connection Number:</span>
          <strong>{{ data.createdConnectionNumber }}</strong>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: rgba(22, 33, 62, 0.95);
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: rgba(255,255,255,0.95) !important;
    }

    .status-chip {
      font-size: 0.75rem;
      &.pending {
        background: rgba(255,217,61,0.15) !important;
        color: #FFD93D !important;
        border: 1px solid rgba(255,217,61,0.3) !important;
      }
      &.approved {
        background: rgba(0,242,96,0.15) !important;
        color: #00F260 !important;
        border: 1px solid rgba(0,242,96,0.3) !important;
      }
      &.rejected {
        background: rgba(255,107,107,0.15) !important;
        color: #FF6B6B !important;
        border: 1px solid rgba(255,107,107,0.3) !important;
      }
      &.cancelled {
        background: rgba(160,174,192,0.15) !important;
        color: #A0AEC0 !important;
        border: 1px solid rgba(160,174,192,0.3) !important;
      }
    }

    .detail-section {
      padding: 1rem 0;

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #00D2FF;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;

      span { color: rgba(255,255,255,0.5); }
      strong { color: rgba(255,255,255,0.95); text-align: right; max-width: 60%; }

      &.success strong { color: #00F260; }
    }

    .request-num {
      font-family: 'Fira Code', monospace;
      color: #00D2FF !important;
    }

    mat-divider {
      margin: 0.5rem 0;
      border-top-color: rgba(255,255,255,0.08) !important;
    }
  `]
})
export class AdminRequestDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto) {}

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}

// Dialog to process (approve/reject) a request
@Component({
  selector: 'app-process-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">task_alt</mat-icon>
      Process Connection Request
    </h2>
    <mat-dialog-content>
      <div class="request-summary">
        <div class="summary-header">
          <span class="request-num">{{ data.requestNumber }}</span>
          <mat-chip class="pending">Pending</mat-chip>
        </div>
        <div class="summary-details">
          <div class="detail">
            <span class="label">Consumer:</span>
            <span class="value">{{ data.consumerName }} ({{ data.consumerNumber }})</span>
          </div>
          <div class="detail">
            <span class="label">Utility:</span>
            <span class="value">{{ data.utilityTypeName }}</span>
          </div>
          <div class="detail">
            <span class="label">Plan:</span>
            <span class="value">{{ data.tariffPlanName }}</span>
          </div>
          <div class="detail" *ngIf="data.loadSanctioned">
            <span class="label">Load:</span>
            <span class="value">{{ data.loadSanctioned }}</span>
          </div>
          <div class="detail" *ngIf="data.remarks">
            <span class="label">Remarks:</span>
            <span class="value">{{ data.remarks }}</span>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <form [formGroup]="form" class="process-form">
        <h4>Your Decision</h4>

        <div class="decision-buttons">
          <button mat-stroked-button type="button"
                  [class.selected]="decision === 'approve'"
                  class="approve-btn"
                  (click)="setDecision('approve')">
            <mat-icon>check_circle</mat-icon>
            Approve
          </button>
          <button mat-stroked-button type="button"
                  [class.selected]="decision === 'reject'"
                  class="reject-btn"
                  (click)="setDecision('reject')">
            <mat-icon>cancel</mat-icon>
            Reject
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width" *ngIf="decision === 'approve'">
          <mat-label>Meter Number</mat-label>
          <input matInput formControlName="meterNumber" placeholder="e.g., ELE-M005" required>
          <mat-icon matPrefix>speed</mat-icon>
          <mat-hint>Enter the meter number to assign to this connection</mat-hint>
          <mat-error *ngIf="form.get('meterNumber')?.hasError('required')">
            Meter number is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Admin Remarks {{ decision === 'reject' ? '(Required)' : '(Optional)' }}</mat-label>
          <textarea matInput formControlName="adminRemarks" rows="3"
                    [placeholder]="decision === 'reject' ? 'Please provide reason for rejection' : 'Add any remarks...'"></textarea>
          <mat-error *ngIf="form.get('adminRemarks')?.hasError('required')">
            Please provide a reason for rejection
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button 
              [color]="decision === 'approve' ? 'primary' : 'warn'"
              [disabled]="!decision || form.invalid || submitting"
              (click)="submit()">
        <mat-icon>{{ decision === 'approve' ? 'check' : 'close' }}</mat-icon>
        {{ submitting ? 'Processing...' : (decision === 'approve' ? 'Approve Request' : 'Reject Request') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: rgba(22, 33, 62, 0.95);
    }

    h2[mat-dialog-title] {
      color: rgba(255,255,255,0.95) !important;
    }

    .title-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #00D2FF;
    }

    .request-summary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .request-num {
        font-family: 'Fira Code', monospace;
        font-weight: 600;
        font-size: 1rem;
        color: #00D2FF;
      }

      .summary-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .detail {
        display: flex;
        gap: 0.5rem;
        font-size: 0.875rem;

        .label { color: rgba(255,255,255,0.5); min-width: 80px; }
        .value { color: rgba(255,255,255,0.95); font-weight: 500; }
      }
    }

    mat-chip.pending {
      background: rgba(255,217,61,0.15) !important;
      color: #FFD93D !important;
      border: 1px solid rgba(255,217,61,0.3) !important;
    }

    .process-form {
      padding-top: 1rem;

      h4 {
        margin: 0 0 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #00D2FF;
      }
    }

    .decision-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;

      button {
        flex: 1;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 8px;
        transition: all 0.2s;
        border-color: rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.7);

        &.approve-btn {
          &:hover, &.selected {
            background-color: rgba(0,242,96,0.15);
            border-color: #00F260;
            color: #00F260;
          }
        }

        &.reject-btn {
          &:hover, &.selected {
            background-color: rgba(255,107,107,0.15);
            border-color: #FF6B6B;
            color: #FF6B6B;
          }
        }

        &.selected {
          border-width: 2px;
        }
      }
    }

    .full-width { width: 100%; margin-bottom: 1rem; }

    ::ng-deep {
      .mat-mdc-form-field {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.2);
          --mdc-outlined-text-field-hover-outline-color: rgba(0,210,255,0.5);
          --mdc-outlined-text-field-focus-outline-color: #00D2FF;
        }
        .mat-mdc-form-field-label, .mdc-floating-label {
          color: rgba(255,255,255,0.5) !important;
        }
        input, textarea {
          color: rgba(255,255,255,0.95) !important;
        }
      }
      .mat-mdc-dialog-actions button[mat-raised-button][color="primary"] {
        background: linear-gradient(135deg, #00F260 0%, #00c853 100%) !important;
        color: #0a0a0f !important;
      }
      .mat-mdc-dialog-actions button[mat-raised-button][color="warn"] {
        background: linear-gradient(135deg, #FF6B6B 0%, #ef4444 100%) !important;
        color: #fff !important;
      }
    }

    mat-divider {
      margin: 1rem 0;
      border-top-color: rgba(255,255,255,0.08) !important;
    }
  `]
})
export class ProcessRequestDialogComponent {
  form: FormGroup;
  decision: 'approve' | 'reject' | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProcessRequestDialogComponent>,
    private connectionRequestsService: ConnectionRequestsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto
  ) {
    this.form = this.fb.group({
      meterNumber: [''],
      adminRemarks: ['']
    });
  }

  setDecision(decision: 'approve' | 'reject'): void {
    this.decision = decision;
    
    // Update validation based on decision
    const remarksControl = this.form.get('adminRemarks');
    const meterNumberControl = this.form.get('meterNumber');
    
    if (decision === 'reject') {
      remarksControl?.setValidators([Validators.required]);
      meterNumberControl?.clearValidators();
    } else {
      // Meter number required for approval
      meterNumberControl?.setValidators([Validators.required]);
      remarksControl?.clearValidators();
    }
    remarksControl?.updateValueAndValidity();
    meterNumberControl?.updateValueAndValidity();
  }

  submit(): void {
    if (!this.decision || this.form.invalid) return;

    this.submitting = true;
    const payload: ProcessConnectionRequestDto = {
      approve: this.decision === 'approve',
      adminRemarks: this.form.value.adminRemarks,
      meterNumber: this.form.value.meterNumber
    };

    this.connectionRequestsService.processRequest(this.data.id, payload).subscribe({
      next: () => {
        const message = this.decision === 'approve' 
          ? 'Request approved! Connection created successfully.' 
          : 'Request rejected successfully.';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Failed to process request', 'Close', { duration: 3000 });
      }
    });
  }
}
