import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { User } from '../models';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get users', (done) => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', email: 'alice@test.com', points: 100, level: 1, badge: 'bronze' }
    ];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should update user', (done) => {
    const updateData = { points: 150 };
    const updatedUser = { id: 1, name: 'Alice', email: 'alice@test.com', points: 150, level: 1, badge: 'bronze' };

    service.updateUser(1, updateData).subscribe(user => {
      expect(user).toEqual(updatedUser);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/users/1');
    expect(req.request.method).toBe('PATCH');
    req.flush(updatedUser);
  });
});
