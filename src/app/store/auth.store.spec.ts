import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { authFeature, authActions, loginEffect, registerEffect, authSuccessEffect, logoutEffect } from './auth.store';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models';

describe('Auth Store & Effects', () => {
  let actions$: Observable<any>;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn()
    };
    routerSpy = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = authFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should set loading to true on login and register', () => {
      let state = authFeature.reducer(undefined, authActions.login({ email: '', password: '' }));
      expect(state.loading).toBe(true);

      state = authFeature.reducer(undefined, authActions.register({ name: '', email: '', password: '' }));
      expect(state.loading).toBe(true);
    });

    it('should set user and token on loginSuccess and registerSuccess', () => {
      const mockUser = { id: 1, name: 'U' } as User;
      let state = authFeature.reducer(undefined, authActions.loginSuccess({ token: 'tok', user: mockUser }));
      expect(state.loading).toBe(false);
      expect(state.token).toBe('tok');
      expect(state.user).toBe(mockUser);

      state = authFeature.reducer(undefined, authActions.registerSuccess({ token: 'tok2', user: mockUser }));
      expect(state.loading).toBe(false);
      expect(state.token).toBe('tok2');
      expect(state.user).toBe(mockUser);
    });

    it('should set error and loading=false on failure', () => {
      let state = authFeature.reducer(undefined, authActions.loginFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');

      state = authFeature.reducer(undefined, authActions.registerFailure({ error: 'err2' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err2');
    });

    it('should clear user and token on logout', () => {
      const initial = { user: {} as User, token: 'tok', loading: false, error: null };
      const state = authFeature.reducer(initial, authActions.logout());
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('Effects', () => {
    it('should dispatch loginSuccess on successful login', (done) => {
      const credentials = { email: 'a@b.com', password: 'p' };
      const mockRes = { token: 't', user: {} as User };
      authServiceSpy.login.mockReturnValue(of(mockRes));

      actions$ = of(authActions.login(credentials));

      TestBed.runInInjectionContext(() => {
        loginEffect().subscribe(res => {
          expect(res).toEqual(authActions.loginSuccess(mockRes));
          expect(authServiceSpy.login).toHaveBeenCalledWith(expect.objectContaining(credentials));
          done();
        });
      });
    });

    it('should dispatch loginFailure on failed login', (done) => {
      const credentials = { email: 'a@b.com', password: 'p' };
      authServiceSpy.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

      actions$ = of(authActions.login(credentials));

      TestBed.runInInjectionContext(() => {
        loginEffect().subscribe(res => {
          expect(res).toEqual(authActions.loginFailure({ error: 'Invalid credentials' }));
          done();
        });
      });
    });

    it('should dispatch registerSuccess on successful registration', (done) => {
      const userData = { name: 'N', email: 'a@b.com', password: 'p' };
      const mockRes = { token: 't', user: {} as User };
      authServiceSpy.register.mockReturnValue(of(mockRes));

      actions$ = of(authActions.register(userData));

      TestBed.runInInjectionContext(() => {
        registerEffect().subscribe(res => {
          expect(res).toEqual(authActions.registerSuccess(mockRes));
          expect(authServiceSpy.register).toHaveBeenCalledWith(expect.objectContaining(userData));
          done();
        });
      });
    });

    it('should dispatch registerFailure on failed registration', (done) => {
      const userData = { name: 'N', email: 'a@b.com', password: 'p' };
      authServiceSpy.register.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));

      actions$ = of(authActions.register(userData));

      TestBed.runInInjectionContext(() => {
        registerEffect().subscribe(res => {
          expect(res).toEqual(authActions.registerFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should navigate to dashboard on authSuccess', (done) => {
      actions$ = of(authActions.loginSuccess({ token: 't', user: {} as User }));

      TestBed.runInInjectionContext(() => {
        authSuccessEffect().subscribe(() => {
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
          done();
        });
      });
    });

    it('should call authService.logout on logout action', (done) => {
      actions$ = of(authActions.logout());

      TestBed.runInInjectionContext(() => {
        logoutEffect().subscribe(() => {
          expect(authServiceSpy.logout).toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
