import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BillsService } from '../../../core/services/bills.service';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { BillingCyclesService } from '../../../core/services/billing-cycles.service';
import { BillingCycle, MeterReadingListItem, GenerateBillRequest, GenerateBulkBillsRequest } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-generate-bill',
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
    MatRadioModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  template: `
    <div class="page-container">
      <!-- Professional Page Header -->
      <div class="page-header">
        <button mat-icon-button class="back-btn" routerLink="/billing">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="title-row">
            <div class="page-icon">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div class="title-text">
              <h1>Generate Bills</h1>
              <p>Create bills for meter readings - single or bulk generation</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Side by Side Cards Layout -->
      <div class="cards-grid">
        <!-- Single Bill Card -->
        <div class="generation-card" [class.active]="activeTab === 'single'" (click)="activeTab = 'single'">
          <div class="card-glow single"></div>
          <div class="card-inner">
            <div class="card-header">
              <div class="card-icon single">
                <mat-icon>receipt</mat-icon>
              </div>
              <div class="card-badge" *ngIf="unbilledReadings.length > 0">
                {{ unbilledReadings.length }}
              </div>
            </div>
            <h2>Single Bill</h2>
            <p>Generate bill for one specific meter reading</p>
            <div class="card-features">
              <div class="feature"><mat-icon>check_circle</mat-icon> Individual control</div>
              <div class="feature"><mat-icon>check_circle</mat-icon> Preview before generate</div>
              <div class="feature"><mat-icon>check_circle</mat-icon> Ideal for corrections</div>
            </div>
            <div class="card-selector">
              <mat-icon>{{ activeTab === 'single' ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
              <span>{{ activeTab === 'single' ? 'Selected' : 'Select' }}</span>
            </div>
          </div>
        </div>

        <!-- Bulk Generate Card -->
        <div class="generation-card" [class.active]="activeTab === 'bulk'" (click)="activeTab = 'bulk'">
          <div class="card-glow bulk"></div>
          <div class="card-inner">
            <div class="card-header">
              <div class="card-icon bulk">
                <mat-icon>dynamic_feed</mat-icon>
              </div>
            </div>
            <h2>Bulk Generate</h2>
            <p>Generate all bills for a billing cycle at once</p>
            <div class="card-features">
              <div class="feature"><mat-icon>check_circle</mat-icon> Process all readings</div>
              <div class="feature"><mat-icon>check_circle</mat-icon> End of cycle workflow</div>
              <div class="feature"><mat-icon>check_circle</mat-icon> Time-saving automation</div>
            </div>
            <div class="card-selector">
              <mat-icon>{{ activeTab === 'bulk' ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
              <span>{{ activeTab === 'bulk' ? 'Selected' : 'Select' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="form-section-container">
        <!-- Single Bill Form -->
        <div class="form-card" *ngIf="activeTab === 'single'">
          <div class="form-card-header">
            <div class="form-icon single">
              <mat-icon>receipt</mat-icon>
            </div>
            <div>
              <h3>Generate Single Bill</h3>
              <p>Select an unbilled meter reading to generate a bill</p>
            </div>
          </div>

          <form [formGroup]="singleForm" (ngSubmit)="generateSingle()" *ngIf="unbilledReadings.length > 0">
            <div class="form-body">
              <label class="field-label">
                <mat-icon>speed</mat-icon>
                Select Unbilled Reading
              </label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-select formControlName="meterReadingId" placeholder="Choose a meter reading">
                  <mat-option *ngFor="let reading of unbilledReadings" [value]="reading.id">
                    <div class="reading-option">
                      <span class="reading-connection">{{ reading.connectionNumber }}</span>
                      <span class="reading-divider">•</span>
                      <span class="reading-consumer">{{ reading.consumerName }}</span>
                      <span class="reading-utility" [class]="getUtilityClass(reading.utilityTypeName || '')">
                        {{ reading.utilityTypeName }}
                      </span>
                      <span class="reading-units">{{ reading.unitsConsumed | number:'1.2-2' }} units</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="singleForm.get('meterReadingId')?.hasError('required')">
                  Please select a meter reading
                </mat-error>
              </mat-form-field>

              <!-- Selected Reading Preview -->
              <div class="selected-preview" *ngIf="getSelectedReading()">
                <div class="preview-header">
                  <mat-icon>visibility</mat-icon>
                  <span>Reading Details</span>
                </div>
                <div class="preview-grid">
                  <div class="preview-item">
                    <span class="label">Connection</span>
                    <span class="value">{{ getSelectedReading()?.connectionNumber }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Consumer</span>
                    <span class="value">{{ getSelectedReading()?.consumerName }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Utility Type</span>
                    <span class="value utility-badge" [class]="getUtilityClass(getSelectedReading()?.utilityTypeName || '')">
                      {{ getSelectedReading()?.utilityTypeName }}
                    </span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Units Consumed</span>
                    <span class="value highlight">{{ getSelectedReading()?.unitsConsumed | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <div class="info-banner">
                <mat-icon>schedule</mat-icon>
                <span>Due date will be automatically set based on billing cycle configuration.</span>
              </div>
            </div>

            <div class="form-footer">
              <button mat-button type="button" class="cancel-btn" routerLink="/billing">
                Cancel
              </button>
              <button mat-flat-button type="submit" class="generate-btn single"
                      [disabled]="singleForm.invalid || generatingSingle">
                <mat-spinner *ngIf="generatingSingle" diameter="20"></mat-spinner>
                <ng-container *ngIf="!generatingSingle">
                  <mat-icon>add_circle</mat-icon>
                  Generate Bill
                </ng-container>
              </button>
            </div>
          </form>

          <!-- Empty State for Single -->
          <div class="empty-state" *ngIf="unbilledReadings.length === 0">
            <div class="empty-icon">
              <mat-icon>inbox</mat-icon>
            </div>
            <h3>No Unbilled Readings</h3>
            <p>Record meter readings first to generate bills.</p>
            <button mat-flat-button class="add-btn" routerLink="/meter-readings/new">
              <mat-icon>add</mat-icon>
              Add Meter Reading
            </button>
          </div>
        </div>

        <!-- Bulk Generate Form -->
        <div class="form-card" *ngIf="activeTab === 'bulk'">
          <div class="form-card-header">
            <div class="form-icon bulk">
              <mat-icon>dynamic_feed</mat-icon>
            </div>
            <div>
              <h3>Bulk Generate Bills</h3>
              <p>Generate bills for all unbilled readings in a cycle</p>
            </div>
          </div>

          <form [formGroup]="bulkForm" (ngSubmit)="generateBulk()">
            <div class="form-body">
              <label class="field-label">
                <mat-icon>event_repeat</mat-icon>
                Select Billing Cycle
              </label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-select formControlName="billingCycleId" placeholder="Choose a billing cycle">
                  <mat-option *ngFor="let cycle of billingCycles" [value]="cycle.id">
                    <div class="cycle-option">
                      <span class="cycle-name">{{ cycle.name }}</span>
                      <span class="cycle-period">{{ getMonthName(cycle.month) }} {{ cycle.year }}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="bulkForm.get('billingCycleId')?.hasError('required')">
                  Please select a billing cycle
                </mat-error>
              </mat-form-field>

              <!-- Selected Cycle Preview -->
              <div class="selected-preview bulk" *ngIf="getSelectedCycle()">
                <div class="preview-header">
                  <mat-icon>calendar_month</mat-icon>
                  <span>Cycle Details</span>
                </div>
                <div class="preview-grid">
                  <div class="preview-item">
                    <span class="label">Cycle Name</span>
                    <span class="value">{{ getSelectedCycle()?.name }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Billing Period</span>
                    <span class="value">{{ getMonthName(getSelectedCycle()?.month || 0) }} {{ getSelectedCycle()?.year }}</span>
                  </div>
                </div>
              </div>

              <div class="info-banner warning">
                <mat-icon>bolt</mat-icon>
                <span>This will generate bills for ALL unbilled readings in the selected cycle.</span>
              </div>
            </div>

            <div class="form-footer">
              <button mat-button type="button" class="cancel-btn" routerLink="/billing">
                Cancel
              </button>
              <button mat-flat-button type="submit" class="generate-btn bulk"
                      [disabled]="bulkForm.invalid || generatingBulk">
                <mat-spinner *ngIf="generatingBulk" diameter="20"></mat-spinner>
                <ng-container *ngIf="!generatingBulk">
                  <mat-icon>playlist_add_check</mat-icon>
                  Generate All Bills
                </ng-container>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success/Error Popup Overlay -->
      <div class="popup-overlay" *ngIf="generationResult" (click)="generationResult = null">
        <div class="popup-card" [class.success]="generationResult.success" [class.error]="!generationResult.success" (click)="$event.stopPropagation()">
          <div class="popup-icon-wrapper" [class.success]="generationResult.success" [class.error]="!generationResult.success">
            <mat-icon *ngIf="generationResult.success">check_circle</mat-icon>
            <mat-icon *ngIf="!generationResult.success">error</mat-icon>
          </div>
          <h3>{{ generationResult.title }}</h3>
          <p>{{ generationResult.message }}</p>
          <div class="popup-actions">
            <button mat-flat-button class="view-btn" routerLink="/billing" *ngIf="generationResult.success">
              <mat-icon>receipt</mat-icon>
              View Bills
            </button>
            <button mat-button class="dismiss-btn" (click)="generationResult = null">
              {{ generationResult.success ? 'Close' : 'Try Again' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      animation: fadeIn 0.5s ease-out;
      max-width: 1200px;
      margin: 0 auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
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

    .header-content { flex: 1; min-width: 280px; }

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

    .header-stats {
      display: flex;
      gap: 0.5rem;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      color: rgba(255,255,255,0.8);
      font-size: 0.8125rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #00D9F5;
      }
    }

    /* Side by Side Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .generation-card {
      position: relative;
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover {
        border-color: rgba(255,255,255,0.12);
        transform: translateY(-2px);
      }

      &.active {
        border-color: rgba(0,245,160,0.4);
        background: rgba(0,245,160,0.03);
      }

      &.active .card-glow.single {
        opacity: 1;
      }

      &.active .card-glow.bulk {
        opacity: 1;
      }
    }

    .card-glow {
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;

      &.single {
        background: radial-gradient(circle, rgba(0,245,160,0.15) 0%, transparent 70%);
      }

      &.bulk {
        background: radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%);
      }
    }

    .card-inner {
      position: relative;
      z-index: 1;
    }

    .generation-card .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      &.single {
        background: linear-gradient(135deg, rgba(0,245,160,0.2) 0%, rgba(0,217,245,0.2) 100%);
        mat-icon { color: #00F5A0; }
      }

      &.bulk {
        background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%);
        mat-icon { color: #667eea; }
      }
    }

    .card-badge {
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      color: #0a0a0a;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      min-width: 24px;
      text-align: center;

      &.bulk {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }
    }

    .generation-card h2 {
      margin: 0 0 0.375rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
    }

    .generation-card > .card-inner > p {
      margin: 0 0 1rem;
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.5);
      line-height: 1.4;
    }

    .card-features {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.6);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #00F5A0;
      }
    }

    .card-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.5);
      transition: all 0.3s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: rgba(255,255,255,0.3);
      }
    }

    .generation-card.active .card-selector {
      background: rgba(0,245,160,0.1);
      color: #00F5A0;

      mat-icon { color: #00F5A0; }
    }

    /* Form Section Container */
    .form-section-container {
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-card {
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      overflow: hidden;
    }

    .form-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.06);

      h3 {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 600;
        color: #fff;
      }

      p {
        margin: 0.125rem 0 0;
        font-size: 0.8125rem;
        color: rgba(255,255,255,0.5);
      }
    }

    .form-icon {
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
      }

      &.single {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        mat-icon { color: #0a0a0a; }
      }

      &.bulk {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        mat-icon { color: #fff; }
      }
    }

    .form-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgba(255,255,255,0.7);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #00D9F5;
      }
    }

    .full-width { width: 100%; }

    /* Reading/Cycle Option Styling */
    .reading-option, .cycle-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .reading-connection {
      font-weight: 600;
      color: #00D9F5;
    }

    .reading-divider {
      color: rgba(255,255,255,0.3);
    }

    .reading-consumer {
      color: rgba(255,255,255,0.9);
    }

    .reading-utility {
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

    .reading-units {
      margin-left: auto;
      color: #00F5A0;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .cycle-name {
      font-weight: 600;
      color: #fff;
    }

    .cycle-period {
      color: rgba(255,255,255,0.5);
      margin-left: 0.5rem;
    }

    /* Selected Preview */
    .selected-preview {
      background: rgba(0,245,160,0.05);
      border: 1px solid rgba(0,245,160,0.15);
      border-radius: 12px;
      padding: 1rem 1.25rem;

      &.bulk {
        background: rgba(102,126,234,0.05);
        border-color: rgba(102,126,234,0.15);

        .preview-header {
          color: #667eea;
        }
      }
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #00F5A0;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1rem;
    }

    .preview-item {
      .label {
        display: block;
        font-size: 0.6875rem;
        color: rgba(255,255,255,0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.25rem;
      }

      .value {
        font-size: 0.9375rem;
        color: #fff;
        font-weight: 500;

        &.highlight {
          color: #00F5A0;
          font-weight: 700;
          font-size: 1.125rem;
        }

        &.utility-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      }
    }

    /* Info Banner */
    .info-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(0,210,255,0.08);
      padding: 0.875rem 1rem;
      border-radius: 10px;
      border-left: 3px solid #00D9F5;
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.7);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #00D9F5;
        flex-shrink: 0;
      }

      &.warning {
        background: rgba(255,193,7,0.08);
        border-left-color: #FFD93D;

        mat-icon { color: #FFD93D; }
      }
    }

    /* Form Footer */
    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: rgba(255,255,255,0.02);
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .cancel-btn {
      color: rgba(255,255,255,0.6);
      padding: 0 1.25rem;

      &:hover {
        color: rgba(255,255,255,0.9);
        background: rgba(255,255,255,0.05);
      }
    }

    .generate-btn {
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      color: #0a0a0a;
      font-weight: 600;
      padding: 0 1.5rem;
      height: 42px;
      border-radius: 10px;
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

      &.bulk {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

        &:hover:not(:disabled) {
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
        }
      }

      &.single {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      }
    }

    ::ng-deep .mat-mdc-spinner circle {
      stroke: #0a0a0a !important;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.25rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
      border: 2px dashed rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: rgba(255,255,255,0.2);
      }
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
    }

    .empty-state p {
      margin: 0 0 1.25rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
    }

    .add-btn {
      background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
      color: #0a0a0a;
      font-weight: 600;
      padding: 0 1.25rem;
      height: 40px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Popup Overlay */
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeInOverlay 0.3s ease-out;
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .popup-card {
      background: rgba(20, 20, 35, 0.98);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 2.5rem 3rem;
      text-align: center;
      max-width: 400px;
      width: 90%;
      animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

      &.success {
        border: 1px solid rgba(0, 245, 160, 0.3);
        box-shadow: 0 0 80px rgba(0, 245, 160, 0.2);
      }

      &.error {
        border: 1px solid rgba(255, 107, 107, 0.3);
        box-shadow: 0 0 80px rgba(255, 107, 107, 0.2);
      }
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.8) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .popup-icon-wrapper {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bounceIn 0.6s ease-out 0.2s both;

      &.success {
        background: rgba(0, 245, 160, 0.15);
        mat-icon { color: #00F5A0; }
      }

      &.error {
        background: rgba(255, 107, 107, 0.15);
        mat-icon { color: #FF6B6B; }
      }

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
    }

    @keyframes bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .popup-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.375rem;
      font-weight: 700;
      color: #fff;
    }

    .popup-card p {
      margin: 0 0 1.5rem;
      font-size: 0.9375rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }

    .popup-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;

      .view-btn {
        background: linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%);
        color: #0a0a0a;
        font-weight: 600;
        padding: 0.75rem 1.75rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 245, 160, 0.35);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 245, 160, 0.45);
        }
      }

      .dismiss-btn {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.875rem;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
        }
      }
    }

    /* Material Form Overrides */
    ::ng-deep .mat-mdc-form-field {
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

      .mat-mdc-select-value,
      .mat-mdc-select-arrow {
        color: rgba(255,255,255,0.9) !important;
      }

      .mdc-floating-label {
        color: rgba(255,255,255,0.5) !important;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-stats {
        width: 100%;
        justify-content: flex-start;
      }
    }

    @media (max-width: 480px) {
      .page-container { padding: 1rem; }

      .generation-card { padding: 1.25rem; }

      .form-body { padding: 1.25rem; }

      .form-footer {
        flex-direction: column;
        padding: 1rem 1.25rem;
      }

      .generate-btn {
        width: 100%;
        justify-content: center;
      }

      .popup-card {
        padding: 2rem 1.5rem;
      }
    }
  `]
})
export class GenerateBillComponent implements OnInit {
  singleForm!: FormGroup;
  bulkForm!: FormGroup;
  
  unbilledReadings: MeterReadingListItem[] = [];
  billingCycles: BillingCycle[] = [];
  
  generatingSingle = false;
  generatingBulk = false;
  
  generationResult: { success: boolean; title: string; message: string } | null = null;
  
  activeTab: 'single' | 'bulk' = 'single';

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private meterReadingsService: MeterReadingsService,
    private billingCyclesService: BillingCyclesService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  initForms(): void {
    // Default due date: 14 days from today
    this.singleForm = this.fb.group({
      meterReadingId: [null, Validators.required]
    });

    this.bulkForm = this.fb.group({
      billingCycleId: [null, Validators.required]
    });
  }

  loadData(): void {
    // Fetch ALL unbilled readings (no month/year filter)
    forkJoin({
      readings: this.meterReadingsService.getUnbilled(),
      cycles: this.billingCyclesService.getAll({ pageSize: 100, pageNumber: 1 })
    }).subscribe({
      next: (result) => {
        console.log('Unbilled readings response:', result.readings);
        this.unbilledReadings = result.readings.data || [];
        this.billingCycles = result.cycles.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data:', err);
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  getSelectedReading(): MeterReadingListItem | null {
    const selectedId = this.singleForm.get('meterReadingId')?.value;
    if (!selectedId) return null;
    return this.unbilledReadings.find(r => r.id === selectedId) || null;
  }

  getSelectedCycle(): BillingCycle | null {
    const selectedId = this.bulkForm.get('billingCycleId')?.value;
    if (!selectedId) return null;
    return this.billingCycles.find(c => c.id === selectedId) || null;
  }

  getUtilityClass(utilityName: string): string {
    const name = utilityName?.toLowerCase() || '';
    if (name.includes('electric')) return 'electricity';
    if (name.includes('water')) return 'water';
    if (name.includes('gas')) return 'gas';
    return '';
  }

  generateSingle(): void {
    if (this.singleForm.invalid) return;

    this.generatingSingle = true;
    this.generationResult = null;

    const selectedReadingId = this.singleForm.value.meterReadingId;

    // First fetch the full reading details to get connectionId
    this.meterReadingsService.getById(selectedReadingId).subscribe({
      next: (readingResponse) => {
        if (!readingResponse.success || !readingResponse.data) {
          this.generationResult = {
            success: false,
            title: 'Error',
            message: 'Failed to fetch reading details'
          };
          this.generatingSingle = false;
          this.cdr.detectChanges();
          return;
        }

        const reading = readingResponse.data;
        const request: GenerateBillRequest = {
          meterReadingId: selectedReadingId,
          connectionId: reading.connectionId,
          billingMonth: reading.billingMonth,
          billingYear: reading.billingYear
        };

        console.log('Generating bill with request:', request);

        this.billsService.generate(request).subscribe({
          next: (response) => {
            this.generatingSingle = false;
            if (response.success) {
              this.generationResult = {
                success: true,
                title: 'Bill Generated Successfully',
                message: `Bill #${response.data?.billNumber} has been generated with amount ₹${response.data?.totalAmount?.toFixed(2)}`
              };
              this.loadData(); // Refresh unbilled readings
            } else {
              this.generationResult = {
                success: false,
                title: 'Generation Failed',
                message: response.message || 'Failed to generate bill'
              };
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.generatingSingle = false;
            console.error('Bill generation error:', err);
            console.error('Error response:', err.error);
            this.generationResult = {
              success: false,
              title: 'Error',
              message: err.error?.message || err.error?.errors?.join(', ') || JSON.stringify(err.error) || 'An error occurred'
            };
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.generatingSingle = false;
        console.error('Error fetching reading:', err);
        this.generationResult = {
          success: false,
          title: 'Error',
          message: 'Failed to fetch reading details'
        };
        this.cdr.detectChanges();
      }
    });
  }

  generateBulk(): void {
    if (this.bulkForm.invalid) return;

    this.generatingBulk = true;
    this.generationResult = null;

    // Find the selected billing cycle to get month and year
    const selectedCycleId = this.bulkForm.value.billingCycleId;
    const selectedCycle = this.billingCycles.find(c => c.id === selectedCycleId);

    if (!selectedCycle) {
      this.generatingBulk = false;
      this.generationResult = {
        success: false,
        title: 'Error',
        message: 'Selected billing cycle not found'
      };
      this.cdr.detectChanges();
      return;
    }

    // Send billingMonth and billingYear as expected by the backend
    const request: GenerateBulkBillsRequest = {
      billingMonth: selectedCycle.month,
      billingYear: selectedCycle.year
    };

    console.log('Generating bulk bills with request:', request);

    this.billsService.generateBulk(request).subscribe({
      next: (response) => {
        this.generatingBulk = false;
        if (response.success) {
          const count = response.data?.length || 0;
          if (count > 0) {
            this.generationResult = {
              success: true,
              title: 'Bills Generated Successfully',
              message: `${count} bill(s) have been generated for ${this.getMonthName(selectedCycle.month)} ${selectedCycle.year}.`
            };
          } else {
            this.generationResult = {
              success: false,
              title: 'No Bills Generated',
              message: response.message || `No unbilled meter readings found for ${this.getMonthName(selectedCycle.month)} ${selectedCycle.year}. Please record meter readings for this billing period first.`
            };
          }
          this.loadData();
        } else {
          this.generationResult = {
            success: false,
            title: 'Generation Failed',
            message: response.message || 'Failed to generate bills'
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.generatingBulk = false;
        console.error('Bulk generation error:', err);
        this.generationResult = {
          success: false,
          title: 'Error',
          message: err.error?.message || err.error?.errors?.join(', ') || 'An error occurred'
        };
        this.cdr.detectChanges();
      }
    });
  }
}
