import { TestBed } from '@angular/core/testing';
import { ChallengesComponent } from './challenges.component';
import { provideStore } from '@ngrx/store';
import { challengesFeature } from '../../store/challenges.store';
import { tasksFeature } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ChallengesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesComponent],
      providers: [
        provideStore({
          [challengesFeature.name]: challengesFeature.reducer,
          [tasksFeature.name]: tasksFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ChallengesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
