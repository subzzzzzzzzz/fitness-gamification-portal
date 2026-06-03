import { TestBed, ComponentFixture } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { provideStore, Store } from '@ngrx/store';
import { usersFeature, usersActions } from '../../store/users.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { User } from '../../core/models';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let store: Store;

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

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should rank, search, and filter users by region', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice Smith', email: 'alice@test.com', points: 100, role: 'ROLE_USER', region: 'APAC' } as any,
      { id: 2, name: 'Bob Admin', email: 'bob@test.com', points: 500, role: 'ROLE_ADMIN', region: 'APAC' } as any,
      { id: 3, name: 'Charlie User', email: 'charlie@test.com', points: 300, role: 'ROLE_USER', region: 'US' } as any
    ];
    store.dispatch(usersActions.loadUsersSuccess({ users: mockUsers }));
    fixture.detectChanges();

    // Ranked users should exclude admins and sort by points descending
    expect(component.rankedUsers().length).toBe(2);
    expect(component.rankedUsers()[0].id).toBe(3); // Charlie (300 points)
    expect(component.rankedUsers()[1].id).toBe(1); // Alice (100 points)

    // Search query matching Charlie
    component.onSearchInput({ target: { value: 'charlie' } } as any);
    fixture.detectChanges();
    expect(component.sortedFilteredUsers().length).toBe(1);
    expect(component.sortedFilteredUsers()[0].id).toBe(3);

    // Reset search, set region filter to APAC
    component.onSearchInput({ target: { value: '' } } as any);
    component.setRegionFilter('APAC');
    fixture.detectChanges();
    expect(component.sortedFilteredUsers().length).toBe(1);
    expect(component.sortedFilteredUsers()[0].id).toBe(1); // Alice
  });

  it('should return user initials', () => {
    expect(component.getInitials('John Doe')).toBe('JD');
  });

  it('should generate avatar background color', () => {
    expect(component.getAvatarBgColor(0)).toBe('#3b82f6');
    expect(component.getAvatarBgColor(1)).toBe('#ef4444');
  });

  it('should calculate points percentage', () => {
    expect(component.getPointsPercentage(2500)).toBe(50);
  });

  it('should return user rank', () => {
    const mockUsers: User[] = [
      { id: 10, name: 'User A', points: 500, role: 'ROLE_USER' } as any,
      { id: 20, name: 'User B', points: 100, role: 'ROLE_USER' } as any
    ];
    store.dispatch(usersActions.loadUsersSuccess({ users: mockUsers }));
    fixture.detectChanges();

    expect(component.getUserRank(10)).toBe(1);
    expect(component.getUserRank(20)).toBe(2);
    expect(component.getUserRank(999)).toBe(1); // fallback
  });

  it('should return stars array based on points', () => {
    expect(component.getStarsArray(3400).length).toBe(4);
    expect(component.getStarsArray(3250).length).toBe(3);
    expect(component.getStarsArray(100).length).toBe(2);
  });

  it('should alert on onView', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const user = { name: 'Alice', points: 100, region: 'US' } as User;
    component.onView(user);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should prompt and dispatch updateUser on valid points edit', () => {
    const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('450');
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const user = { id: 5, name: 'Alice', points: 100 } as User;

    component.onEdit(user);
    expect(promptSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(usersActions.updateUser({
      id: 5,
      changes: { points: 450 }
    }));

    promptSpy.mockRestore();
  });

  it('should not dispatch updateUser if prompt cancelled or invalid input', () => {
    const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue(null);
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const user = { id: 5, name: 'Alice', points: 100 } as User;

    component.onEdit(user);
    expect(dispatchSpy).not.toHaveBeenCalled();

    promptSpy.mockReturnValue('invalid-number');
    component.onEdit(user);
    expect(dispatchSpy).not.toHaveBeenCalled();

    promptSpy.mockRestore();
  });
});
