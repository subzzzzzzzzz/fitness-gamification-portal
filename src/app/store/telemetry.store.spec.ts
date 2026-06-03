import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { telemetryFeature, telemetryActions, loadTelemetryEffect, submitTelemetryEffect } from './telemetry.store';
import { TelemetryService } from '../core/services/telemetry.service';
import { ToastService } from '../core/services/toast.service';
import { Telemetry, Badge } from '../core/models';

describe('Telemetry Store & Effects', () => {
  let actions$: Observable<any>;
  let telemetryServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    telemetryServiceSpy = {
      getDashboardData: jest.fn(),
      submitTelemetry: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: TelemetryService, useValue: telemetryServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = telemetryFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.telemetryLogs).toEqual([]);
      expect(state.badges).toEqual([]);
    });

    it('should set loading on actions', () => {
      let state = telemetryFeature.reducer(undefined, telemetryActions.loadTelemetryAndBadges({ userId: 1 }));
      expect(state.loading).toBe(true);

      state = telemetryFeature.reducer(state, telemetryActions.loadTelemetryAndBadgesSuccess({ telemetryLogs: [{ id: 1 } as Telemetry], badges: [{ id: 1 } as Badge] }));
      expect(state.loading).toBe(false);
      expect(state.telemetryLogs.length).toBe(1);
      expect(state.badges.length).toBe(1);

      state = telemetryFeature.reducer(state, telemetryActions.loadTelemetryAndBadgesFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');
    });

    it('should prepend telemetry on submit success', () => {
      const initial = { telemetryLogs: [{ id: 1 } as Telemetry], badges: [], loading: true, error: null };
      const next = { id: 2 } as Telemetry;
      const state = telemetryFeature.reducer(initial, telemetryActions.submitTelemetrySuccess({ telemetry: next }));
      expect(state.loading).toBe(false);
      expect(state.telemetryLogs[0].id).toBe(2);
      expect(state.telemetryLogs.length).toBe(2);
    });
  });

  describe('Effects', () => {
    it('should load telemetry and badges', (done) => {
      const mockLogs: Telemetry[] = [];
      const mockBadges: Badge[] = [];
      telemetryServiceSpy.getDashboardData.mockReturnValue(of([mockLogs, mockBadges]));
      actions$ = of(telemetryActions.loadTelemetryAndBadges({ userId: 1 }));

      TestBed.runInInjectionContext(() => {
        loadTelemetryEffect().subscribe(res => {
          expect(res).toEqual(telemetryActions.loadTelemetryAndBadgesSuccess({ telemetryLogs: mockLogs, badges: mockBadges }));
          done();
        });
      });
    });

    it('should handle load telemetry failure', (done) => {
      telemetryServiceSpy.getDashboardData.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(telemetryActions.loadTelemetryAndBadges({ userId: 1 }));

      TestBed.runInInjectionContext(() => {
        loadTelemetryEffect().subscribe(res => {
          expect(res).toEqual(telemetryActions.loadTelemetryAndBadgesFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should submit telemetry', (done) => {
      const item = { id: 1, stepCount: 1000 } as Telemetry;
      telemetryServiceSpy.submitTelemetry.mockReturnValue(of(item));
      actions$ = of(telemetryActions.submitTelemetry({ userId: 1, stepCount: 1000, heartRate: 72, calories: 100, distance: 1.0, submittedAt: '' }));

      TestBed.runInInjectionContext(() => {
        submitTelemetryEffect().subscribe(res => {
          expect(res).toEqual(telemetryActions.submitTelemetrySuccess({ telemetry: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle submit telemetry failure', (done) => {
      telemetryServiceSpy.submitTelemetry.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(telemetryActions.submitTelemetry({ userId: 1, stepCount: 1000, heartRate: 72, calories: 100, distance: 1.0, submittedAt: '' }));

      TestBed.runInInjectionContext(() => {
        submitTelemetryEffect().subscribe(res => {
          expect(res).toEqual(telemetryActions.submitTelemetryFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
