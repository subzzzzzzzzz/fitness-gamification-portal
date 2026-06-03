import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { usersFeature, usersActions, loadUsersEffect, updateUserEffect } from './users.store';
import { UsersService } from '../core/services/users.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../core/models';

describe('Users Store & Effects', () => {
  let actions$: Observable<any>;
  let usersServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    usersServiceSpy = {
      getUsers: jest.fn(),
      updateUser: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = usersFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.users).toEqual([]);
    });

    it('should handle loadUsers', () => {
      let state = usersFeature.reducer(undefined, usersActions.loadUsers());
      expect(state.loading).toBe(true);

      state = usersFeature.reducer(state, usersActions.loadUsersSuccess({ users: [{ id: 1 } as User] }));
      expect(state.loading).toBe(false);
      expect(state.users.length).toBe(1);

      state = leaderboardFeature => {}; // dummy to avoid unused warnings if any, but leaderboardFeature doesn't exist here. 
      // Let's keep it clean
      state = usersFeature.reducer(state, usersActions.loadUsersFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');
    });

    it('should handle updateUser', () => {
      const initial = { users: [{ id: 1, name: 'Old' } as User], loading: true, error: null };
      const updated = { id: 1, name: 'New' } as User;
      const state = usersFeature.reducer(initial, usersActions.updateUserSuccess({ user: updated }));
      expect(state.users[0].name).toBe('New');
    });
  });

  describe('Effects', () => {
    it('should load users', (done) => {
      usersServiceSpy.getUsers.mockReturnValue(of([]));
      actions$ = of(usersActions.loadUsers());

      TestBed.runInInjectionContext(() => {
        loadUsersEffect().subscribe(res => {
          expect(res).toEqual(usersActions.loadUsersSuccess({ users: [] }));
          done();
        });
      });
    });

    it('should handle load users failure', (done) => {
      usersServiceSpy.getUsers.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(usersActions.loadUsers());

      TestBed.runInInjectionContext(() => {
        loadUsersEffect().subscribe(res => {
          expect(res).toEqual(usersActions.loadUsersFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should update user', (done) => {
      const item = { id: 1 } as User;
      usersServiceSpy.updateUser.mockReturnValue(of(item));
      actions$ = of(usersActions.updateUser({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateUserEffect().subscribe(res => {
          expect(res).toEqual(usersActions.updateUserSuccess({ user: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle update user failure', (done) => {
      usersServiceSpy.updateUser.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(usersActions.updateUser({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateUserEffect().subscribe(res => {
          expect(res).toEqual(usersActions.updateUserFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
