import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TelemetryService } from '../core/services/telemetry.service';
import { ToastService } from '../core/services/toast.service';
import { Telemetry, Badge } from '../core/models';

export interface TelemetryState {
  telemetryLogs: Telemetry[];
  badges: Badge[];
  loading: boolean;
  error: string | null;
}

const initialState: TelemetryState = {
  telemetryLogs: [],
  badges: [],
  loading: false,
  error: null
};

export const telemetryActions = createActionGroup({
  source: 'Telemetry',
  events: {
    'Load Telemetry And Badges': props<{ userId: number }>(),
    'Load Telemetry And Badges Success': props<{ telemetryLogs: Telemetry[]; badges: Badge[] }>(),
    'Load Telemetry And Badges Failure': props<{ error: string }>(),
    'Submit Telemetry': props<{ userId: number; stepCount: number; heartRate: number; calories: number; distance: number; submittedAt: string; tagValues?: { [key: string]: any } }>(),
    'Submit Telemetry Success': props<{ telemetry: Telemetry }>(),
    'Submit Telemetry Failure': props<{ error: string }>()
  }
});

export const telemetryFeature = createFeature({
  name: 'telemetry',
  reducer: createReducer(
    initialState,
    on(telemetryActions.loadTelemetryAndBadges, telemetryActions.submitTelemetry, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(telemetryActions.loadTelemetryAndBadgesSuccess, (state, { telemetryLogs, badges }) => ({
      ...state,
      loading: false,
      telemetryLogs,
      badges
    })),
    on(telemetryActions.loadTelemetryAndBadgesFailure, telemetryActions.submitTelemetryFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(telemetryActions.submitTelemetrySuccess, (state, { telemetry }) => ({
      ...state,
      loading: false,
      telemetryLogs: [telemetry, ...state.telemetryLogs]
    }))
  )
});

// Functional Effects
export const loadTelemetryEffect = createEffect(
  (actions$ = inject(Actions), telemetryService = inject(TelemetryService)) => {
    return actions$.pipe(
      ofType(telemetryActions.loadTelemetryAndBadges),
      switchMap(({ userId }) =>
        telemetryService.getDashboardData(userId).pipe(
          map(([telemetryLogs, badges]) => telemetryActions.loadTelemetryAndBadgesSuccess({ telemetryLogs, badges })),
          catchError(err => of(telemetryActions.loadTelemetryAndBadgesFailure({ error: err.error?.message || 'Failed to load telemetry/badges' })))
        )
      )
    );
  },
  { functional: true }
);

export const submitTelemetryEffect = createEffect(
  (actions$ = inject(Actions), telemetryService = inject(TelemetryService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(telemetryActions.submitTelemetry),
      switchMap(telemetryData =>
        telemetryService.submitTelemetry(telemetryData).pipe(
          map(telemetry => {
            toastService.success('Activity Logged!', `${telemetry.stepCount} steps submitted successfully.`);
            return telemetryActions.submitTelemetrySuccess({ telemetry });
          }),
          catchError(err => of(telemetryActions.submitTelemetryFailure({ error: err.error?.message || 'Failed to submit telemetry' })))
        )
      )
    );
  },
  { functional: true }
);
