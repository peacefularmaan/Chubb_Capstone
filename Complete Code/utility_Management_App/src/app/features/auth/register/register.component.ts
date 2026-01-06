import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="auth-container">
      <div class="glass-card">
        <h1 class="title">Create Account</h1>
        <p class="subtitle">Register to get started</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="off">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                formControlName="firstName" 
                placeholder="John"
                autocomplete="off"
                [class.error]="form.get('firstName')?.touched && form.get('firstName')?.invalid"
              />
              <span class="error-msg" *ngIf="form.get('firstName')?.touched && form.get('firstName')?.invalid">Required</span>
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                formControlName="lastName" 
                placeholder="Doe"
                autocomplete="off"
                [class.error]="form.get('lastName')?.touched && form.get('lastName')?.invalid"
              />
              <span class="error-msg" *ngIf="form.get('lastName')?.touched && form.get('lastName')?.invalid">Required</span>
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input 
              type="email" 
              formControlName="email" 
              placeholder="you@example.com"
              autocomplete="new-email"
              [class.error]="form.get('email')?.touched && form.get('email')?.invalid"
            />
            <span class="error-msg" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('required')">Email is required</span>
            <span class="error-msg" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">Invalid email</span>
            <span class="error-msg" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('lowercase')">Email must contain only lowercase characters</span>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              formControlName="password" 
              placeholder="Min 6 characters"
              autocomplete="new-password"
              [class.error]="form.get('password')?.touched && form.get('password')?.invalid"
            />
            <span class="error-msg" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">Min 6 characters</span>
          </div>

          <div class="form-group">
            <label>Phone (Optional)</label>
            <input type="text" formControlName="phone" placeholder="+1 234 567 8900" />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input 
              type="text" 
              formControlName="address" 
              placeholder="123 Main Street"
              [class.error]="form.get('address')?.touched && form.get('address')?.invalid"
            />
            <span class="error-msg" *ngIf="form.get('address')?.touched && form.get('address')?.invalid">Required</span>
          </div>

          <div class="form-row triple">
            <div class="form-group">
              <label>City</label>
              <input 
                type="text" 
                formControlName="city" 
                placeholder="City"
                [class.error]="form.get('city')?.touched && form.get('city')?.invalid"
              />
            </div>
            <div class="form-group">
              <label>State</label>
              <input 
                type="text" 
                formControlName="state" 
                placeholder="State"
                [class.error]="form.get('state')?.touched && form.get('state')?.invalid"
              />
            </div>
            <div class="form-group">
              <label>Postal Code</label>
              <input 
                type="text" 
                formControlName="postalCode" 
                placeholder="12345"
                [class.error]="form.get('postalCode')?.touched && form.get('postalCode')?.invalid"
              />
            </div>
          </div>

          <div *ngIf="error" class="error-alert">
            {{ error }}
          </div>

          <button type="submit" class="neon-btn" [disabled]="form.invalid || loading">
            <span *ngIf="!loading">Register</span>
            <span *ngIf="loading" class="loader"></span>
          </button>
        </form>

        <p class="footer-text">
          Already have an account? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
      position: relative;
      overflow: hidden;
    }

    .auth-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 70% 30%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 30% 70%, rgba(0, 212, 255, 0.03) 0%, transparent 50%);
      animation: bgShift 15s ease-in-out infinite alternate;
    }

    @keyframes bgShift {
      0% { transform: translate(0, 0); }
      100% { transform: translate(-5%, -5%); }
    }

    .glass-card {
      position: relative;
      width: 640px;
      max-width: 95vw;
      padding: 3rem 3.5rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @keyframes cardSlideIn {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .title {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 0 0 2rem;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      font-size: 1rem;
    }

    form {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      width: 100%;

      &.triple {
        grid-template-columns: repeat(3, 1fr);
        
        .form-group input {
          padding: 1rem 0.875rem;
          font-size: 0.9375rem;
        }
      }
    }

    .form-group {
      margin-bottom: 1.25rem;
      width: 100%;
      min-width: 0;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
      }

      input {
        width: 100%;
        padding: 1.25rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-size: 1.0625rem;
        color: #ffffff;
        transition: all 0.3s ease;
        box-sizing: border-box;
        min-width: 0;

        &::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        &:focus {
          outline: none;
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15);
        }

        &.error {
          border-color: #ff4757;
          background: rgba(255, 71, 87, 0.05);
        }
      }

      .error-msg {
        display: block;
        margin-top: 0.375rem;
        font-size: 0.75rem;
        color: #ff4757;
      }
    }

    .error-alert {
      padding: 1rem;
      margin-bottom: 1.25rem;
      background: rgba(255, 71, 87, 0.1);
      border: 1px solid rgba(255, 71, 87, 0.3);
      border-radius: 10px;
      color: #ff4757;
      font-size: 0.875rem;
      text-align: center;
    }

    .neon-btn {
      width: 100%;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      color: #0a0a0f;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(0, 212, 255, 0.5),
                    0 0 60px rgba(0, 212, 255, 0.3);

        &::before {
          opacity: 1;
        }
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(10, 10, 15, 0.3);
      border-top-color: #0a0a0f;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .footer-text {
      margin: 1.75rem 0 0;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9375rem;

      a {
        color: #00d4ff;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;

        &:hover {
          text-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
        }
      }
    }

    @media (max-width: 600px) {
      .glass-card {
        width: 100%;
        max-width: 100%;
        padding: 2.5rem 2rem;
        border-radius: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-row.triple {
        grid-template-columns: 1fr;
      }

      .title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, this.lowercaseValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required]
    });
  }

  // Custom validator to ensure email contains only lowercase characters
  lowercaseValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUppercase = /[A-Z]/.test(value);
    return hasUppercase ? { lowercase: true } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.auth.register(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        } else {
          this.error = res.message || 'Registration failed';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed';
        this.cdr.detectChanges();
      }
    });
  }
}
