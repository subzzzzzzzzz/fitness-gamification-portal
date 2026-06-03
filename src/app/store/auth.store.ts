import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models';
import { Router } from '@angular/router';

// State definition
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null
};

// Action Group
export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ token: string; user: User }>(),
    'Login Failure': props<{ error: string }>(),
    'Register': props<{ name: string; email: string; password: string; phone?: string; city?: string; region?: string }>(),
    'Register Success': props<{ token: string; user: User }>(),
    'Register Failure': props<{ error: string }>(),
    'Logout': emptyProps()
  }
});

// Feature Reducer & Selectors
export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(authActions.login, authActions.register, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(authActions.loginSuccess, authActions.registerSuccess, (state, { token, user }) => ({
      ...state,
      loading: false,
      token,
      user,
      error: null
    })),
    on(authActions.loginFailure, authActions.registerFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(authActions.logout, (state) => ({
      ...state,
      user: null,
      token: null,
      loading: false,
      error: null
    }))
  )
});

// Functional Effects
export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) => {
    return actions$.pipe(
      ofType(authActions.login),
      switchMap(({ email, password }) =>
        authService.login({ email, password }).pipe(
          map(res => authActions.loginSuccess(res)),
          catchError(err => of(authActions.loginFailure({ error: err.error?.message || 'Login failed' })))
        )
      )
    );
  },
  { functional: true }
);

export const registerEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) => {
    return actions$.pipe(
      ofType(authActions.register),
      switchMap(userData =>
        authService.register(userData).pipe(
          map(res => authActions.registerSuccess(res)),
          catchError(err => of(authActions.registerFailure({ error: err.error?.message || 'Registration failed' })))
        )
      )
    );
  },
  { functional: true }
);

export const authSuccessEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) => {
    return actions$.pipe(
      ofType(authActions.loginSuccess, authActions.registerSuccess),
      tap(() => {
        router.navigate(['/dashboard']);
      })
    );
  },
  { functional: true, dispatch: false }
);

export const logoutEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) => {
    return actions$.pipe(
      ofType(authActions.logout),
      tap(() => {
        authService.logout();
      })
    );
  },
  { functional: true, dispatch: false }
);
