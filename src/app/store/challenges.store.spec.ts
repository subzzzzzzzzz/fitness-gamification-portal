import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { challengesFeature, challengesActions, loadChallengesEffect, createChallengeEffect, updateChallengeEffect, deleteChallengeEffect, joinChallengeEffect } from './challenges.store';
import { ChallengesService } from '../core/services/challenges.service';
import { ToastService } from '../core/services/toast.service';
import { Challenge } from '../core/models';

describe('Challenges Store & Effects', () => {
  let actions$: Observable<any>;
  let challengesServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    challengesServiceSpy = {
      getChallenges: jest.fn(),
      createChallenge: jest.fn(),
      updateChallenge: jest.fn(),
      deleteChallenge: jest.fn(),
      joinChallenge: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn(),
      error: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: ChallengesService, useValue: challengesServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = challengesFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.challenges).toEqual([]);
    });

    it('should set loading to true on start actions', () => {
      let state = challengesFeature.reducer(undefined, challengesActions.loadChallenges());
      expect(state.loading).toBe(true);
    });

    it('should populate challenges on load success', () => {
      const mockList = [{ id: 1 } as Challenge];
      const state = challengesFeature.reducer(undefined, challengesActions.loadChallengesSuccess({ challenges: mockList }));
      expect(state.loading).toBe(false);
      expect(state.challenges).toEqual(mockList);
    });

    it('should add challenge on create success', () => {
      const mockItem = { id: 1 } as Challenge;
      const state = challengesFeature.reducer({ challenges: [], loading: true, error: null }, challengesActions.createChallengeSuccess({ challenge: mockItem }));
      expect(state.loading).toBe(false);
      expect(state.challenges).toEqual([mockItem]);
    });

    it('should update challenge on update success', () => {
      const initial = { challenges: [{ id: 1, title: 'Old' } as Challenge], loading: true, error: null };
      const updated = { id: 1, title: 'New' } as Challenge;
      const state = challengesFeature.reducer(initial, challengesActions.updateChallengeSuccess({ challenge: updated }));
      expect(state.challenges[0].title).toBe('New');
    });

    it('should remove challenge on delete success', () => {
      const initial = { challenges: [{ id: 1 } as Challenge], loading: true, error: null };
      const state = challengesFeature.reducer(initial, challengesActions.deleteChallengeSuccess({ id: 1 }));
      expect(state.challenges.length).toBe(0);
    });

    it('should set error on failure actions', () => {
      const state = challengesFeature.reducer(undefined, challengesActions.loadChallengesFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');
    });
  });

  describe('Effects', () => {
    it('should load challenges', (done) => {
      challengesServiceSpy.getChallenges.mockReturnValue(of([]));
      actions$ = of(challengesActions.loadChallenges());

      TestBed.runInInjectionContext(() => {
        loadChallengesEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.loadChallengesSuccess({ challenges: [] }));
          done();
        });
      });
    });

    it('should handle load challenges failure', (done) => {
      challengesServiceSpy.getChallenges.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(challengesActions.loadChallenges());

      TestBed.runInInjectionContext(() => {
        loadChallengesEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.loadChallengesFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should create challenge', (done) => {
      const item = { id: 1 } as Challenge;
      challengesServiceSpy.createChallenge.mockReturnValue(of(item));
      actions$ = of(challengesActions.createChallenge({ name: '', description: '', scope: 'GLOBAL', taskId: 1, requiredTags: [], startAt: '', endAt: '', status: 'ACTIVE' }));

      TestBed.runInInjectionContext(() => {
        createChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.createChallengeSuccess({ challenge: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle create challenge failure', (done) => {
      challengesServiceSpy.createChallenge.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(challengesActions.createChallenge({ name: '', description: '', scope: 'GLOBAL', taskId: 1, requiredTags: [], startAt: '', endAt: '', status: 'ACTIVE' }));

      TestBed.runInInjectionContext(() => {
        createChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.createChallengeFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should update challenge', (done) => {
      const item = { id: 1 } as Challenge;
      challengesServiceSpy.updateChallenge.mockReturnValue(of(item));
      actions$ = of(challengesActions.updateChallenge({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.updateChallengeSuccess({ challenge: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle update challenge failure', (done) => {
      challengesServiceSpy.updateChallenge.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(challengesActions.updateChallenge({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.updateChallengeFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should delete challenge', (done) => {
      challengesServiceSpy.deleteChallenge.mockReturnValue(of({}));
      actions$ = of(challengesActions.deleteChallenge({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.deleteChallengeSuccess({ id: 1 }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle delete challenge failure', (done) => {
      challengesServiceSpy.deleteChallenge.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(challengesActions.deleteChallenge({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.deleteChallengeFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should join challenge', (done) => {
      const item = { id: 1 } as Challenge;
      challengesServiceSpy.joinChallenge.mockReturnValue(of(item));
      actions$ = of(challengesActions.joinChallenge({ id: 1, userId: 1, currentParticipants: [] }));

      TestBed.runInInjectionContext(() => {
        joinChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.joinChallengeSuccess({ challenge: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle join challenge failure', (done) => {
      challengesServiceSpy.joinChallenge.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(challengesActions.joinChallenge({ id: 1, userId: 1, currentParticipants: [] }));

      TestBed.runInInjectionContext(() => {
        joinChallengeEffect().subscribe(res => {
          expect(res).toEqual(challengesActions.joinChallengeFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
