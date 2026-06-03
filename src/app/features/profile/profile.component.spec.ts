import { TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { provideStore } from '@ngrx/store';
import { telemetryFeature } from '../../store/telemetry.store';
import { leaderboardFeature } from '../../store/leaderboard.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ProfileComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideStore({
          [telemetryFeature.name]: telemetryFeature.reducer,
          [leaderboardFeature.name]: leaderboardFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
