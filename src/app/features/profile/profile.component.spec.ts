import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { provideStore, Store } from '@ngrx/store';
import { telemetryFeature } from '../../store/telemetry.store';
import { leaderboardFeature, leaderboardActions } from '../../store/leaderboard.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthService } from '../../core/services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let store: Store;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      currentUser: jest.fn().mockReturnValue({
        id: 42,
        name: 'Jane Doe',
        email: 'jane@example.com',
        points: 500,
        region: 'US',
        phone: '123-456-7890',
        city: 'New York',
        role: 'ROLE_USER'
      })
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideStore({
          [telemetryFeature.name]: telemetryFeature.reducer,
          [leaderboardFeature.name]: leaderboardFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct user values from auth service', () => {
    expect(component.userId()).toBe(42);
    expect(component.userName()).toBe('Jane Doe');
    expect(component.userEmail()).toBe('jane@example.com');
    expect(component.userPoints()).toBe(500);
    expect(component.userRegion()).toBe('US');
    expect(component.userPhone()).toBe('123-456-7890');
    expect(component.userCity()).toBe('New York');
    expect(component.isAdmin()).toBe(false);
    expect(component.userInitials()).toBe('JD');
  });

  it('should support default initials if name is empty', () => {
    authServiceSpy.currentUser.mockReturnValue({
      id: 1,
      name: '',
      email: '',
      points: 0,
      region: '',
      phone: '',
      city: '',
      role: ''
    });
    expect(component.userInitials()).toBe('');
  });

  it('should alert on editProfile', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.editProfile();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should format badge class correctly', () => {
    expect(component.getBadgeClass('Golden Medal')).toBe('golden-medal');
  });

  it('should dispatch triggerRankJob on triggerRankJob call', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.triggerRankJob();
    expect(dispatchSpy).toHaveBeenCalledWith(leaderboardActions.triggerRankJob());
  });

  it('should dispatch triggerGameJob on triggerGameJob call', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.triggerGameJob();
    expect(dispatchSpy).toHaveBeenCalledWith(leaderboardActions.triggerGameJob());
  });
});
