import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { ConsumersService } from '../../core/services/consumers.service';
import { Consumer } from '../../core/models';

@Component({
  selector: 'app-consumer-portal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule
  ],
  template: `
    <div class="my-account-container">
      <div class="page-header">
        <h1>My Account</h1>
        <p class="subtitle">View and manage your account information</p>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading your profile...</p>
      </div>

      <div *ngIf="error && !loading" class="error-container">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadProfile()">Retry</button>
      </div>

      <div *ngIf="consumer && !loading" class="profile-content">
        <!-- Profile Overview Card -->
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <mat-card-title>{{ consumer.firstName }} {{ consumer.lastName }}</mat-card-title>
            <mat-card-subtitle>Consumer #{{ consumer.consumerNumber }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="profile-info">
              <div class="info-item">
                <mat-icon>email</mat-icon>
                <span>{{ consumer.email }}</span>
              </div>
              <div class="info-item" *ngIf="consumer.phone">
                <mat-icon>phone</mat-icon>
                <span>{{ consumer.phone }}</span>
              </div>
              <div class="info-item">
                <mat-icon>location_on</mat-icon>
                <span>{{ consumer.address }}, {{ consumer.city }}, {{ consumer.state }} - {{ consumer.postalCode }}</span>
              </div>
              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <span>Member since {{ consumer.registrationDate | date:'mediumDate' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Edit Profile Card -->
        <mat-card class="edit-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit</mat-icon>
              Edit Profile
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" placeholder="Enter first name">
                  <mat-icon matPrefix>person</mat-icon>
                  <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" placeholder="Enter last name">
                  <mat-icon matPrefix>person</mat-icon>
                  <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Phone Number</mat-label>
                  <input matInput formControlName="phone" placeholder="Enter phone number">
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>
              </div>

              <mat-divider></mat-divider>
              <h3 class="section-title">Address Information</h3>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address</mat-label>
                  <input matInput formControlName="address" placeholder="Enter address">
                  <mat-icon matPrefix>home</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row three-cols">
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city" placeholder="Enter city">
                  <mat-icon matPrefix>location_city</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>State</mat-label>
                  <input matInput formControlName="state" placeholder="Enter state">
                  <mat-icon matPrefix>map</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Postal Code</mat-label>
                  <input matInput formControlName="postalCode" placeholder="Enter postal code">
                  <mat-icon matPrefix>markunread_mailbox</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-button type="button" (click)="resetForm()" [disabled]="saving">
                  <mat-icon>refresh</mat-icon>
                  Reset
                </button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                  <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
                  <mat-icon *ngIf="!saving">save</mat-icon>
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Connections Card -->
        <mat-card class="connections-card" *ngIf="consumer.connections && consumer.connections.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>electrical_services</mat-icon>
              My Connections
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let conn of consumer.connections" class="connection-item">
                <mat-icon matListItemIcon>{{ getUtilityIcon(conn.utilityType) }}</mat-icon>
                <div matListItemTitle>{{ conn.utilityType }} - {{ conn.connectionNumber }}</div>
                <div matListItemLine>
                  Meter: {{ conn.meterNumber }} | Plan: {{ conn.tariffPlan }}
                </div>
                <div matListItemMeta>
                  <mat-chip [class]="conn.status === 'Active' ? 'status-active' : 'status-inactive'">
                    {{ conn.status }}
                  </mat-chip>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .my-account-container {
      max-width: 920px;
      margin: 0 auto;
      padding: 0;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff 0%, #A0AEC0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        margin: 0.375rem 0 0;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1.25rem;

      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #FF6B6B;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .profile-card, .edit-card, .connections-card {
      background: rgba(255, 255, 255, 0.03) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 20px !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    }

    .profile-card {
      .avatar {
        background: linear-gradient(135deg, #00D2FF 0%, #00F260 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 210, 255, 0.4);

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: white;
        }
      }

      .profile-info {
        margin-top: 1.25rem;

        .info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);

          &:last-child {
            border-bottom: none;
          }

          mat-icon {
            color: #00D2FF;
          }
        }
      }
    }

    .edit-card {
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        color: rgba(255, 255, 255, 0.9) !important;

        mat-icon {
          color: #00D2FF;
        }
      }

      form {
        margin-top: 1.25rem;
      }

      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;

        mat-form-field {
          flex: 1;
        }

        &.three-cols mat-form-field {
          flex: 1;
        }

        .full-width {
          width: 100%;
        }
      }

      .section-title {
        margin: 1.75rem 0 1.25rem;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      mat-divider {
        margin: 1.25rem 0;
        border-color: rgba(255, 255, 255, 0.06);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.75rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        mat-spinner {
          margin-right: 0.5rem;
        }
      }
    }

    .connections-card {
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        color: rgba(255, 255, 255, 0.9) !important;

        mat-icon {
          color: #00D2FF;
        }
      }

      .connection-item {
        margin-bottom: 0.625rem;
        color: rgba(255, 255, 255, 0.8);

        mat-icon {
          color: #00D2FF;
        }
      }

      .status-active {
        background: rgba(0, 242, 96, 0.15) !important;
        color: #00F260 !important;
        border: 1px solid rgba(0, 242, 96, 0.3) !important;
      }

      .status-inactive {
        background: rgba(255, 255, 255, 0.1) !important;
        color: rgba(255, 255, 255, 0.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
      }
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;

        &.three-cols {
          flex-direction: column;
        }
      }
    }
  `]
})
export class ConsumerPortalComponent implements OnInit {
  consumer: Consumer | null = null;
  loading = false;
  saving = false;
  error = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private consumersService: ConsumersService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      postalCode: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';
    
    this.consumersService.getMyProfile().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.consumer = response.data;
          this.populateForm();
        } else {
          this.error = response.message || 'Failed to load profile';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load profile. Please try again.';
        this.cdr.detectChanges();
        console.error('Error loading profile:', err);
      }
    });
  }

  populateForm(): void {
    if (this.consumer) {
      this.form.patchValue({
        firstName: this.consumer.firstName,
        lastName: this.consumer.lastName,
        phone: this.consumer.phone || '',
        address: this.consumer.address,
        city: this.consumer.city,
        state: this.consumer.state,
        postalCode: this.consumer.postalCode
      });
    }
  }

  resetForm(): void {
    this.populateForm();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const payload = this.form.value;

    this.consumersService.updateMyProfile(payload).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && response.data) {
          this.consumer = response.data;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open(response.message || 'Failed to update profile', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error updating profile:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getUtilityIcon(utilityType: string): string {
    const type = utilityType.toLowerCase();
    if (type.includes('electric')) return 'bolt';
    if (type.includes('water')) return 'water_drop';
    if (type.includes('gas')) return 'local_fire_department';
    return 'electrical_services';
  }
}
