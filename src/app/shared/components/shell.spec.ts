import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ShellComponent } from './shell';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;
  let authServiceMock: any;
  let router: Router;
  let navigateSpy: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUser: signal(null),
      logout: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default userName to User and email to empty if not logged in', () => {
    expect(component.userName()).toBe('User');
    expect(component.userEmail()).toBe('');
    expect(component.isAdmin()).toBe(false);
  });

  it('should return correct user values when logged in', () => {
    authServiceMock.currentUser.set({ name: 'Alice Smith', email: 'alice@test.com', role: 'ROLE_ADMIN' });
    fixture.detectChanges();

    expect(component.userName()).toBe('Alice Smith');
    expect(component.userEmail()).toBe('alice@test.com');
    expect(component.isAdmin()).toBe(true);
    expect(component.userInitials()).toBe('AS');
  });

  it('should toggle theme', () => {
    expect(component.theme()).toBe('light');
    component.toggleTheme();
    expect(component.theme()).toBe('dark');
    component.toggleTheme();
    expect(component.theme()).toBe('light');
  });

  it('should toggle sidebar menuOpen state', () => {
    expect(component.menuOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.menuOpen()).toBe(true);
    component.toggleSidebar();
    expect(component.menuOpen()).toBe(false);
  });

  it('should toggle dropdownOpen state', () => {
    expect(component.dropdownOpen()).toBe(false);
    component.toggleDropdown();
    expect(component.dropdownOpen()).toBe(true);
    component.toggleDropdown();
    expect(component.dropdownOpen()).toBe(false);
  });

  it('should navigate to home based on admin status', () => {
    // Normal user
    component.navigateToHome();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);

    // Admin user
    authServiceMock.currentUser.set({ name: 'Admin User', email: 'admin@test.com', role: 'ROLE_ADMIN' });
    component.navigateToHome();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/tasks']);
  });

  it('should navigate to profile and close dropdown', () => {
    component.dropdownOpen.set(true);
    component.goToProfile();
    expect(component.dropdownOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should show notifications alert', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.showNotifications();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should log out and close dropdown', () => {
    component.dropdownOpen.set(true);
    component.logout();
    expect(component.dropdownOpen()).toBe(false);
    expect(authServiceMock.logout).toHaveBeenCalled();
  });
});
