import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { UsersService } from '../core/services/users.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../core/models';

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null
};

export const usersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Update User': props<{ id: number; changes: Partial<User> }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: string }>()
  }
});

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(usersActions.loadUsers, usersActions.updateUser, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(usersActions.loadUsersSuccess, (state, { users }) => ({
      ...state,
      loading: false,
      users
    })),
    on(usersActions.loadUsersFailure, usersActions.updateUserFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(usersActions.updateUserSuccess, (state, { user }) => ({
      ...state,
      loading: false,
      users: state.users.map(u => u.id === user.id ? user : u)
    }))
  )
});

// Functional Effects
export const loadUsersEffect = createEffect(
  (actions$ = inject(Actions), usersService = inject(UsersService)) => {
    return actions$.pipe(
      ofType(usersActions.loadUsers),
      switchMap(() =>
        usersService.getUsers().pipe(
          map(users => usersActions.loadUsersSuccess({ users })),
          catchError(err => of(usersActions.loadUsersFailure({ error: err.error?.message || 'Failed to load users' })))
        )
      )
    );
  },
  { functional: true }
);

export const updateUserEffect = createEffect(
  (actions$ = inject(Actions), usersService = inject(UsersService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(usersActions.updateUser),
      switchMap(({ id, changes }) =>
        usersService.updateUser(id, changes).pipe(
          map(user => {
            toastService.success('Success', 'User profile updated successfully!');
            return usersActions.updateUserSuccess({ user });
          }),
          catchError(err => of(usersActions.updateUserFailure({ error: err.error?.message || 'Failed to update user' })))
        )
      )
    );
  },
  { functional: true }
);
