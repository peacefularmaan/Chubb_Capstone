import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { ConnectionsService } from '../../../core/services/connections.service';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { CreateMeterReadingRequest, UtilityType } from '../../../core/models';

interface BillingPeriod {
  label: string;
  month: number; // Starting month of the period
}

@Component({
  selector: 'app-reading-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <button mat-icon-button class="back-btn" routerLink="/meter-readings">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="title-row">
            <div class="page-icon">
              <mat-icon>{{ isEditMode ? 'edit_note' : 'speed' }}</mat-icon>
            </div>
            <div class="title-text">
              <h1>{{ isEditMode ? 'Edit Meter Reading' : 'New Meter Reading' }}</h1>
              <p>{{ isEditMode ? 'Update the reading details below' : 'Record a new meter reading for a connection' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-card">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Loading data...</span>
      </div>

      <!-- Main Form -->
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <!-- Connection Selection Section -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <mat-icon>electrical_services</mat-icon>
            </div>
            <div class="section-title">
              <h3>Connection Details</h3>
              <p>Select the connection for this reading</p>
            </div>
          </div>
          <div class="section-body">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Connection</mat-label>
              <mat-select formControlName="connectionId" (selectionChange)="onConnectionChange($event.value)">
                <mat-option *ngFor="let conn of connections" [value]="conn.id">
                  <div class="connection-option">
                    <span class="conn-number">{{ conn.connectionNumber }}</span>
                    <span class="conn-divider">•</span>
                    <span class="conn-consumer">{{ conn.consumerName }}</span>
                    <span class="conn-utility" [class]="getUtilityClass(conn.utilityType)">{{ conn.utilityType }}</span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('connectionId')?.hasError('required')">
                Connection is required
              </mat-error>
            </mat-form-field>

            <!-- Billing Cycle Info Badge -->
            <div class="billing-cycle-badge" *ngIf="selectedUtilityType">
              <mat-icon>event_repeat</mat-icon>
              <span class="badge-label">Billing Cycle:</span>
              <span class="badge-value" [ngClass]="'cycle-' + selectedUtilityType.billingCycleMonths">
                {{ getBillingCycleLabel(selectedUtilityType.billingCycleMonths) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Billing Period Section -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon purple">
              <mat-icon>calendar_month</mat-icon>
            </div>
            <div class="section-title">
              <h3>Billing Period</h3>
              <p>Specify the billing month and year</p>
            </div>
          </div>
          <div class="section-body">
            <div class="form-grid two-col">
              <mat-form-field appearance="outline">
                <mat-label>Billing Period</mat-label>
                <mat-select formControlName="billingMonth">
                  <mat-option *ngFor="let period of billingPeriods" [value]="period.month">
                    {{ period.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('billingMonth')?.hasError('required')">Required</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Billing Year</mat-label>
                <input matInput type="number" formControlName="billingYear">
                <mat-error *ngIf="form.get('billingYear')?.hasError('required')">Required</mat-error>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Meter Reading Section -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon yellow">
              <mat-icon>speed</mat-icon>
            </div>
            <div class="section-title">
              <h3>Meter Reading</h3>
              <p>Enter the current meter reading value</p>
            </div>
          </div>
          <div class="section-body">
            <div class="form-grid two-col">
              <div class="reading-field previous">
                <label>Previous Reading</label>
                <div class="reading-value">
                  <mat-icon>history</mat-icon>
                  <span>{{ form.get('previousReading')?.value | number:'1.0-2' }}</span>
                  <span class="unit">units</span>
                </div>
                <input type="hidden" formControlName="previousReading">
              </div>

              <mat-form-field appearance="outline" class="current-reading-field">
                <mat-label>Current Reading</mat-label>
                <input matInput type="number" formControlName="currentReading" step="any" placeholder="Enter current meter value">
                <mat-icon matSuffix class="input-icon">dialpad</mat-icon>
                <mat-error *ngIf="form.get('currentReading')?.hasError('required')">Required</mat-error>
                <mat-error *ngIf="form.get('currentReading')?.hasError('min')">Must be ≥ previous reading</mat-error>
              </mat-form-field>
            </div>

            <!-- Consumption Display -->
            <div class="consumption-display" *ngIf="unitsConsumed !== null && unitsConsumed >= 0">
              <div class="consumption-card">
                <div class="consumption-icon">
                  <mat-icon>bolt</mat-icon>
                </div>
                <div class="consumption-content">
                  <span class="consumption-label">Units Consumed</span>
                  <span class="consumption-value">{{ unitsConsumed | number:'1.2-2' }}</span>
                </div>
                <div class="consumption-badge">
                  <mat-icon>check_circle</mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Details Section -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon cyan">
              <mat-icon>info</mat-icon>
            </div>
            <div class="section-title">
              <h3>Additional Details</h3>
              <p>Reading date and optional notes</p>
            </div>
          </div>
          <div class="section-body">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reading Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="readingDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="form.get('readingDate')?.hasError('required')">Required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (Optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3" placeholder="Add any relevant notes about this reading..."></textarea>
              <mat-icon matPrefix class="textarea-icon">notes</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-button type="button" class="cancel-btn" routerLink="/meter-readings">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          <button mat-flat-button type="submit" class="submit-btn" [disabled]="form.invalid || saving">
            <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
            <ng-container *ngIf="!saving">
              <mat-icon>{{ isEditMode ? 'save' : 'add_circle' }}</mat-icon>
              {{ isEditMode ? 'Update' : 'Save' }} Reading
            </ng-container>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .back-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0,210,255,0.1);
        border-color: rgba(0,210,255,0.3);
        color: #00D2FF;
      }
    }

    .header-content { flex: 1; }

    .title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .page-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 245, 160, 0.3);

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: #0a0a0a;
      }
    }

    .title-text h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .title-text p {
      margin: 0.25rem 0 0;
      color: rgba(255,255,255,0.5);
      font-size: 0.8125rem;
    }

    /* Loading State */
    .loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4rem 2rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      color: rgba(255,255,255,0.5);

      ::ng-deep .mat-mdc-progress-spinner {
        --mdc-circular-progress-active-indicator-color: #00D9F5;
      }
    }

    /* Form Container */
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Form Sections */
    .form-section {
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .section-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(0,245,160,0.15) 0%, rgba(0,217,245,0.15) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #00F5A0;
      }

      &.purple {
        background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%);
        mat-icon { color: #667eea; }
      }

      &.yellow {
        background: rgba(255,217,61,0.15);
        mat-icon { color: #FFD93D; }
      }

      &.cyan {
        background: rgba(0,217,245,0.15);
        mat-icon { color: #00D9F5; }
      }
    }

    .section-title {
      flex: 1;

      h3 {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #fff;
      }

      p {
        margin: 0.125rem 0 0;
        font-size: 0.75rem;
        color: rgba(255,255,255,0.4);
      }
    }

    .section-body {
      padding: 1.25rem;
    }

    .full-width { width: 100%; }

    .form-grid {
      display: grid;
      gap: 1rem;

      &.two-col {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Connection Option Styling */
    .connection-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .conn-number {
      font-weight: 600;
      color: #00D9F5;
    }

    .conn-divider {
      color: rgba(255,255,255,0.3);
    }

    .conn-consumer {
      color: rgba(255,255,255,0.9);
    }

    .conn-utility {
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: 0.25rem;

      &.electricity {
        background: rgba(255,193,7,0.15);
        color: #FFD93D;
      }
      &.water {
        background: rgba(0,150,255,0.15);
        color: #00A0FF;
      }
      &.gas {
        background: rgba(255,107,107,0.15);
        color: #FF6B6B;
      }
    }

    /* Billing Cycle Badge */
    .billing-cycle-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      margin-top: 0.75rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #00D9F5;
      }

      .badge-label {
        color: rgba(255,255,255,0.5);
        font-size: 0.8125rem;
      }

      .badge-value {
        font-weight: 600;
        font-size: 0.8125rem;
        padding: 0.1875rem 0.625rem;
        border-radius: 6px;

        &.cycle-1 {
          background: rgba(0,245,160,0.15);
          color: #00F5A0;
        }
        &.cycle-2 {
          background: rgba(0,210,255,0.15);
          color: #00D9F5;
        }
        &.cycle-3 {
          background: rgba(255,217,61,0.15);
          color: #FFD93D;
        }
      }
    }

    /* Previous Reading Display */
    .reading-field.previous {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 0.875rem 1rem;

      label {
        display: block;
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .reading-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: rgba(255,255,255,0.4);
        }

        span {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
        }

        .unit {
          font-size: 0.8125rem;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
        }
      }
    }

    .current-reading-field {
      .input-icon {
        color: rgba(255,255,255,0.4);
      }
    }

    /* Consumption Display */
    .consumption-display {
      margin-top: 1rem;
    }

    .consumption-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(0,245,160,0.1) 0%, rgba(0,217,245,0.1) 100%);
      border: 1px solid rgba(0,245,160,0.2);
      border-radius: 12px;
    }

    .consumption-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,245,160,0.3);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #0a0a0a;
      }
    }

    .consumption-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      .consumption-label {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .consumption-value {
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .consumption-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,245,160,0.15);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #00F5A0;
      }
    }

    /* Textarea Icon */
    .textarea-icon {
      color: rgba(255,255,255,0.3);
      margin-right: 0.5rem;
      align-self: flex-start;
      margin-top: 0.75rem;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    .cancel-btn {
      color: rgba(255,255,255,0.6);
      display: flex;
      align-items: center;
      gap: 0.375rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: rgba(255,255,255,0.9);
        background: rgba(255,255,255,0.05);
      }
    }

    .submit-btn {
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      color: #0a0a0a;
      font-weight: 600;
      padding: 0 1.5rem;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(0, 245, 160, 0.3);
      transition: all 0.3s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 245, 160, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      ::ng-deep .mat-mdc-progress-spinner {
        --mdc-circular-progress-active-indicator-color: #0a0a0a;
      }
    }

    /* Material Form Overrides */
    ::ng-deep {
      .mat-mdc-form-field {
        .mdc-text-field--outlined {
          background: rgba(255,255,255,0.03) !important;
        }

        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: rgba(255,255,255,0.1) !important;
        }

        &.mat-focused .mdc-notched-outline__leading,
        &.mat-focused .mdc-notched-outline__notch,
        &.mat-focused .mdc-notched-outline__trailing {
          border-color: #00D9F5 !important;
        }

        input, textarea, .mat-mdc-select-value {
          color: rgba(255,255,255,0.95) !important;
        }

        .mdc-floating-label {
          color: rgba(255,255,255,0.5) !important;
        }

        .mat-mdc-select-arrow {
          color: rgba(255,255,255,0.5) !important;
        }
      }

      .mat-datepicker-toggle {
        color: rgba(255,255,255,0.5);
      }
    }

    /* Responsive */
    @media (max-width: 600px) {
      .page-container { padding: 1rem; }

      .title-row {
        flex-wrap: wrap;
      }

      .form-grid.two-col {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .submit-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ReadingEntryComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  loading = false;
  saving = false;
  readingId: number | null = null;

  connections: any[] = [];
  selectedConnection: any = null;
  selectedUtilityType: UtilityType | null = null;
  utilityTypes: UtilityType[] = [];
  billingPeriods: BillingPeriod[] = [];

  // Month names for labels
  private monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(
    private fb: FormBuilder,
    private meterReadingsService: MeterReadingsService,
    private connectionsService: ConnectionsService,
    private utilityTypesService: UtilityTypesService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.readingId = +id;
      this.loading = true;
      // Load dropdowns first, then load reading
      this.loadDropdownsAndReading();
    } else {
      this.loadDropdowns();
    }
  }

  initForm(): void {
    const now = new Date();
    this.form = this.fb.group({
      connectionId: [null, Validators.required],
      billingMonth: [now.getMonth() + 1, Validators.required],
      billingYear: [now.getFullYear(), Validators.required],
      previousReading: [{ value: 0, disabled: true }],
      currentReading: [null, [Validators.required, Validators.min(0)]],
      readingDate: [new Date(), Validators.required],
      notes: ['']
    });

    // Update min validator when previous reading changes
    this.form.get('previousReading')?.valueChanges.subscribe(prev => {
      this.form.get('currentReading')?.setValidators([
        Validators.required,
        Validators.min(prev || 0)
      ]);
      this.form.get('currentReading')?.updateValueAndValidity();
    });

    // Initialize with monthly billing periods (default)
    this.setBillingPeriods(1);
  }

  get unitsConsumed(): number | null {
    const prev = this.form.get('previousReading')?.value || 0;
    const curr = this.form.get('currentReading')?.value;
    if (curr !== null && curr !== undefined && curr >= prev) {
      return curr - prev;
    }
    return null;
  }

  loadDropdowns(): void {
    // Load connections
    this.connectionsService.getAll({ pageSize: 1000, pageNumber: 1 }).subscribe({
      next: (result) => {
        this.connections = result.data || [];
      }
    });

    // Load utility types for billing cycle info
    this.utilityTypesService.getAll().subscribe({
      next: (result) => {
        this.utilityTypes = result.data || [];
      }
    });
  }

  loadDropdownsAndReading(): void {
    // Load both connections and utility types first, then load reading
    forkJoin({
      connections: this.connectionsService.getAll({ pageSize: 1000, pageNumber: 1 }),
      utilityTypes: this.utilityTypesService.getAll()
    }).subscribe({
      next: (result) => {
        this.connections = result.connections.data || [];
        this.utilityTypes = result.utilityTypes.data || [];
        // Now load the reading
        this.loadReading();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
      }
    });
  }

  loadReading(): void {
    if (!this.readingId) return;
    this.loading = true;

    this.meterReadingsService.getById(this.readingId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const reading = response.data;
          
          // First, trigger connection change to set up billing periods dropdown
          this.onConnectionChange(reading.connectionId);
          
          // Then patch form values (including billingMonth) after billing periods are set
          this.form.patchValue({
            connectionId: reading.connectionId,
            billingMonth: reading.billingMonth,
            billingYear: reading.billingYear,
            previousReading: reading.previousReading,
            currentReading: reading.currentReading,
            readingDate: new Date(reading.readingDate),
            notes: reading.notes || ''
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error loading reading', 'Close', { duration: 3000 });
      }
    });
  }

  onConnectionChange(connectionId: number, skipPreviousReadingFetch: boolean = false): void {
    const conn = this.connections.find(c => c.id === connectionId);
    if (conn) {
      this.selectedConnection = conn;
      
      // Find utility type for this connection
      const utilityType = this.utilityTypes.find(u => u.id === conn.utilityTypeId);
      this.selectedUtilityType = utilityType || null;
      
      // Update billing periods based on utility's billing cycle
      if (utilityType) {
        this.setBillingPeriods(utilityType.billingCycleMonths);
        // Only set current period for new readings, not when editing
        if (!this.isEditMode) {
          const currentPeriod = this.getCurrentBillingPeriod(utilityType.billingCycleMonths);
          this.form.patchValue({ billingMonth: currentPeriod });
        }
      }

      // Only fetch last reading for NEW readings, not when editing
      // When editing, the previousReading is already loaded from the stored data
      if (!skipPreviousReadingFetch && !this.isEditMode) {
        this.meterReadingsService.getLastReading(connectionId).subscribe({
          next: (response) => {
            if (response.success && response.data !== null && response.data !== undefined) {
              // Backend returns decimal directly, not a MeterReading object
              this.form.patchValue({ previousReading: response.data });
            } else {
              this.form.patchValue({ previousReading: conn.initialMeterReading || 0 });
            }
          },
          error: () => {
            this.form.patchValue({ previousReading: conn.initialMeterReading || 0 });
          }
        });
      }
      
      this.cdr.detectChanges();
    }
  }

  setBillingPeriods(cycleMonths: number): void {
    this.billingPeriods = [];
    
    if (cycleMonths === 1) {
      // Monthly: Jan, Feb, Mar, etc.
      for (let i = 0; i < 12; i++) {
        this.billingPeriods.push({
          label: this.monthNames[i],
          month: i + 1
        });
      }
    } else if (cycleMonths === 2) {
      // Bi-Monthly: Jan-Feb, Mar-Apr, etc.
      for (let i = 0; i < 12; i += 2) {
        this.billingPeriods.push({
          label: `${this.monthNames[i]}-${this.monthNames[i + 1]}`,
          month: i + 1
        });
      }
    } else if (cycleMonths === 3) {
      // Quarterly: Q1, Q2, Q3, Q4
      const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
      for (let i = 0; i < 4; i++) {
        this.billingPeriods.push({
          label: quarters[i],
          month: i * 3 + 1
        });
      }
    }
  }

  getCurrentBillingPeriod(cycleMonths: number): number {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (cycleMonths === 1) {
      return currentMonth;
    } else if (cycleMonths === 2) {
      // Return the starting month of the bi-monthly period
      return currentMonth % 2 === 0 ? currentMonth - 1 : currentMonth;
    } else if (cycleMonths === 3) {
      // Return the starting month of the quarter
      return Math.floor((currentMonth - 1) / 3) * 3 + 1;
    }
    return currentMonth;
  }

  getBillingCycleLabel(months: number): string {
    switch (months) {
      case 1: return 'Monthly';
      case 2: return 'Bi-Monthly';
      case 3: return 'Quarterly';
      default: return `${months} Months`;
    }
  }

  getUtilityClass(utilityTypeName: string | undefined): string {
    if (!utilityTypeName) return '';
    const name = utilityTypeName.toLowerCase();
    if (name.includes('electric')) return 'electricity';
    if (name.includes('water')) return 'water';
    if (name.includes('gas')) return 'gas';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.getRawValue();
    
    // Format date as YYYY-MM-DD to avoid timezone issues
    const date = formValue.readingDate;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const request: CreateMeterReadingRequest = {
      connectionId: formValue.connectionId,
      billingMonth: formValue.billingMonth,
      billingYear: formValue.billingYear,
      currentReading: formValue.currentReading,
      readingDate: formattedDate,
      notes: formValue.notes || undefined
    };

    const operation = this.isEditMode
      ? this.meterReadingsService.update(this.readingId!, {
          currentReading: request.currentReading,
          readingDate: request.readingDate,
          billingMonth: request.billingMonth,
          billingYear: request.billingYear,
          notes: request.notes
        })
      : this.meterReadingsService.create(request);

    operation.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open(
            `Reading ${this.isEditMode ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/meter-readings']);
        } else {
          this.snackBar.open(response.message || 'Error saving reading', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error saving reading', 'Close', { duration: 3000 });
      }
    });
  }
}
