import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { authActions, authFeature } from '../../store/auth.store';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-auth-split',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideDynamicIcon],
  template: `
    <div class="auth-container">
      <!-- Left/Top Brand Panel -->
      <div class="brand-panel">
        <div class="brand-header">
          <div class="brand-logo">SW</div>
          <div class="brand-name">Smartwatch LB</div>
        </div>
        <div class="brand-body">
          <h2 class="brand-title">Track. Compete. Achieve.</h2>
          <p class="brand-subtitle">Your personal fitness leaderboard.</p>
          
          <ul class="brand-features">
            <li>
              <span class="bullet"><svg lucideIcon="check" size="14"></svg></span>
              Complete daily fitness tasks
            </li>
            <li>
              <span class="bullet"><svg lucideIcon="check" size="14"></svg></span>
              Compete in global challenges
            </li>
            <li>
              <span class="bullet"><svg lucideIcon="check" size="14"></svg></span>
              Live leaderboard rankings
            </li>
            <li>
              <span class="bullet"><svg lucideIcon="check" size="14"></svg></span>
              Sync your smartwatch data
            </li>
          </ul>
        </div>
        <div class="brand-footer">
          Powered by Angular 20 & Material
        </div>
      </div>

      <!-- Right/Bottom Form Panel -->
      <div class="form-panel">
        <div class="form-wrapper">
          @if (isLogin()) {
            <!-- Login View -->
            <h2>Welcome back</h2>
            <p class="form-desc">Sign in to your account</p>

            <form [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()">
              <div class="form-field">
                <label class="required" for="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  formControlName="email" 
                  placeholder="alex.smith@example.com"
                  [ngClass]="{'error-border': showErrors() && loginForm.get('email')?.invalid}"
                />
                @if (showErrors() && loginForm.get('email')?.hasError('required')) {
                  <div class="error-text">Email is required</div>
                }
                @if (showErrors() && loginForm.get('email')?.hasError('email')) {
                  <div class="error-text">Please enter a valid email</div>
                }
              </div>

              <div class="form-field">
                <label class="required" for="password">Password</label>
                <div class="password-input-wrapper">
                  <input 
                    [type]="showPassword() ? 'text' : 'password'" 
                    id="password" 
                    formControlName="password" 
                    placeholder="••••••••"
                    [ngClass]="{'error-border': showErrors() && loginForm.get('password')?.invalid}"
                  />
                  <button type="button" class="password-toggle" (click)="togglePassword()">
                    <svg [lucideIcon]="showPassword() ? 'eye-off' : 'eye'" size="18"></svg>
                  </button>
                </div>
                @if (showErrors() && loginForm.get('password')?.hasError('required')) {
                  <div class="error-text">Password is required</div>
                }
              </div>

              <div class="form-options">
                <label class="remember-me">
                  <input type="checkbox" formControlName="rememberMe" />
                  <span>Remember me</span>
                </label>
                <a class="forgot-link" (click)="forgotPassword()">Forgot password?</a>
              </div>

              @if (authError()) {
                <div class="form-alert error">
                  {{ authError() }}
                </div>
              }

              <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                {{ loading() ? 'Signing in...' : 'Sign In' }}
              </button>

              <div class="switch-mode">
                Don't have an account? 
                <a (click)="setMode(false)">Create Account →</a>
              </div>
            </form>
          } @else {
            <!-- Register View -->
            <h2>Create Account</h2>
            <p class="form-desc">Fill in your details to get started</p>

            <form [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()">
              <div class="grid-form">
                <div class="form-field">
                  <label class="required" for="regName">Full Name</label>
                  <input 
                    type="text" 
                    id="regName" 
                    formControlName="name" 
                    placeholder="Alex Smith"
                    [ngClass]="{'error-border': showErrors() && registerForm.get('name')?.invalid}"
                  />
                  @if (showErrors() && registerForm.get('name')?.hasError('required')) {
                    <div class="error-text">Full name is required</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="regEmail">Email</label>
                  <input 
                    type="email" 
                    id="regEmail" 
                    formControlName="email" 
                    placeholder="your@email.com"
                    [ngClass]="{'error-border': showErrors() && registerForm.get('email')?.invalid}"
                  />
                  @if (showErrors() && registerForm.get('email')?.hasError('required')) {
                    <div class="error-text">Email is required</div>
                  }
                  @if (showErrors() && registerForm.get('email')?.hasError('email')) {
                    <div class="error-text">Please enter a valid email</div>
                  }
                </div>

                <div class="form-field">
                  <label for="regPhone">Phone (optional)</label>
                  <input 
                    type="text" 
                    id="regPhone" 
                    formControlName="phone" 
                    placeholder="+91 690-933-8847"
                  />
                </div>

                <div class="form-field">
                  <label class="required" for="regPassword">Password</label>
                  <input 
                    type="password" 
                    id="regPassword" 
                    formControlName="password" 
                    placeholder="Min 8 chars"
                    [ngClass]="{'error-border': showErrors() && registerForm.get('password')?.invalid}"
                  />
                  @if (showErrors() && registerForm.get('password')?.hasError('required')) {
                    <div class="error-text">Password is required</div>
                  }
                  @if (showErrors() && registerForm.get('password')?.hasError('minlength')) {
                    <div class="error-text">Must be at least 8 characters</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="regConfirm">Confirm Pwd</label>
                  <input 
                    type="password" 
                    id="regConfirm" 
                    formControlName="confirmPassword" 
                    placeholder="Re-enter..."
                    [ngClass]="{'error-border': showErrors() && registerForm.get('confirmPassword')?.invalid}"
                  />
                  @if (showErrors() && registerForm.get('confirmPassword')?.hasError('required')) {
                    <div class="error-text">Please confirm your password</div>
                  }
                  @if (showErrors() && registerForm.hasError('passwordsMismatch')) {
                    <div class="error-text">Passwords do not match</div>
                  }
                </div>

                <div class="form-field">
                  <label for="regCity">City (optional)</label>
                  <input 
                    type="text" 
                    id="regCity" 
                    formControlName="city" 
                    placeholder="Bengaluru"
                  />
                </div>

                <div class="form-field full-width">
                  <label for="regRegion">Region (optional)</label>
                  <select id="regRegion" formControlName="region">
                    <option value="APAC">APAC</option>
                    <option value="EMEA">EMEA</option>
                    <option value="AMER">AMER</option>
                  </select>
                </div>
              </div>

              @if (authError()) {
                <div class="form-alert error">
                  {{ authError() }}
                </div>
              }

              <button type="submit" class="btn btn-primary w-full mt-md" [disabled]="loading()">
                {{ loading() ? 'Creating account...' : 'Create Account' }}
              </button>

              <div class="switch-mode">
                Already registered? 
                <a (click)="setMode(true)">Sign In →</a>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;

      @media (min-width: 768px) {
        flex-direction: row;
      }
    }

    /* Left/Top Brand Panel styles */
    .brand-panel {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        width: 300px;
        height: 600px;
        top: -100px;
        left: -50px;
        background: radial-gradient(circle, rgba(219,234,254,0.1) 0%, transparent 70%);
        transform: rotate(-30deg);
        pointer-events: none;
      }

      @media (max-width: 767px) {
        padding: 24px 16px;
        gap: 12px;
        align-items: center;
        text-align: center;
        .brand-body, .brand-footer {
          display: none;
        }
      }

      @media (min-width: 768px) {
        width: 38%;
        min-height: 100vh;
        padding: 48px;
      }

      @media (min-width: 1024px) {
        width: 42%;
        padding: 64px;
      }
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1;
    }

    .brand-logo {
      background-color: white;
      color: #2563eb;
      font-weight: 800;
      font-size: 16px;
      width: 36px;
      height: 36px;
      border-radius: var(--r-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .brand-body {
      z-index: 1;
      margin: auto 0;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
      color: white;
      margin-bottom: 8px;
    }

    .brand-subtitle {
      font-size: 16px;
      color: var(--primary-100);
      margin-bottom: 32px;
    }

    .brand-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;

      li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        font-weight: 500;
      }
    }

    .bullet {
      background-color: rgba(255, 255, 255, 0.15);
      width: 24px;
      height: 24px;
      border-radius: var(--r-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-footer {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      z-index: 1;
    }

    /* Right/Bottom Form Panel styles */
    .form-panel {
      flex: 1;
      background-color: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;

      @media (min-width: 768px) {
        padding: 48px;
      }
    }

    .form-wrapper {
      width: 100%;
      max-width: 440px;

      h2 {
        font-size: 28px;
        margin-bottom: 4px;
      }
      
      .form-desc {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;

      input {
        width: 100%;
        padding-right: 44px;
      }
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        color: var(--text-primary);
      }
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 13px;

      .remember-me {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-weight: 500;
      }

      .forgot-link {
        color: var(--primary-600);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .switch-mode {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: var(--text-secondary);

      a {
        color: var(--primary-600);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        margin-left: 4px;
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px 16px;

      @media (min-width: 480px) {
        grid-template-columns: 1fr 1fr;
        .full-width {
          grid-column: span 2;
        }
      }
    }

    .error-border {
      border-color: var(--error-500) !important;
      &:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
      }
    }

    .form-alert {
      padding: 12px 16px;
      border-radius: var(--r-xl);
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;

      &.error {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--error-600);
      }
    }

    .w-full {
      width: 100%;
    }

    .mt-md {
      margin-top: 16px;
    }
  `]
})
export class AuthSplitComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  isLogin = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  showErrors = signal<boolean>(false);

  // Store selectors
  loading = this.store.selectSignal(authFeature.selectLoading);
  authError = this.store.selectSignal(authFeature.selectError);

  loginForm: FormGroup = this.fb.group({
    email: ['alex.smith@example.com', [Validators.required, Validators.email]],
    password: ['user123', Validators.required],
    rememberMe: [true]
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    city: [''],
    region: ['APAC']
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.isLogin.set(this.router.url.includes('/login') || !this.router.url.includes('/register'));
  }

  setMode(login: boolean) {
    this.isLogin.set(login);
    this.showErrors.set(false);
    if (login) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/register']);
    }
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  forgotPassword() {
    alert('Simulated password reset has been triggered.');
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.showErrors.set(true);
      return;
    }
    this.store.dispatch(authActions.login(this.loginForm.value));
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.showErrors.set(true);
      return;
    }
    this.store.dispatch(authActions.register(this.registerForm.value));
  }
}
