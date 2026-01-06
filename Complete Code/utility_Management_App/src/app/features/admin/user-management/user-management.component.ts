import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  template: `
    <div class="users-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>people</mat-icon>
          </div>
          <div class="header-text">
            <h1>User Management</h1>
            <p>Manage system users and their roles</p>
          </div>
        </div>
        <button class="add-btn" (click)="openDialog()">
          <mat-icon>person_add</mat-icon>
          <span>Add User</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon users">
            <mat-icon>people</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRecords }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <mat-icon>verified_user</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getActiveUsersCount() }}</span>
            <span class="stat-label">Active Users</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading users...</p>
      </div>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading">
        <div class="table-header">
          <h3>Users List</h3>
          <span class="table-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort (matSortChange)="sortData($event)">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>USER</th>
              <td mat-cell *matCellDef="let row">
                <div class="user-cell">
                  <div class="avatar">{{ getInitials(row) }}</div>
                  <div class="user-info">
                    <span class="name">{{ row.firstName }} {{ row.lastName }}</span>
                    <span class="email">{{ row.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ROLE</th>
              <td mat-cell *matCellDef="let row">
                <span class="role-badge" [ngClass]="getRoleClass(row.role)">
                  <mat-icon>{{ getRoleIcon(row.role) }}</mat-icon>
                  {{ getRoleLabel(row.role) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>STATUS</th>
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
                  <button class="action-btn delete" matTooltip="Delete" (click)="delete(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>people</mat-icon>
                <h4>No users found</h4>
                <p>Click "Add User" to create one</p>
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

    .users-page {
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

      &.users {
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

    .user-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.95rem;
    }

    .email {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 500;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      &.role-admin {
        background: rgba(168, 85, 247, 0.12);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #a855f7;
      }

      &.role-billing {
        background: rgba(0, 217, 245, 0.12);
        border: 1px solid rgba(0, 217, 245, 0.3);
        color: #00D9F5;
      }

      &.role-account {
        background: rgba(0, 245, 160, 0.12);
        border: 1px solid rgba(0, 245, 160, 0.3);
        color: #00F5A0;
      }

      &.role-consumer {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.7);
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

      .stats-row {
        flex-direction: column;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns = ['name', 'role', 'isActive', 'actions'];
  loading = false;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  private originalData: User[] = [];

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  sortData(sort: Sort): void {
    const data = [...this.originalData];
    
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          return this.compare(nameA, nameB, isAsc);
        case 'role':
          return this.compare((a.role || '').toLowerCase(), (b.role || '').toLowerCase(), isAsc);
        case 'isActive':
          return this.compare(a.isActive ? 1 : 0, b.isActive ? 1 : 0, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  load(): void {
    this.loading = true;
    this.authService.getUsers({ pageNumber: this.pageNumber, pageSize: this.pageSize }).subscribe({
      next: (response: any) => {
        this.loading = false;
        // Handle both paged response and array response
        const users = response.data || response || [];
        this.originalData = users;
        this.dataSource.data = users;
        this.totalRecords = response.totalRecords || response.totalCount || users.length || 0;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  getInitials(user: User): string {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'Admin': return 'Admin';
      case 'BillingOfficer': return 'Billing Officer';
      case 'AccountOfficer': return 'Account Officer';
      case 'Consumer': return 'Consumer';
      default: return role;
    }
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case 'Admin': return 'role-admin';
      case 'BillingOfficer': return 'role-billing';
      case 'AccountOfficer': return 'role-account';
      case 'Consumer': return 'role-consumer';
      default: return '';
    }
  }

  getRoleIcon(role: UserRole): string {
    switch (role) {
      case 'Admin': return 'admin_panel_settings';
      case 'BillingOfficer': return 'receipt_long';
      case 'AccountOfficer': return 'account_balance';
      case 'Consumer': return 'person';
      default: return 'person';
    }
  }

  getActiveUsersCount(): number {
    return this.dataSource.data.filter(u => u.isActive).length;
  }

  openDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  delete(user: User): void {
    if (confirm(`Are you sure you want to permanently delete "${user.firstName} ${user.lastName}"?\n\nThis action cannot be undone. If you just want to deactivate the user, use the Edit option instead.`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User permanently deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error deleting user', 'Close', { duration: 5000 });
        }
      });
    }
  }
}

// Dialog Component
@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" autocomplete="off">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" autocomplete="off">
            <mat-error *ngIf="form.get('firstName')?.hasError('required')">Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" autocomplete="off">
            <mat-error *ngIf="form.get('lastName')?.hasError('required')">Required</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('lowercase')">Email must contain only lowercase characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!data">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" autocomplete="new-password">
          <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 6 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone Number</mat-label>
          <input matInput formControlName="phoneNumber">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="BillingOfficer">Billing Officer</mat-option>
            <mat-option value="AccountOfficer">Account Officer</mat-option>
            <mat-option value="Consumer" *ngIf="data">Consumer</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('role')?.hasError('required')">Role is required</mat-error>
        </mat-form-field>

        <!-- Warning when changing Consumer role -->
        <div class="role-change-warning" *ngIf="showRoleChangeWarning()">
          <mat-icon>warning</mat-icon>
          <span>Changing a Consumer's role requires no active utility connections. Ensure all connections are disconnected first.</span>
        </div>

        <!-- Error message display -->
        <div class="error-banner" *ngIf="errorMessage">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <mat-form-field appearance="outline" class="full-width" *ngIf="data">
          <mat-label>Status</mat-label>
          <mat-select formControlName="isActive">
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
        <span *ngIf="!saving">{{ data ? 'Update' : 'Create' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-top: 0.5rem; }
    .form-row mat-form-field { overflow: visible; }
    .role-change-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 1rem;
      color: #92400e;
      font-size: 13px;
      line-height: 1.4;
    }
    .role-change-warning mat-icon {
      color: #f59e0b;
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 1rem;
      color: #991b1b;
      font-size: 13px;
      line-height: 1.4;
    }
    .error-banner mat-icon {
      color: #ef4444;
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class UserDialogComponent {
  form: FormGroup;
  saving = false;
  errorMessage = '';
  originalRole: string | null = null;

  // Custom validator to ensure email contains only lowercase characters
  lowercaseValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUppercase = /[A-Z]/.test(value);
    return hasUppercase ? { lowercase: true } : null;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    // Store original role for comparison
    this.originalRole = data?.role || null;

    this.form = this.fb.group({
      firstName: [data?.firstName ?? '', Validators.required],
      lastName: [data?.lastName ?? '', Validators.required],
      email: [data?.email ?? '', [Validators.required, Validators.email, this.lowercaseValidator.bind(this)]],
      password: ['', data ? [] : [Validators.required, Validators.minLength(6)]],
      phoneNumber: [data?.phoneNumber ?? ''],
      role: [data?.role ?? 'Admin', Validators.required],
      isActive: [data?.isActive ?? true]
    });

    // Disable email for existing users
    if (data) {
      this.form.get('email')?.disable();
    }

    // Clear error when role changes
    this.form.get('role')?.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
  }

  showRoleChangeWarning(): boolean {
    // Show warning when editing a Consumer and trying to change their role
    if (!this.data || this.originalRole !== 'Consumer') {
      return false;
    }
    const currentRole = this.form.get('role')?.value;
    return currentRole !== 'Consumer';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const formValue = this.form.getRawValue();

    if (this.data) {
      // Update existing user
      this.authService.updateUser(this.data.id, {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        role: formValue.role,
        isActive: formValue.isActive
      }).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.success) {
            this.snackBar.open('User updated', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            // Display error in the banner for role change errors
            if (response.message?.includes('Cannot change role') || response.message?.includes('active connection')) {
              this.errorMessage = response.message;
            } else {
              this.snackBar.open(response.message || 'Error updating', 'Close', { duration: 3000 });
            }
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.saving = false;
          const errorMsg = err.error?.message || 'Error updating user';
          // Display error in the banner for role change errors
          if (errorMsg.includes('Cannot change role') || errorMsg.includes('active connection')) {
            this.errorMessage = errorMsg;
          } else {
            this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new user
      const request = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        phoneNumber: formValue.phoneNumber,
        role: formValue.role
      };

      this.authService.registerStaff(request).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.success) {
            this.snackBar.open('User created', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response.message || 'Error creating', 'Close', { duration: 3000 });
          }
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(err.error?.message || 'Error creating', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
