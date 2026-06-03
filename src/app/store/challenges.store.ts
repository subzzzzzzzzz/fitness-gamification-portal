import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ChallengesService } from '../core/services/challenges.service';
import { ToastService } from '../core/services/toast.service';
import { Challenge } from '../core/models';

export interface ChallengesState {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
}

const initialState: ChallengesState = {
  challenges: [],
  loading: false,
  error: null
};

export const challengesActions = createActionGroup({
  source: 'Challenges',
  events: {
    'Load Challenges': emptyProps(),
    'Load Challenges Success': props<{ challenges: Challenge[] }>(),
    'Load Challenges Failure': props<{ error: string }>(),
    'Create Challenge': props<{ name: string; description: string; scope: 'GLOBAL' | 'REGIONAL' | 'FRIENDLY'; taskId: number; region?: string; requiredTags: string[]; startAt: string; endAt: string; status: 'ACTIVE' | 'CLOSED' }>(),
    'Create Challenge Success': props<{ challenge: Challenge }>(),
    'Create Challenge Failure': props<{ error: string }>(),
    'Update Challenge': props<{ id: number; changes: Partial<Challenge> }>(),
    'Update Challenge Success': props<{ challenge: Challenge }>(),
    'Update Challenge Failure': props<{ error: string }>(),
    'Delete Challenge': props<{ id: number }>(),
    'Delete Challenge Success': props<{ id: number }>(),
    'Delete Challenge Failure': props<{ error: string }>(),
    'Join Challenge': props<{ id: number; userId: number; currentParticipants: number[] }>(),
    'Join Challenge Success': props<{ challenge: Challenge }>(),
    'Join Challenge Failure': props<{ error: string }>()
  }
});

export const challengesFeature = createFeature({
  name: 'challenges',
  reducer: createReducer(
    initialState,
    on(challengesActions.loadChallenges, challengesActions.createChallenge, challengesActions.updateChallenge, challengesActions.deleteChallenge, challengesActions.joinChallenge, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(challengesActions.loadChallengesSuccess, (state, { challenges }) => ({
      ...state,
      loading: false,
      challenges
    })),
    on(challengesActions.loadChallengesFailure, challengesActions.createChallengeFailure, challengesActions.updateChallengeFailure, challengesActions.deleteChallengeFailure, challengesActions.joinChallengeFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(challengesActions.createChallengeSuccess, (state, { challenge }) => ({
      ...state,
      loading: false,
      challenges: [...state.challenges, challenge]
    })),
    on(challengesActions.updateChallengeSuccess, challengesActions.joinChallengeSuccess, (state, { challenge }) => ({
      ...state,
      loading: false,
      challenges: state.challenges.map(c => c.id === challenge.id ? challenge : c)
    })),
    on(challengesActions.deleteChallengeSuccess, (state, { id }) => ({
      ...state,
      loading: false,
      challenges: state.challenges.filter(c => c.id !== id)
    }))
  )
});

// Functional Effects
export const loadChallengesEffect = createEffect(
  (actions$ = inject(Actions), challengesService = inject(ChallengesService)) => {
    return actions$.pipe(
      ofType(challengesActions.loadChallenges),
      switchMap(() =>
        challengesService.getChallenges().pipe(
          map(challenges => challengesActions.loadChallengesSuccess({ challenges })),
          catchError(err => of(challengesActions.loadChallengesFailure({ error: err.error?.message || 'Failed to load challenges' })))
        )
      )
    );
  },
  { functional: true }
);

export const createChallengeEffect = createEffect(
  (actions$ = inject(Actions), challengesService = inject(ChallengesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(challengesActions.createChallenge),
      switchMap(challengeData =>
        challengesService.createChallenge({ ...challengeData, participants: [] }).pipe(
          map(challenge => {
            toastService.success('Success', 'Challenge created successfully!');
            return challengesActions.createChallengeSuccess({ challenge });
          }),
          catchError(err => of(challengesActions.createChallengeFailure({ error: err.error?.message || 'Failed to create challenge' })))
        )
      )
    );
  },
  { functional: true }
);

export const updateChallengeEffect = createEffect(
  (actions$ = inject(Actions), challengesService = inject(ChallengesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(challengesActions.updateChallenge),
      switchMap(({ id, changes }) =>
        challengesService.updateChallenge(id, changes).pipe(
          map(challenge => {
            toastService.success('Success', 'Challenge updated successfully!');
            return challengesActions.updateChallengeSuccess({ challenge });
          }),
          catchError(err => of(challengesActions.updateChallengeFailure({ error: err.error?.message || 'Failed to update challenge' })))
        )
      )
    );
  },
  { functional: true }
);

export const deleteChallengeEffect = createEffect(
  (actions$ = inject(Actions), challengesService = inject(ChallengesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(challengesActions.deleteChallenge),
      switchMap(({ id }) =>
        challengesService.deleteChallenge(id).pipe(
          map(() => {
            toastService.success('Success', 'Challenge deleted successfully!');
            return challengesActions.deleteChallengeSuccess({ id });
          }),
          catchError(err => of(challengesActions.deleteChallengeFailure({ error: err.error?.message || 'Failed to delete challenge' })))
        )
      )
    );
  },
  { functional: true }
);

export const joinChallengeEffect = createEffect(
  (actions$ = inject(Actions), challengesService = inject(ChallengesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(challengesActions.joinChallenge),
      switchMap(({ id, userId, currentParticipants }) =>
        challengesService.joinChallenge(id, userId, currentParticipants).pipe(
          map(challenge => {
            toastService.success('Joined!', 'You have successfully joined the challenge.');
            return challengesActions.joinChallengeSuccess({ challenge });
          }),
          catchError(err => of(challengesActions.joinChallengeFailure({ error: err.error?.message || 'Failed to join challenge' })))
        )
      )
    );
  },
  { functional: true }
);
