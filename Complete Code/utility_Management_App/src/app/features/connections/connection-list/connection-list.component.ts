import { Component, OnInit, ChangeDetectorRef, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConnectionsService } from '../../../core/services/connections.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConnectionListItem, PaginationParams } from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-connection-list',
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
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="connections-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>cable</mat-icon>
          </div>
          <div class="header-text">
            <h1>Connections</h1>
            <p>Manage utility connections</p>
          </div>
        </div>
        <button class="add-btn" routerLink="/connections/new" *ngIf="canEdit">
          <mat-icon>add</mat-icon>
          <span>Add Connection</span>
        </button>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (keyup.enter)="search()" 
            placeholder="Search by connection number, meter number, or consumer...">
          <button class="clear-btn" *ngIf="searchTerm" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <button class="search-btn" (click)="search()">
          <mat-icon>search</mat-icon>
          <span>Search</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>cable</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRecords }}</span>
            <span class="stat-label">Total Connections</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading connections...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading">
        <div class="table-header">
          <h3>All Connections</h3>
          <span class="table-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="connectionNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>CONNECTION #</th>
              <td mat-cell *matCellDef="let row">
                <span class="connection-number">{{ row.connectionNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="meterNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>METER #</th>
              <td mat-cell *matCellDef="let row">
                <span class="meter-number">{{ row.meterNumber }}</span>
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
              <th mat-header-cell *matHeaderCellDef>UTILITY TYPE</th>
              <td mat-cell *matCellDef="let row">
                <span class="utility-badge" [ngClass]="getUtilityClass(row.utilityType)">
                  <mat-icon>{{ getUtilityIcon(row.utilityType) }}</mat-icon>
                  {{ row.utilityType }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="tariffPlanName">
              <th mat-header-cell *matHeaderCellDef>TARIFF PLAN</th>
              <td mat-cell *matCellDef="let row">
                <span class="tariff-badge">{{ row.tariffPlanName }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="connectionDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>CONNECTION DATE</th>
              <td mat-cell *matCellDef="let row">
                <span class="date-text">{{ row.connectionDate | date:'mediumDate' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>STATUS</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="row.status === 'Active' ? 'active' : 'inactive'">
                  <span class="status-dot"></span>
                  {{ row.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>ACTIONS</th>
              <td mat-cell *matCellDef="let row">
                <div class="action-buttons">
                  <button class="action-btn view" [routerLink]="['/connections', row.id]" matTooltip="View Details" *ngIf="isAdmin">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button class="action-btn edit" [routerLink]="['/connections', row.id, 'edit']" matTooltip="Edit" *ngIf="canEdit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="action-btn delete" matTooltip="Delete" *ngIf="isAdmin" (click)="deleteConnection(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>cable</mat-icon>
                <h4>No connections found</h4>
                <p>Try adjusting your search criteria</p>
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

    .connections-page {
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

    /* Search Section */
    .search-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-container {
      flex: 1;
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

    .search-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1.5rem;
      background: rgba(0, 245, 160, 0.1);
      border: 1px solid rgba(0, 245, 160, 0.3);
      border-radius: 14px;
      color: #00F5A0;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(0, 245, 160, 0.2);
        border-color: rgba(0, 245, 160, 0.5);
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
        background: linear-gradient(135deg, #00D9F5 0%, #0083B0 100%);
        box-shadow: 0 4px 15px rgba(0, 217, 245, 0.3);
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
        padding: 0.875rem 0.75rem;
      }
    }

    .connection-number, .meter-number {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
    }

    .consumer-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
    }

    .consumer-name {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
    }

    .utility-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.electric {
        background: rgba(255, 217, 61, 0.15);
        color: #FFD93D;
        border: 1px solid rgba(255, 217, 61, 0.3);
      }

      &.water {
        background: rgba(0, 217, 245, 0.15);
        color: #00D9F5;
        border: 1px solid rgba(0, 217, 245, 0.3);
      }

      &.gas {
        background: rgba(255, 107, 107, 0.15);
        color: #FF6B6B;
        border: 1px solid rgba(255, 107, 107, 0.3);
      }

      &.internet {
        background: rgba(102, 126, 234, 0.15);
        color: #667eea;
        border: 1px solid rgba(102, 126, 234, 0.3);
      }

      &.default {
        background: rgba(0, 245, 160, 0.15);
        color: #00F5A0;
        border: 1px solid rgba(0, 245, 160, 0.3);
      }
    }

    .tariff-badge {
      display: inline-block;
      padding: 0.3rem 0.65rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .date-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
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

      &.edit:hover {
        background: rgba(0, 217, 245, 0.15);
        border-color: rgba(0, 217, 245, 0.4);
        color: #00D9F5;
      }

      &.delete:hover {
        background: rgba(255, 107, 107, 0.15);
        border-color: rgba(255, 107, 107, 0.4);
        color: #FF6B6B;
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

      .search-section {
        flex-direction: column;
      }

      .search-btn {
        width: 100%;
        justify-content: center;
        padding: 1rem;
      }
    }
  `]
})
export class ConnectionListComponent implements OnInit {
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<ConnectionListItem>([]);
  displayedColumns: string[] = [];

  loading = false;
  searchTerm = '';
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canEdit = false;
  isAdmin = false;

  constructor(
    private connectionsService: ConnectionsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Only Admin can edit connections - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
    this.isAdmin = user?.role === 'Admin';
    
    // Set displayed columns based on role - hide actions column for non-admin users
    this.displayedColumns = ['connectionNumber', 'meterNumber', 'consumerName', 'utilityType', 'tariffPlanName', 'connectionDate', 'status'];
    if (this.isAdmin) {
      this.displayedColumns.push('actions');
    }
    
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.loadConnections();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getUtilityIcon(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getUtilityClass(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('electric')) return 'electric';
    if (lower.includes('water')) return 'water';
    if (lower.includes('gas')) return 'gas';
    if (lower.includes('internet')) return 'internet';
    return 'default';
  }

  loadConnections(): void {
    this.loading = true;
    const params: PaginationParams = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined
    };

    this.connectionsService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadConnections();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadConnections();
  }

  deleteConnection(row: ConnectionListItem): void {
    const dialogRef = this.dialog.open(DeleteConnectionDialogComponent, {
      width: '450px',
      data: { connectionNumber: row.connectionNumber, consumerName: row.consumerName },
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.connectionsService.delete(row.id).subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'Connection deleted successfully', 'Close', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.loadConnections();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Failed to delete connection';
            // Check if it's a pending bills error
            if (errorMessage.includes('pending bill')) {
              this.dialog.open(PendingBillsErrorDialogComponent, {
                width: '500px',
                data: { message: errorMessage, connectionNumber: row.connectionNumber }
              });
            } else {
              this.snackBar.open(errorMessage, 'Close', {
                duration: 6000,
                panelClass: ['error-snackbar']
              });
            }
          }
        });
      }
    });
  }
}

// Confirmation Dialog Component
@Component({
  selector: 'app-delete-connection-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="delete-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2>Confirm Deletion</h2>
      </div>
      <div class="dialog-content">
        <p>Are you sure you want to delete this connection?</p>
        <div class="connection-info">
          <div class="info-row">
            <span class="label">Connection #:</span>
            <span class="value">{{ data.connectionNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">Consumer:</span>
            <span class="value">{{ data.consumerName }}</span>
          </div>
        </div>
        <p class="warning-text">If this connection has some associated unpaid bills, this connection won't be deleted.</p>
      </div>
      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="warn" (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          Delete Connection
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .delete-dialog {
      padding: 24px;
      background: #1e293b;
      color: #ffffff;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .warning-icon {
      color: #f59e0b;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
    }
    .dialog-content p {
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    .connection-info {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .label {
      color: #ffffff;
      font-weight: 500;
    }
    .value {
      color: #ffffff;
      font-weight: 600;
    }
    .warning-text {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  `]
})
export class DeleteConnectionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { connectionNumber: string; consumerName: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

// Pending Bills Error Dialog Component
@Component({
  selector: 'app-pending-bills-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-dialog">
      <div class="dialog-header">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Cannot Delete Connection</h2>
      </div>
      <div class="dialog-content">
        <div class="connection-badge">
          <mat-icon>cable</mat-icon>
          <span>{{ data.connectionNumber }}</span>
        </div>
        <div class="error-message">
          <mat-icon>receipt_long</mat-icon>
          <p>{{ data.message }}</p>
        </div>
        <div class="help-text">
          <strong>What you can do:</strong>
          <ul>
            <li>Collect pending payments from the consumer</li>
            <li>Navigate to Bills section to view outstanding bills</li>
            <li>Once all bills are paid, you can delete/disconnect this connection</li>
          </ul>
        </div>
      </div>
      <div class="dialog-actions">
        <button mat-flat-button color="primary" (click)="onClose()">
          Understood
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-dialog {
      padding: 24px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .error-icon {
      color: #ef4444;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
    }
    .connection-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #e0f2fe;
      color: #0369a1;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .connection-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .error-message {
      display: flex;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .error-message mat-icon {
      color: #ef4444;
      flex-shrink: 0;
    }
    .error-message p {
      margin: 0;
      color: #991b1b;
      line-height: 1.5;
    }
    .help-text {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
    }
    .help-text strong {
      color: #166534;
      display: block;
      margin-bottom: 8px;
    }
    .help-text ul {
      margin: 0;
      padding-left: 20px;
      color: #166534;
    }
    .help-text li {
      margin-bottom: 4px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class PendingBillsErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PendingBillsErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string; connectionNumber: string }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
