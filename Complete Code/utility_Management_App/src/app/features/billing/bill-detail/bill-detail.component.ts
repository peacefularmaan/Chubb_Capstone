import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { BillsService } from '../../../core/services/bills.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill } from '../../../core/models';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/billing">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Bill #{{ bill?.billNumber }}</h1>
          <p>View bill details</p>
        </div>
        <div class="header-actions" *ngIf="bill">
          <button mat-stroked-button [routerLink]="['/payments/new']" [queryParams]="{billId: bill.id}" 
                  *ngIf="canRecordPayment && bill.status !== 'Paid'">
            <mat-icon>payment</mat-icon>
            Record Payment
          </button>
          <button mat-raised-button color="accent" [routerLink]="['/payments/new']" [queryParams]="{billId: bill.id}" 
                  *ngIf="isConsumer && bill.status !== 'Paid'">
            <mat-icon>payment</mat-icon>
            Pay Now
          </button>
          <button mat-raised-button color="primary" (click)="printBill()">
            <mat-icon>print</mat-icon>
            Print
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading bill details...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-stroked-button routerLink="/billing">Back to Bills</button>
      </div>

      <div class="detail-grid" *ngIf="!loading && !error && bill">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Bill Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Bill Number</span>
                <span class="value">{{ bill.billNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Bill Date</span>
                <span class="value">{{ bill.billDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Due Date</span>
                <span class="value" [class.overdue]="isOverdue()">{{ bill.dueDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Billing Period</span>
                <span class="value">{{ bill.billingMonth }}/{{ bill.billingYear }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status</span>
                <mat-chip [ngClass]="getStatusClass(bill.status)">{{ bill.status }}</mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Consumer & Connection</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Consumer</span>
                <span class="link">{{ bill.consumerName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Connection</span>
                <a [routerLink]="['/connections', bill.connectionId]" class="link">{{ bill.connectionNumber }}</a>
              </div>
              <div class="info-item">
                <span class="label">Utility Type</span>
                <span class="value">{{ bill.utilityType }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tariff Plan</span>
                <span class="value">{{ bill.tariffPlan }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card consumption-card">
          <mat-card-header>
            <mat-card-title>Consumption Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="consumption-summary">
              <div class="meter-readings">
                <div class="reading-box">
                  <span class="label">Previous Reading</span>
                  <span class="value">{{ bill.previousReading | number:'1.2-2' }}</span>
                </div>
                <mat-icon class="arrow">arrow_forward</mat-icon>
                <div class="reading-box">
                  <span class="label">Current Reading</span>
                  <span class="value">{{ bill.currentReading | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="units-consumed">
                <span class="label">Units Consumed</span>
                <span class="value">{{ bill.unitsConsumed | number:'1.2-2' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card amount-card">
          <mat-card-header>
            <mat-card-title>Amount Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="amount-details-grid">
              <!-- Charges Section -->
              <div class="charges-section">
                <h4 class="section-label">Charges Breakdown</h4>
                <div class="charge-item">
                  <div class="charge-info">
                    <mat-icon class="charge-icon energy">bolt</mat-icon>
                    <div class="charge-text">
                      <span class="charge-label">Energy Charges</span>
                      <span class="charge-detail">{{ bill.unitsConsumed | number:'1.2-2' }} units × ₹{{ bill.ratePerUnit | number:'1.2-4' }}</span>
                    </div>
                  </div>
                  <span class="charge-amount">₹{{ bill.energyCharges | number:'1.2-2' }}</span>
                </div>
                <div class="charge-item" *ngIf="bill.fixedCharges">
                  <div class="charge-info">
                    <mat-icon class="charge-icon fixed">receipt_long</mat-icon>
                    <div class="charge-text">
                      <span class="charge-label">Fixed Charges</span>
                      <span class="charge-detail">Monthly service fee</span>
                    </div>
                  </div>
                  <span class="charge-amount">₹{{ bill.fixedCharges | number:'1.2-2' }}</span>
                </div>
                <div class="charge-item" *ngIf="bill.taxAmount">
                  <div class="charge-info">
                    <mat-icon class="charge-icon tax">account_balance</mat-icon>
                    <div class="charge-text">
                      <span class="charge-label">Tax</span>
                      <span class="charge-detail">Government tax</span>
                    </div>
                  </div>
                  <span class="charge-amount">₹{{ bill.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="charge-item penalty" *ngIf="bill.penaltyAmount">
                  <div class="charge-info">
                    <mat-icon class="charge-icon penalty">warning</mat-icon>
                    <div class="charge-text">
                      <span class="charge-label">Late Payment Penalty</span>
                      <span class="charge-detail penalty-detail">
                        Applied {{ bill.penaltyCount || 1 }} time{{ (bill.penaltyCount || 1) > 1 ? 's' : '' }}
                        <span *ngIf="bill.basePenaltyAmount"> (₹{{ bill.basePenaltyAmount | number:'1.2-2' }} each)</span>
                      </span>
                    </div>
                  </div>
                  <span class="charge-amount penalty-amount">₹{{ bill.penaltyAmount | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Summary Section -->
              <div class="summary-section">
                <div class="summary-card total-card">
                  <span class="summary-label">Total Amount</span>
                  <span class="summary-value">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-card paid-card">
                  <span class="summary-label">Amount Paid</span>
                  <span class="summary-value paid">₹{{ bill.amountPaid | number:'1.2-2' }}</span>
                </div>
                <div class="summary-card due-card" [class.no-due]="bill.outstandingBalance <= 0">
                  <span class="summary-label">{{ bill.outstandingBalance > 0 ? 'Amount Due' : 'Fully Paid' }}</span>
                  <span class="summary-value" [class.due]="bill.outstandingBalance > 0">₹{{ bill.outstandingBalance | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1.5rem;

      button[mat-icon-button] {
        color: rgba(255,255,255,0.7);
        &:hover { color: #00D2FF; }
      }

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
        background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.5); }
      .header-content { flex: 1; }
      .header-actions { display: flex; gap: 0.5rem; }
    }

    .loading { 
      display: flex; 
      flex-direction: column;
      align-items: center;
      justify-content: center; 
      padding: 3rem; 
      gap: 1rem;
      --mdc-circular-progress-active-indicator-color: #00D2FF;
      p { color: rgba(255,255,255,0.5); margin: 0; }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      text-align: center;
      mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #FF6B6B; }
      p { color: rgba(255,255,255,0.5); margin: 0; font-size: 1rem; }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-card { 
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);

      ::ng-deep .mat-mdc-card-title { 
        font-size: 1rem; 
        font-weight: 600; 
        color: rgba(255,255,255,0.95);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      .label { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 0.25rem; }
      .value { font-weight: 500; color: rgba(255,255,255,0.9); }
    }

    .link { 
      color: #00D2FF; 
      text-decoration: none; 
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .link:hover { 
      text-shadow: 0 0 10px rgba(0,210,255,0.5);
    }
    .overdue { color: #FF6B6B; }

    .consumption-card { grid-column: span 2; }
    .consumption-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .meter-readings {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .reading-box {
      background: rgba(255,255,255,0.05);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      min-width: 120px;
      border: 1px solid rgba(255,255,255,0.08);

      .label { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
      .value { font-size: 1.5rem; font-weight: 600; color: rgba(255,255,255,0.95); }
    }

    .arrow { color: rgba(255,255,255,0.3); }

    .units-consumed {
      background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,210,255,0.3);

      .label { display: block; font-size: 0.875rem; opacity: 0.9; }
      .value { font-size: 2rem; font-weight: 700; }
    }

    .amount-card { grid-column: span 2; }
    
    .amount-details-grid {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 2rem;
    }

    .charges-section {
      .section-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.5);
        margin: 0 0 1rem 0;
        font-weight: 600;
      }
    }

    .charge-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      border: 1px solid rgba(255,255,255,0.05);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.1);
      }

      &.penalty {
        background: rgba(255,107,107,0.1);
        border-color: rgba(255,107,107,0.2);
      }
    }

    .charge-info {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .charge-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.08);

      &.energy { color: #00D2FF; background: rgba(0,210,255,0.15); }
      &.fixed { color: #A78BFA; background: rgba(167,139,250,0.15); }
      &.tax { color: #FBBF24; background: rgba(251,191,36,0.15); }
      &.penalty { color: #FF6B6B; background: rgba(255,107,107,0.15); }
    }

    .charge-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .charge-label {
      font-weight: 500;
      color: rgba(255,255,255,0.9);
    }

    .charge-detail {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);

      &.penalty-detail {
        color: #FF6B6B;
      }
    }

    .charge-amount {
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      font-size: 1rem;

      &.penalty-amount {
        color: #FF6B6B;
      }
    }

    .summary-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-card {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &.total-card {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
      }

      &.paid-card {
        background: rgba(0,242,96,0.1);
        border: 1px solid rgba(0,242,96,0.2);
      }

      &.due-card {
        background: rgba(255,107,107,0.15);
        border: 1px solid rgba(255,107,107,0.3);

        &.no-due {
          background: rgba(0,242,96,0.15);
          border-color: rgba(0,242,96,0.3);
        }
      }
    }

    .summary-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255,255,255,0.6);
      font-weight: 500;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: rgba(255,255,255,0.95);

      &.paid { color: #00F260; }
      &.due { color: #FF6B6B; }
    }

    mat-divider { 
      margin: 0.5rem 0;
      border-top-color: rgba(255,255,255,0.1);
    }

    mat-chip {
      font-size: 0.75rem;
      &.status-paid {
        background: rgba(0,242,96,0.15) !important;
        color: #00F260 !important;
        border: 1px solid rgba(0,242,96,0.3) !important;
      }
      &.status-due {
        background: rgba(255,217,61,0.15) !important;
        color: #FFD93D !important;
        border: 1px solid rgba(255,217,61,0.3) !important;
      }
      &.status-overdue {
        background: rgba(255,107,107,0.15) !important;
        color: #FF6B6B !important;
        border: 1px solid rgba(255,107,107,0.3) !important;
      }
    }

    .payment-table { width: 100%; }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .consumption-card, .amount-card {
        grid-column: span 1;
      }
    }
  `]
})
export class BillDetailComponent implements OnInit {
  bill: Bill | null = null;
  loading = false;
  error: string | null = null;
  paymentColumns = ['paymentDate', 'amount', 'method', 'paymentNumber'];
  canRecordPayment = false;
  isConsumer = false;

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // BillingOfficer can only generate bills, not record payments
    // AccountOfficer is view-only - only Admin can record payments
    this.canRecordPayment = this.authService.hasRole(['Admin']);
    this.isConsumer = this.authService.hasRole(['Consumer']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBill(+id);
    }
  }

  loadBill(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('Loading bill with id:', id);
    
    // Use appropriate endpoint based on user role
    const billRequest = this.isConsumer 
      ? this.billsService.getMyBillById(id)
      : this.billsService.getById(id);
    
    billRequest.subscribe({
      next: (response) => {
        console.log('Bill response:', response);
        this.loading = false;
        if (response.success && response.data) {
          this.bill = response.data;
          console.log('Bill set:', this.bill);
        } else {
          this.error = response.message || 'Failed to load bill';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bill:', err);
        this.loading = false;
        this.error = err.error?.message || 'Failed to load bill. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  isOverdue(): boolean {
    if (!this.bill) return false;
    return new Date(this.bill.dueDate) < new Date() && this.bill.status !== 'Paid';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Due': return 'status-due';
      case 'Overdue': return 'status-overdue';
      default: return '';
    }
  }

  printBill(): void {
    window.print();
  }
}
