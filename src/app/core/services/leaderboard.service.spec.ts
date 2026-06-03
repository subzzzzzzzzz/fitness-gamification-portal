import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../models';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LeaderboardService]
    });
    service = TestBed.inject(LeaderboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get rankings sorted by points', (done) => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', email: 'alice@test.com', points: 100, level: 1, badge: 'bronze' }
    ];

    service.getRankings().subscribe(users => {
      expect(users).toEqual(mockUsers);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/users?_sort=-points');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should trigger rank calculation', (done) => {
    const mockRes = { message: 'success' };

    service.triggerRankCalculation().subscribe(res => {
      expect(res).toEqual(mockRes);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/rank');
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });

  it('should trigger gamification job', (done) => {
    const mockRes = { message: 'success' };

    service.triggerGamificationJob().subscribe(res => {
      expect(res).toEqual(mockRes);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/game');
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);
  });
});
