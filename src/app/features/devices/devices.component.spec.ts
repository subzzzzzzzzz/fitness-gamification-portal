import { TestBed } from '@angular/core/testing';
import { DevicesComponent } from './devices.component';
import { provideStore } from '@ngrx/store';
import { devicesFeature } from '../../store/devices.store';
import { usersFeature } from '../../store/users.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('DevicesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesComponent],
      providers: [
        provideStore({
          [devicesFeature.name]: devicesFeature.reducer,
          [usersFeature.name]: usersFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DevicesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
