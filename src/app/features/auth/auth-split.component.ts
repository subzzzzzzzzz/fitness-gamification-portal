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
  templateUrl: './auth-split.component.html',
  styleUrl: './auth-split.component.scss'
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
