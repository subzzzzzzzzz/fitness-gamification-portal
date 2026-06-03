import { TestBed } from '@angular/core/testing';
import { ActivityComponent } from './activity.component';
import { provideStore } from '@ngrx/store';
import { telemetryFeature } from '../../store/telemetry.store';
import { devicesFeature } from '../../store/devices.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ActivityComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [
        provideStore({
          [telemetryFeature.name]: telemetryFeature.reducer,
          [devicesFeature.name]: devicesFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ActivityComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
