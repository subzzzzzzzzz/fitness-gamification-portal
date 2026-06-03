import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { leaderboardFeature, leaderboardActions, loadLeaderboardEffect, triggerRankJobEffect, triggerGameJobEffect } from './leaderboard.store';
import { LeaderboardService } from '../core/services/leaderboard.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../core/models';

describe('Leaderboard Store & Effects', () => {
  let actions$: Observable<any>;
  let leaderboardServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    leaderboardServiceSpy = {
      getRankings: jest.fn(),
      triggerRankCalculation: jest.fn(),
      triggerGamificationJob: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: LeaderboardService, useValue: leaderboardServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = leaderboardFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.rankings).toEqual([]);
    });

    it('should handle loadLeaderboard', () => {
      let state = leaderboardFeature.reducer(undefined, leaderboardActions.loadLeaderboard());
      expect(state.loading).toBe(true);

      state = leaderboardFeature.reducer(state, leaderboardActions.loadLeaderboardSuccess({ rankings: [{ id: 1 } as User] }));
      expect(state.loading).toBe(false);
      expect(state.rankings.length).toBe(1);

      state = leaderboardFeature.reducer(state, leaderboardActions.loadLeaderboardFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');
    });

    it('should handle jobs', () => {
      let state = leaderboardFeature.reducer(undefined, leaderboardActions.triggerRankJob());
      expect(state.jobRunning).toBe(true);

      state = leaderboardFeature.reducer(state, leaderboardActions.triggerRankJobSuccess({ message: 'done' }));
      expect(state.jobRunning).toBe(false);

      state = leaderboardFeature.reducer(state, leaderboardActions.triggerRankJobFailure({ error: 'err' }));
      expect(state.jobRunning).toBe(false);
      expect(state.error).toBe('err');
    });
  });

  describe('Effects', () => {
    it('should load rankings', (done) => {
      leaderboardServiceSpy.getRankings.mockReturnValue(of([]));
      actions$ = of(leaderboardActions.loadLeaderboard());

      TestBed.runInInjectionContext(() => {
        loadLeaderboardEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.loadLeaderboardSuccess({ rankings: [] }));
          done();
        });
      });
    });

    it('should handle load rankings failure', (done) => {
      leaderboardServiceSpy.getRankings.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(leaderboardActions.loadLeaderboard());

      TestBed.runInInjectionContext(() => {
        loadLeaderboardEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.loadLeaderboardFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should trigger rank job', (done) => {
      leaderboardServiceSpy.triggerRankCalculation.mockReturnValue(of({ message: 'Job finished' }));
      actions$ = of(leaderboardActions.triggerRankJob());

      TestBed.runInInjectionContext(() => {
        triggerRankJobEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.triggerRankJobSuccess({ message: 'Job finished' }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle trigger rank job failure', (done) => {
      leaderboardServiceSpy.triggerRankCalculation.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(leaderboardActions.triggerRankJob());

      TestBed.runInInjectionContext(() => {
        triggerRankJobEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.triggerRankJobFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should trigger game job', (done) => {
      leaderboardServiceSpy.triggerGamificationJob.mockReturnValue(of({ message: 'Job finished' }));
      actions$ = of(leaderboardActions.triggerGameJob());

      TestBed.runInInjectionContext(() => {
        triggerGameJobEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.triggerGameJobSuccess({ message: 'Job finished' }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle trigger game job failure', (done) => {
      leaderboardServiceSpy.triggerGamificationJob.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(leaderboardActions.triggerGameJob());

      TestBed.runInInjectionContext(() => {
        triggerGameJobEffect().subscribe(res => {
          expect(res).toEqual(leaderboardActions.triggerGameJobFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
