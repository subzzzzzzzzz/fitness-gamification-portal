import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideStore, Store } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { tasksFeature } from '../../store/tasks.store';
import { challengesFeature } from '../../store/challenges.store';
import { telemetryFeature } from '../../store/telemetry.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../core/services/auth.service';
import { Challenge, Task } from '../../core/models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let store: Store;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      currentUser: jest.fn().mockReturnValue({
        id: 42,
        name: 'Jane Doe',
        points: 500,
        role: 'ROLE_USER'
      })
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideStore({
          [tasksFeature.name]: tasksFeature.reducer,
          [challengesFeature.name]: challengesFeature.reducer,
          [telemetryFeature.name]: telemetryFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should read userName, userPoints, and userId', () => {
    expect(component.userName()).toBe('Jane Doe');
    expect(component.userPoints()).toBe(500);
    expect(component.userId()).toBe(42);
  });

  it('should preview up to 4 tasks', () => {
    const mockTasks: Task[] = [
      { id: 1 } as Task,
      { id: 2 } as Task,
      { id: 3 } as Task,
      { id: 4 } as Task,
      { id: 5 } as Task
    ];
    jest.spyOn(component, 'allTasks').mockReturnValue(mockTasks);
    expect(component.dashboardTasks().length).toBe(4);
  });

  it('should return challenges joined by user', () => {
    const mockChallenges: Challenge[] = [
      { id: 1, participants: [42] } as Challenge,
      { id: 2, participants: [1] } as Challenge,
      { id: 3, participants: [42, 99] } as Challenge
    ];
    jest.spyOn(component, 'allChallenges').mockReturnValue(mockChallenges);
    expect(component.joinedChallenges().length).toBe(2);
  });

  it('should get task progress details', () => {
    expect(component.getTaskProgressSteps(1, 500)).toBe('125 / 500');
    expect(component.getTaskProgressSteps(999, 100)).toBe('0 / 100');

    expect(component.getTaskProgressPercent(1)).toBe(25);
    expect(component.getTaskProgressPercent(999)).toBe(0);
  });

  it('should calculate bar height percentage', () => {
    expect(component.getBarHeightPercentage(7500)).toBe(50);
    expect(component.getBarHeightPercentage(20000)).toBe(100);
  });

  it('should return correct bar class based on steps', () => {
    expect(component.getBarClass(12000)).toBe('green');
    expect(component.getBarClass(7000)).toBe('amber');
    expect(component.getBarClass(100)).toBe('red');
  });

  it('should return correct challenge expiry text', () => {
    expect(component.getChallengeExpiryText({ id: 1, status: 'ACTIVE' })).toBe('Expires in 11d');
    expect(component.getChallengeExpiryText({ id: 1, status: 'CLOSED' })).toBe('Closed');
    expect(component.getChallengeExpiryText({ id: 999, status: 'ACTIVE' })).toBe('Expires soon');
  });

  it('should format reward pill class', () => {
    expect(component.getRewardPillClass('Gold Badge')).toBe('gold-badge');
  });
});
