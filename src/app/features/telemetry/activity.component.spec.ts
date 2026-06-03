import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivityComponent } from './activity.component';
import { provideStore, Store } from '@ngrx/store';
import { telemetryFeature, telemetryActions } from '../../store/telemetry.store';
import { devicesFeature, devicesActions } from '../../store/devices.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { Device, Telemetry } from '../../core/models';

describe('ActivityComponent', () => {
  let component: ActivityComponent;
  let fixture: ComponentFixture<ActivityComponent>;
  let store: Store;
  let authServiceSpy: any;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal({
      id: 42,
      name: 'Jane Doe',
      points: 250,
      streak: 8,
      role: 'ROLE_USER'
    });
    authServiceSpy = {
      currentUser: currentUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [ActivityComponent, ReactiveFormsModule],
      providers: [
        provideStore({
          [telemetryFeature.name]: telemetryFeature.reducer,
          [devicesFeature.name]: devicesFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve user info correctly from authService', () => {
    expect(component.userId()).toBe(42);
    expect(component.userPoints()).toBe(250);
    expect(component.streakCount()).toBe(8);

    currentUserSignal.set(null);
    expect(component.userId()).toBe(1);
    expect(component.userPoints()).toBe(0);
    expect(component.streakCount()).toBe(5);
  });

  it('should resolve device details', () => {
    const mockDevices: Device[] = [
      { id: 1, name: 'Watch Alpha', manufacturer: 'Brand A', assignedUserIds: [99], status: 'Active', tags: ['STEPS'] },
      { id: 2, name: 'Watch Beta', manufacturer: 'Brand B', assignedUserIds: [42], status: 'Active', tags: ['STEPS', 'HRM'] }
    ];
    store.dispatch(devicesActions.loadDevicesSuccess({ devices: mockDevices }));
    fixture.detectChanges();

    expect(component.deviceName()).toBe('Watch Beta');
    expect(component.deviceManufacturer()).toBe('Brand B');
    expect(component.deviceTags()).toEqual(['STEPS', 'HRM']);
  });

  it('should fallback device details when no device assigned', () => {
    const mockDevices: Device[] = [
      { id: 1, name: 'Watch Alpha', manufacturer: 'Brand A', assignedUserIds: [99], status: 'Active', tags: ['STEPS'] }
    ];
    store.dispatch(devicesActions.loadDevicesSuccess({ devices: mockDevices }));
    fixture.detectChanges();

    expect(component.deviceName()).toBe('Watch Alpha');
  });

  it('should calculate history, last7DaysLogs, todaySteps, and goalPercent', () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const mockLogs: Telemetry[] = [
      { id: 1, userId: 42, stepCount: 8000, heartRate: 70, calories: 320, distance: 6, submittedAt: `${todayStr}T08:00:00.000Z`, tagValues: {} },
      { id: 2, userId: 42, stepCount: 12000, heartRate: 72, calories: 480, distance: 9, submittedAt: '2026-06-02T08:00:00.000Z', tagValues: {} },
      { id: 3, userId: 99, stepCount: 5000, heartRate: 68, calories: 200, distance: 3.75, submittedAt: '2026-06-01T08:00:00.000Z', tagValues: {} }
    ];
    store.dispatch(telemetryActions.loadTelemetryAndBadgesSuccess({ telemetryLogs: mockLogs, badges: [] }));
    fixture.detectChanges();

    expect(component.historyLogs().length).toBe(2);
    expect(component.last7DaysLogs().length).toBe(2);
    expect(component.todaySteps()).toBe(8000);

    // Goal percent (based on previewSteps, which defaults to 7722)
    expect(component.goalPercent()).toBe(77);
  });

  it('should run updatePreview and change preview properties', () => {
    component.logForm.patchValue({
      activityDate: '2026-06-01',
      stepCount: 9500
    });
    component.updatePreview();

    expect(component.previewDate()).toBe('2026-06-01');
    expect(component.previewSteps()).toBe(9500);
    expect(component.logForm.get('stepsVal')?.value).toBe(9500);
  });

  it('should step steps value up and down', () => {
    component.logForm.patchValue({ stepCount: 1000 });
    component.stepSteps(500);
    expect(component.logForm.get('stepCount')?.value).toBe(1500);

    component.stepSteps(-2000);
    expect(component.logForm.get('stepCount')?.value).toBe(1); // floor at 1
  });

  it('should return bar height percentage, classes, and goal badge info', () => {
    expect(component.getBarHeightPercentage(7500)).toBe(50);
    expect(component.getBarHeightPercentage(20000)).toBe(100);

    expect(component.getBarClass(11000)).toBe('green');
    expect(component.getBarClass(7500)).toBe('amber');
    expect(component.getBarClass(2000)).toBe('red');

    expect(component.getGoalBadgeText(11000)).toBe('Goal Met');
    expect(component.getGoalBadgeText(7500)).toBe('Near Goal');
    expect(component.getGoalBadgeText(2000)).toBe('Below Goal');

    expect(component.getGoalBadgeClass(11000)).toBe('goal-met');
    expect(component.getGoalBadgeClass(7500)).toBe('near-goal');
    expect(component.getGoalBadgeClass(2000)).toBe('below-goal');

    expect(component.calculatePoints(10500)).toBe(105);
  });

  it('should handle form visibility and submitting telemetry log', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    component.openLogForm();
    expect(component.isFormOpen()).toBe(true);

    component.logForm.patchValue({
      activityDate: '2026-06-03',
      stepCount: 10000,
      hrVal: 80
    });
    component.onFormSubmit();

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: telemetryActions.submitTelemetry.type,
      stepCount: 10000,
      heartRate: 80
    }));
    expect(component.isFormOpen()).toBe(false);
  });

  it('should show errors on form submit when form invalid', () => {
    component.openLogForm();
    component.logForm.patchValue({ stepCount: null }); // invalid steps count
    component.onFormSubmit();

    expect(component.showErrors()).toBe(true);
    expect(component.isFormOpen()).toBe(true);
  });

  it('should support search input placeholder method', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    component.onUserSearchInput(null);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
