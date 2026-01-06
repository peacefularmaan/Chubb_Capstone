import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConsumersService } from '../../../core/services/consumers.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsumerListItem, PaginationParams } from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-consumer-list',
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
    MatTooltipModule
  ],
  template: `
    <div class="consumers-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>people</mat-icon>
          </div>
          <div class="header-text">
            <h1>Consumers</h1>
            <p>Manage all registered consumers</p>
          </div>
        </div>
        <button class="add-btn" routerLink="/consumers/new" *ngIf="canEdit">
          <mat-icon>add</mat-icon>
          <span>Add Consumer</span>
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
            placeholder="Search by name, email, or consumer number...">
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
            <mat-icon>group</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRecords }}</span>
            <span class="stat-label">Total Consumers</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading consumers...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading">
        <div class="table-header">
          <h3>All Consumers</h3>
          <span class="table-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="consumerNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>CONSUMER #</th>
              <td mat-cell *matCellDef="let row">
                <span class="consumer-number">{{ row.consumerNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>NAME</th>
              <td mat-cell *matCellDef="let row">
                <div class="name-cell">
                  <div class="avatar">{{ getInitials(row.fullName) }}</div>
                  <span class="name-text">{{ row.fullName }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>EMAIL</th>
              <td mat-cell *matCellDef="let row">
                <span class="email-text">{{ row.email }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>PHONE</th>
              <td mat-cell *matCellDef="let row">{{ row.phone || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>CITY</th>
              <td mat-cell *matCellDef="let row">
                <span class="city-badge">{{ row.city }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="totalConnections">
              <th mat-header-cell *matHeaderCellDef>CONNECTIONS</th>
              <td mat-cell *matCellDef="let row">
                <span class="connection-count">{{ row.totalConnections }}</span>
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

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>person_search</mat-icon>
                <h4>No consumers found</h4>
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

    .consumers-page {
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
        padding: 1rem;
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
        padding: 1rem;
      }
    }

    .consumer-number {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
    }

    .name-cell {
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
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .name-text {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
    }

    .email-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }

    .city-badge {
      display: inline-block;
      padding: 0.3rem 0.65rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .connection-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      background: rgba(0, 217, 245, 0.15);
      border: 1px solid rgba(0, 217, 245, 0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #00D9F5;
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
export class ConsumerListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<ConsumerListItem>([]);
  displayedColumns = ['consumerNumber', 'fullName', 'email', 'phone', 'city', 'totalConnections', 'isActive'];

  loading = false;
  searchTerm = '';
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canEdit = false;

  constructor(
    private consumersService: ConsumersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Only Admin can edit consumers - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
    configureCaseInsensitiveSort(this.dataSource);
  }

  ngOnInit(): void {
    this.loadConsumers();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadConsumers(): void {
    this.loading = true;
    const params: PaginationParams = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined
    };

    this.consumersService.getAll(params).subscribe({
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
    this.loadConsumers();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadConsumers();
  }
}
