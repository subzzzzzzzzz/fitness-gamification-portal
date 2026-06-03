import { TestBed } from '@angular/core/testing';
import { LeaderboardComponent } from './leaderboard.component';
import { provideStore } from '@ngrx/store';
import { leaderboardFeature } from '../../store/leaderboard.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('LeaderboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent],
      providers: [
        provideStore({
          [leaderboardFeature.name]: leaderboardFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LeaderboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
