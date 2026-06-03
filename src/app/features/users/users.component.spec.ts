import { TestBed } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { provideStore } from '@ngrx/store';
import { usersFeature } from '../../store/users.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('UsersComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        provideStore({
          [usersFeature.name]: usersFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
