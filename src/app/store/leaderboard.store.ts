import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { LeaderboardService } from '../core/services/leaderboard.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../core/models';

export interface LeaderboardState {
  rankings: User[];
  loading: boolean;
  jobRunning: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  rankings: [],
  loading: false,
  jobRunning: false,
  error: null
};

export const leaderboardActions = createActionGroup({
  source: 'Leaderboard',
  events: {
    'Load Leaderboard': emptyProps(),
    'Load Leaderboard Success': props<{ rankings: User[] }>(),
    'Load Leaderboard Failure': props<{ error: string }>(),
    'Trigger Rank Job': emptyProps(),
    'Trigger Rank Job Success': props<{ message: string }>(),
    'Trigger Rank Job Failure': props<{ error: string }>(),
    'Trigger Game Job': emptyProps(),
    'Trigger Game Job Success': props<{ message: string }>(),
    'Trigger Game Job Failure': props<{ error: string }>()
  }
});

export const leaderboardFeature = createFeature({
  name: 'leaderboard',
  reducer: createReducer(
    initialState,
    on(leaderboardActions.loadLeaderboard, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(leaderboardActions.loadLeaderboardSuccess, (state, { rankings }) => ({
      ...state,
      loading: false,
      rankings
    })),
    on(leaderboardActions.loadLeaderboardFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(leaderboardActions.triggerRankJob, leaderboardActions.triggerGameJob, (state) => ({
      ...state,
      jobRunning: true,
      error: null
    })),
    on(leaderboardActions.triggerRankJobSuccess, leaderboardActions.triggerGameJobSuccess, (state) => ({
      ...state,
      jobRunning: false
    })),
    on(leaderboardActions.triggerRankJobFailure, leaderboardActions.triggerGameJobFailure, (state, { error }) => ({
      ...state,
      jobRunning: false,
      error
    }))
  )
});

// Functional Effects
export const loadLeaderboardEffect = createEffect(
  (actions$ = inject(Actions), leaderboardService = inject(LeaderboardService)) => {
    return actions$.pipe(
      ofType(leaderboardActions.loadLeaderboard),
      switchMap(() =>
        leaderboardService.getRankings().pipe(
          map(rankings => leaderboardActions.loadLeaderboardSuccess({ rankings })),
          catchError(err => of(leaderboardActions.loadLeaderboardFailure({ error: err.error?.message || 'Failed to load rankings' })))
        )
      )
    );
  },
  { functional: true }
);

export const triggerRankJobEffect = createEffect(
  (actions$ = inject(Actions), leaderboardService = inject(LeaderboardService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(leaderboardActions.triggerRankJob),
      switchMap(() =>
        leaderboardService.triggerRankCalculation().pipe(
          map(res => {
            toastService.success('Success', res.message);
            return leaderboardActions.triggerRankJobSuccess({ message: res.message });
          }),
          catchError(err => of(leaderboardActions.triggerRankJobFailure({ error: err.error?.message || 'Failed to trigger rank job' })))
        )
      )
    );
  },
  { functional: true }
);

export const triggerGameJobEffect = createEffect(
  (actions$ = inject(Actions), leaderboardService = inject(LeaderboardService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(leaderboardActions.triggerGameJob),
      switchMap(() =>
        leaderboardService.triggerGamificationJob().pipe(
          map(res => {
            toastService.success('Success', res.message);
            return leaderboardActions.triggerGameJobSuccess({ message: res.message });
          }),
          catchError(err => of(leaderboardActions.triggerGameJobFailure({ error: err.error?.message || 'Failed to trigger gamification job' })))
        )
      )
    );
  },
  { functional: true }
);
