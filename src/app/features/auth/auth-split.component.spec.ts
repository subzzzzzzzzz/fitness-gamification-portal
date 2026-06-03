import { TestBed } from '@angular/core/testing';
import { AuthSplitComponent } from './auth-split.component';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('AuthSplitComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthSplitComponent],
      providers: [
        provideStore({
          [authFeature.name]: authFeature.reducer,
        }),
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AuthSplitComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
