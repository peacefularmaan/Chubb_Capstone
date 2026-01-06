import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="auth-container">
      <div class="glass-card">
        <h1 class="title">Welcome Back</h1>
        <p class="subtitle">Sign in to continue</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="off">
          <!-- Hidden fields to trick browser autofill -->
          <input type="text" style="display:none" aria-hidden="true" />
          <input type="password" style="display:none" aria-hidden="true" />
          
          <div class="form-group">
            <label>Email</label>
            <input 
              type="email" 
              formControlName="email" 
              placeholder="Enter your email"
              autocomplete="new-email"
              [attr.readonly]="isReadOnly"
              (focus)="removeReadOnly()"
              [class.error]="form.get('email')?.touched && form.get('email')?.invalid"
            />
            <span class="error-msg" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('required')">
              Email is required
            </span>
            <span class="error-msg" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">
              Please enter a valid email
            </span>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              [type]="hidePassword ? 'password' : 'text'" 
              formControlName="password" 
              placeholder="Enter your password"
              autocomplete="new-password"
              [attr.readonly]="isReadOnly"
              (focus)="removeReadOnly()"
              [class.error]="form.get('password')?.touched && form.get('password')?.invalid"
            />
            <span class="error-msg" *ngIf="form.get('password')?.touched && form.get('password')?.hasError('required')">
              Password is required
            </span>
          </div>

          <div *ngIf="successMessage" class="success-alert">
            {{ successMessage }}
          </div>

          <div *ngIf="error" class="error-alert">
            {{ error }}
          </div>

          <button type="submit" class="neon-btn" [disabled]="form.invalid || loading">
            <span *ngIf="!loading">Login</span>
            <span *ngIf="loading" class="loader"></span>
          </button>
        </form>

        <p class="footer-text">
          Don't have an account? <a routerLink="/register">Register</a>
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
      background: radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(0, 212, 255, 0.03) 0%, transparent 50%);
      animation: bgShift 15s ease-in-out infinite alternate;
    }

    @keyframes bgShift {
      0% { transform: translate(0, 0); }
      100% { transform: translate(-5%, -5%); }
    }

    .glass-card {
      position: relative;
      width: 560px;
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
      margin: 0 0 2.5rem;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      font-size: 1rem;
    }

    form {
      width: 100%;
    }

    .form-group {
      margin-bottom: 1.5rem;
      width: 100%;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
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
        margin-top: 0.5rem;
        font-size: 0.8125rem;
        color: #ff4757;
      }
    }

    .success-alert {
      padding: 1rem;
      margin-bottom: 1.5rem;
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid rgba(0, 255, 136, 0.3);
      border-radius: 10px;
      color: #00ff88;
      font-size: 0.875rem;
      text-align: center;
    }

    .error-alert {
      padding: 1rem;
      margin-bottom: 1.5rem;
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
      margin-top: 0.5rem;
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
      margin: 2rem 0 0;
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

    @media (max-width: 520px) {
      .glass-card {
        width: 100%;
        max-width: 100%;
        padding: 2.5rem 2rem;
        border-radius: 20px;
      }

      .title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  hidePassword = true;
  isReadOnly: boolean | null = true;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registration successful! Please log in with your credentials.';
      }
    });
    
    // Remove readonly after a short delay to prevent autofill
    setTimeout(() => {
      this.isReadOnly = null;
      this.cdr.detectChanges();
    }, 100);
  }

  removeReadOnly(): void {
    this.isReadOnly = null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    const { email, password } = this.form.value;
    this.auth.login({ email: email || '', password: password || '' }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.message || 'Login failed';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
        this.cdr.detectChanges();
      }
    });
  }
}
