import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ConnectionRequestsService } from '../../../core/services/connection-requests.service';
import {
  ConnectionRequestListDto,
  ConnectionRequestDto,
  AvailableUtilityDto,
  AvailableTariffPlanDto,
  CreateConnectionRequestDto
} from '../../../core/models';
import { configureCaseInsensitiveSort } from '../../../shared/utils/table-sort.utils';

@Component({
  selector: 'app-request-utility',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
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
    MatDividerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Request Utility Connection</h1>
          <p>Request new utility connections and track your request status</p>
        </div>
      </div>

      <mat-tab-group animationDuration="200ms">
        <!-- Available Utilities Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">add_circle</mat-icon>
            Request New Connection
          </ng-template>
          
          <div class="tab-content">
            <div *ngIf="loadingUtilities" class="loading">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading available utilities...</p>
            </div>

            <div *ngIf="!loadingUtilities && availableUtilities.length === 0" class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <h3>No New Utilities Available</h3>
              <p>You already have access to all available utilities or have pending requests for them.</p>
            </div>

            <div *ngIf="!loadingUtilities && availableUtilities.length > 0" class="utilities-grid">
              <mat-card *ngFor="let utility of availableUtilities" class="utility-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="utility-icon">{{ getUtilityIcon(utility.utilityTypeName) }}</mat-icon>
                  <mat-card-title>{{ utility.utilityTypeName }}</mat-card-title>
                  <mat-card-subtitle>{{ utility.unitOfMeasurement }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p class="description">{{ utility.description || 'No description available' }}</p>
                  <mat-divider></mat-divider>
                  <div class="tariff-section">
                    <h4>Available Plans ({{ utility.tariffPlans.length }})</h4>
                    <div class="tariff-list">
                      <div *ngFor="let plan of utility.tariffPlans" class="tariff-item">
                        <strong>{{ plan.name }}</strong>
                        <span class="rate">₹{{ plan.ratePerUnit }}/{{ utility.unitOfMeasurement }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="openRequestDialog(utility)">
                    <mat-icon>send</mat-icon>
                    Request Connection
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- My Requests Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">list_alt</mat-icon>
            My Requests
          </ng-template>
          
          <div class="tab-content">
            <div *ngIf="loadingRequests" class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>

            <div *ngIf="!loadingRequests && myRequests.length === 0" class="empty-state">
              <mat-icon>inbox</mat-icon>
              <h3>No Requests Yet</h3>
              <p>You haven't submitted any connection requests yet.</p>
            </div>

            <table mat-table [dataSource]="requestsDataSource" *ngIf="!loadingRequests && myRequests.length > 0" class="requests-table">
              <ng-container matColumnDef="requestNumber">
                <th mat-header-cell *matHeaderCellDef>Request #</th>
                <td mat-cell *matCellDef="let row">
                  <span class="request-number">{{ row.requestNumber }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="utilityTypeName">
                <th mat-header-cell *matHeaderCellDef>Utility</th>
                <td mat-cell *matCellDef="let row">
                  <div class="utility-cell">
                    <mat-icon>{{ getUtilityIcon(row.utilityTypeName) }}</mat-icon>
                    {{ row.utilityTypeName }}
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="tariffPlanName">
                <th mat-header-cell *matHeaderCellDef>Plan</th>
                <td mat-cell *matCellDef="let row">{{ row.tariffPlanName }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [ngClass]="getStatusClass(row.status)">
                    {{ row.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Requested On</th>
                <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'medium' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button matTooltip="View Details" (click)="viewRequestDetails(row)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Cancel Request" color="warn" 
                          *ngIf="row.status === 'Pending'" (click)="cancelRequest(row)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="requestColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: requestColumns;"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      margin-bottom: 1.5rem;
      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.5); }
    }

    .tab-icon { margin-right: 8px; }

    .tab-content { padding: 1.5rem 0; }

    ::ng-deep .mat-mdc-tab-group {
      .mat-mdc-tab-header {
        background: rgba(255,255,255,0.03);
        border-radius: 12px 12px 0 0;
        border: 1px solid rgba(255,255,255,0.08);
        border-bottom: none;
      }
      .mat-mdc-tab-labels {
        .mat-mdc-tab {
          color: rgba(255,255,255,0.5);
          &.mdc-tab--active { color: #00D2FF; }
        }
      }
      .mdc-tab-indicator__content--underline {
        border-color: #00D2FF !important;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: rgba(255,255,255,0.5);
      ::ng-deep .mat-mdc-progress-spinner {
        --mdc-circular-progress-active-indicator-color: #00D2FF;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      text-align: center;
      color: rgba(255,255,255,0.5);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
        color: #00D2FF;
      }
      h3 { margin: 0 0 0.5rem; color: rgba(255,255,255,0.95); }
      p { margin: 0; }
    }

    .utilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .utility-card {
      background: rgba(255,255,255,0.03) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08) !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;

      .utility-icon {
        background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%);
        color: #0a0a0f;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 48px;
        height: 48px;
      }

      ::ng-deep .mat-mdc-card-title {
        color: rgba(255,255,255,0.95) !important;
      }

      .description {
        color: rgba(255,255,255,0.5);
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }

      .tariff-section {
        padding-top: 1rem;

        h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #00D2FF;
        }
      }

      .tariff-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tariff-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
        font-size: 0.875rem;
        color: rgba(255,255,255,0.7);

        .rate {
          color: #00F260;
          font-weight: 600;
        }
      }

      mat-card-actions {
        padding: 1rem 1.5rem;
        button {
          background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%) !important;
          color: #0a0a0f !important;
          font-weight: 600;
        }
      }
    }

    .requests-table {
      width: 100%;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      overflow: hidden;

      ::ng-deep {
        .mat-mdc-header-row {
          background: rgba(0,210,255,0.1);
        }
        .mat-mdc-header-cell {
          color: #00D2FF;
          font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .mat-mdc-row {
          background: transparent;
          &:hover { background: rgba(255,255,255,0.03); }
        }
        .mat-mdc-cell {
          color: rgba(255,255,255,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
      }
    }

    .request-number {
      font-family: 'Fira Code', monospace;
      font-weight: 600;
      color: #00D2FF;
    }

    .utility-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      mat-icon { color: #00D2FF; font-size: 20px; }
    }

    mat-chip {
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
  `]
})
export class RequestUtilityComponent implements OnInit {
  availableUtilities: AvailableUtilityDto[] = [];
  myRequests: ConnectionRequestListDto[] = [];
  requestsDataSource = new MatTableDataSource<ConnectionRequestListDto>([]);
  requestColumns = ['requestNumber', 'utilityTypeName', 'tariffPlanName', 'status', 'createdAt', 'actions'];

  loadingUtilities = false;
  loadingRequests = false;

  constructor(
    private connectionRequestsService: ConnectionRequestsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    configureCaseInsensitiveSort(this.requestsDataSource);
  }

  ngOnInit(): void {
    this.loadAvailableUtilities();
    this.loadMyRequests();
  }

  loadAvailableUtilities(): void {
    this.loadingUtilities = true;
    this.connectionRequestsService.getAvailableUtilities().subscribe({
      next: (response) => {
        this.availableUtilities = response.data || [];
        this.loadingUtilities = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingUtilities = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMyRequests(): void {
    this.loadingRequests = true;
    this.connectionRequestsService.getMyRequests().subscribe({
      next: (response) => {
        this.myRequests = response.data || [];
        this.requestsDataSource.data = this.myRequests;
        this.loadingRequests = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingRequests = false;
        this.cdr.detectChanges();
      }
    });
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    return 'settings';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  openRequestDialog(utility: AvailableUtilityDto): void {
    const dialogRef = this.dialog.open(CreateRequestDialogComponent, {
      width: '500px',
      data: utility
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAvailableUtilities();
        this.loadMyRequests();
      }
    });
  }

  viewRequestDetails(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        this.dialog.open(RequestDetailsDialogComponent, {
          width: '500px',
          data: response.data
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }

  cancelRequest(request: ConnectionRequestListDto): void {
    if (confirm(`Are you sure you want to cancel request ${request.requestNumber}?`)) {
      this.connectionRequestsService.cancelRequest(request.id).subscribe({
        next: () => {
          this.snackBar.open('Request cancelled successfully', 'Close', { duration: 3000 });
          this.loadAvailableUtilities();
          this.loadMyRequests();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to cancel request', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

// Dialog to create a new connection request
@Component({
  selector: 'app-create-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">{{ getUtilityIcon(data.utilityTypeName) }}</mat-icon>
      Request {{ data.utilityTypeName }} Connection
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Tariff Plan</mat-label>
          <mat-select formControlName="tariffPlanId" required>
            <mat-option *ngFor="let plan of data.tariffPlans" [value]="plan.id">
              {{ plan.name }} - ₹{{ plan.ratePerUnit }}/{{ data.unitOfMeasurement }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('tariffPlanId')?.hasError('required')">
            Please select a tariff plan
          </mat-error>
        </mat-form-field>

        <div class="plan-details" *ngIf="selectedPlan">
          <h4>Plan Details</h4>
          <div class="detail-row">
            <span>Rate per Unit:</span>
            <strong>₹{{ selectedPlan.ratePerUnit }}</strong>
          </div>
          <div class="detail-row">
            <span>Fixed Charges:</span>
            <strong>₹{{ selectedPlan.fixedCharges }}</strong>
          </div>
          <div class="detail-row">
            <span>Tax:</span>
            <strong>{{ selectedPlan.taxPercentage }}%</strong>
          </div>
          <p class="plan-description" *ngIf="selectedPlan.description">{{ selectedPlan.description }}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Load Sanctioned (Optional)</mat-label>
          <input matInput type="number" formControlName="loadSanctioned" placeholder="e.g., 5 kW">
          <mat-hint>Applicable for electricity connections</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Installation Address (Optional)</mat-label>
          <textarea matInput formControlName="installationAddress" rows="2" 
                    placeholder="Enter specific installation address if different from registered address"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks (Optional)</mat-label>
          <textarea matInput formControlName="remarks" rows="2" 
                    placeholder="Any additional information or special requirements"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || submitting" (click)="submit()">
        <mat-icon>send</mat-icon>
        {{ submitting ? 'Submitting...' : 'Submit Request' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

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

    .full-width { width: 100%; margin-bottom: 1rem; }

    .plan-details {
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 1rem;
      margin-bottom: 1rem;

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: #00D2FF;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.875rem;

        span { color: rgba(255,255,255,0.5); }
        strong { color: rgba(255,255,255,0.95); }
      }

      .plan-description {
        margin: 0.75rem 0 0;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.08);
        font-size: 0.8rem;
        color: rgba(255,255,255,0.5);
      }
    }

    ::ng-deep {
      .mat-mdc-form-field {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.2);
          --mdc-outlined-text-field-hover-outline-color: rgba(0,210,255,0.5);
          --mdc-outlined-text-field-focus-outline-color: #00D2FF;
          --mdc-outlined-text-field-label-text-color: rgba(255,255,255,0.5);
          --mdc-outlined-text-field-focus-label-text-color: #00D2FF;
        }
        .mdc-notched-outline__notch {
          border-right: none;
        }
        input, textarea, .mat-mdc-select-value {
          color: rgba(255,255,255,0.95) !important;
        }
      }
      .mat-mdc-dialog-actions button[mat-raised-button] {
        background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%) !important;
        color: #0a0a0f !important;
        font-weight: 600;
      }
    }
  `]
})
export class CreateRequestDialogComponent {
  form: FormGroup;
  submitting = false;
  selectedPlan: AvailableTariffPlanDto | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateRequestDialogComponent>,
    private connectionRequestsService: ConnectionRequestsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: AvailableUtilityDto
  ) {
    this.form = this.fb.group({
      tariffPlanId: ['', Validators.required],
      loadSanctioned: [null],
      installationAddress: [''],
      remarks: ['']
    });

    this.form.get('tariffPlanId')?.valueChanges.subscribe(planId => {
      this.selectedPlan = this.data.tariffPlans.find(p => p.id === planId) || null;
    });
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    return 'settings';
  }

  submit(): void {
    if (this.form.invalid) return;

    this.submitting = true;
    const payload: CreateConnectionRequestDto = {
      utilityTypeId: this.data.utilityTypeId,
      tariffPlanId: this.form.value.tariffPlanId,
      loadSanctioned: this.form.value.loadSanctioned,
      installationAddress: this.form.value.installationAddress,
      remarks: this.form.value.remarks
    };

    this.connectionRequestsService.createRequest(payload).subscribe({
      next: () => {
        this.snackBar.open('Connection request submitted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Failed to submit request', 'Close', { duration: 3000 });
      }
    });
  }
}

// Dialog to view request details
@Component({
  selector: 'app-request-details-dialog',
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
          <span>Your Remarks:</span>
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
    :host {
      display: block;
    }

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
export class RequestDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto) {}

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}
