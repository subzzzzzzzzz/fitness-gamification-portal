import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = { navigate: jest.fn() };
    
    // Clear localStorage
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with user from localStorage if present', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Create new service instance to trigger constructor
    const newService = TestBed.runInInjectionContext(() => new AuthService());
    expect(newService.currentUser()).toEqual(mockUser);
  });

  it('should clear localStorage on invalid JSON in constructor', () => {
    localStorage.setItem('user', 'invalid-json');
    localStorage.setItem('token', 'token');
    
    const newService = TestBed.runInInjectionContext(() => new AuthService());
    expect(newService.currentUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should login and set localStorage', (done) => {
    const mockRes = { token: 'tok123', user: { id: '1', name: 'User', email: 'user@test.com' } };
    
    service.login({ email: 'user@test.com', password: 'password' }).subscribe(res => {
      expect(res).toEqual(mockRes);
      expect(localStorage.getItem('token')).toBe('tok123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockRes.user));
      expect(service.currentUser()).toEqual(mockRes.user);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should register and set localStorage', (done) => {
    const mockRes = { token: 'tok123', user: { id: '1', name: 'User', email: 'user@test.com' } };
    
    service.register({ name: 'User', email: 'user@test.com', password: 'password' }).subscribe(res => {
      expect(res).toEqual(mockRes);
      expect(localStorage.getItem('token')).toBe('tok123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockRes.user));
      expect(service.currentUser()).toEqual(mockRes.user);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should logout and navigate to login page', () => {
    localStorage.setItem('token', 'tok123');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
