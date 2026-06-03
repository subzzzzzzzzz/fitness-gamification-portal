import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LeaderboardComponent } from './leaderboard.component';
import { provideStore, Store } from '@ngrx/store';
import { leaderboardFeature, leaderboardActions } from '../../store/leaderboard.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

describe('LeaderboardComponent', () => {
  let component: LeaderboardComponent;
  let fixture: ComponentFixture<LeaderboardComponent>;
  let store: Store;
  let authServiceSpy: any;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal({
      id: 42,
      name: 'Jane Doe',
      points: 500,
      role: 'ROLE_USER',
      region: 'US'
    });
    authServiceSpy = {
      currentUser: currentUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent],
      providers: [
        provideStore({
          [leaderboardFeature.name]: leaderboardFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter non-user roles from rankings', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', role: 'ROLE_USER' } as any,
      { id: 2, name: 'Bob', role: 'ROLE_ADMIN' } as any,
      { id: 3, name: 'Charlie', role: 'ROLE_USER' } as any
    ];
    store.dispatch(leaderboardActions.loadLeaderboardSuccess({ rankings: mockUsers }));
    fixture.detectChanges();

    expect(component.rankedUsers().length).toBe(2);
    expect(component.rankedUsers()[0].name).toBe('Alice');
    expect(component.rankedUsers()[1].name).toBe('Charlie');
  });

  it('should calculate correct userRank', () => {
    const mockUsers: User[] = [
      { id: 10, name: 'User A', role: 'ROLE_USER' } as any,
      { id: 42, name: 'User B', role: 'ROLE_USER' } as any,
      { id: 30, name: 'User C', role: 'ROLE_USER' } as any
    ];
    store.dispatch(leaderboardActions.loadLeaderboardSuccess({ rankings: mockUsers }));
    fixture.detectChanges();

    // Current user id is 42, so rank should be 2
    expect(component.userRank()).toBe(2);

    // Current user id not in list
    currentUserSignal.set({ id: 99, role: 'ROLE_USER' });
    fixture.detectChanges();
    expect(component.userRank()).toBe(13); // fallback value
  });

  it('should dispatch triggerRankJob on triggerRankUpdate call', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.triggerRankUpdate();
    expect(dispatchSpy).toHaveBeenCalledWith(leaderboardActions.triggerRankJob());
  });

  it('should return user initials', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
    expect(component.getInitials('')).toBe('');
  });

  it('should generate avatar background color', () => {
    expect(component.getAvatarBgColor(0)).toBe('#3b82f6');
    expect(component.getAvatarBgColor(1)).toBe('#ef4444');
  });

  it('should calculate points percentage', () => {
    expect(component.getPointsPercentage(2500)).toBe(50);
    expect(component.getPointsPercentage(6000)).toBe(100);
  });

  it('should return simulated activities count', () => {
    expect(component.getActivitiesCount(1)).toBe(30);
    expect(component.getActivitiesCount(999)).toBe(15);
  });

  it('should return stars array based on points', () => {
    expect(component.getStarsArray(3400).length).toBe(4);
    expect(component.getStarsArray(3250).length).toBe(3);
    expect(component.getStarsArray(100).length).toBe(2);
  });

  it('should return trend icon and class', () => {
    expect(component.getTrendIcon(18)).toBe('arrow-down');
    expect(component.getTrendIcon(1)).toBe('arrow-up');

    expect(component.getTrendClass(18)).toBe('text-error');
    expect(component.getTrendClass(1)).toBe('text-success');
  });
});
