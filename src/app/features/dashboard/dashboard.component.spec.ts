import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { tasksFeature } from '../../store/tasks.store';
import { challengesFeature } from '../../store/challenges.store';
import { telemetryFeature } from '../../store/telemetry.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideStore({
          [tasksFeature.name]: tasksFeature.reducer,
          [challengesFeature.name]: challengesFeature.reducer,
          [telemetryFeature.name]: telemetryFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
