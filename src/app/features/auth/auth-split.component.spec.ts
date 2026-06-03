import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AuthSplitComponent } from './auth-split.component';
import { provideStore, Store } from '@ngrx/store';
import { provideRouter, Router } from '@angular/router';
import { authFeature, authActions } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';

describe('AuthSplitComponent', () => {
  let component: AuthSplitComponent;
  let fixture: ComponentFixture<AuthSplitComponent>;
  let store: Store;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthSplitComponent, ReactiveFormsModule],
      providers: [
        provideStore({
          [authFeature.name]: authFeature.reducer,
        }),
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthSplitComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('should simulate forgot password alert', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.forgotPassword();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should set mode and navigate', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    component.setMode(true);
    expect(component.isLogin()).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    component.setMode(false);
    expect(component.isLogin()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/register']);
  });

  it('should validate matching passwords', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.registerForm.valid).toBeFalsy(); // other fields are empty

    const mismatch = component.passwordMatchValidator(component.registerForm);
    expect(mismatch).toBeNull();

    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'differentpassword'
    });
    const mismatchError = component.passwordMatchValidator(component.registerForm);
    expect(mismatchError).toEqual({ passwordsMismatch: true });
  });

  it('should dispatch login action on valid submit', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.loginForm.patchValue({
      email: 'user@test.com',
      password: 'password'
    });
    component.onLoginSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(authActions.login({
      email: 'user@test.com',
      password: 'password',
      rememberMe: true
    }));
  });

  it('should set showErrors to true on invalid login submit', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: ''
    });
    component.onLoginSubmit();
    expect(component.showErrors()).toBe(true);
  });

  it('should dispatch register action on valid submit', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.registerForm.patchValue({
      name: 'Test',
      email: 'user@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '',
      city: '',
      region: 'APAC'
    });
    component.onRegisterSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(authActions.register({
      name: 'Test',
      email: 'user@test.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '',
      city: '',
      region: 'APAC'
    }));
  });

  it('should set showErrors to true on invalid register submit', () => {
    component.registerForm.patchValue({
      name: '',
      email: ''
    });
    component.onRegisterSubmit();
    expect(component.showErrors()).toBe(true);
  });
});
