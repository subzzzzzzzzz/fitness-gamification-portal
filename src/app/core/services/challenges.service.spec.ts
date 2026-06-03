import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChallengesService } from './challenges.service';
import { Challenge } from '../models';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChallengesService]
    });
    service = TestBed.inject(ChallengesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get challenges', (done) => {
    const mockChallenges: Challenge[] = [
      { id: 1, title: 'Ch 1', description: 'Desc 1', type: 'steps', target: 10000, startDate: '', endDate: '', status: 'active', participants: [1] }
    ];

    service.getChallenges().subscribe(challenges => {
      expect(challenges).toEqual(mockChallenges);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges');
    expect(req.request.method).toBe('GET');
    req.flush(mockChallenges);
  });

  it('should get a single challenge', (done) => {
    const mockChallenge: Challenge = { id: 1, title: 'Ch 1', description: 'Desc 1', type: 'steps', target: 10000, startDate: '', endDate: '', status: 'active', participants: [1] };

    service.getChallenge(1).subscribe(challenge => {
      expect(challenge).toEqual(mockChallenge);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockChallenge);
  });

  it('should create a challenge', (done) => {
    const newChallenge: Omit<Challenge, 'id'> = { title: 'Ch 1', description: 'Desc 1', type: 'steps', target: 10000, startDate: '', endDate: '', status: 'active', participants: [1] };
    const savedChallenge: Challenge = { id: 1, ...newChallenge };

    service.createChallenge(newChallenge).subscribe(challenge => {
      expect(challenge).toEqual(savedChallenge);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges');
    expect(req.request.method).toBe('POST');
    req.flush(savedChallenge);
  });

  it('should update a challenge', (done) => {
    const updateData: Partial<Challenge> = { title: 'New title' };
    const updatedChallenge: Challenge = { id: 1, title: 'New title', description: 'Desc 1', type: 'steps', target: 10000, startDate: '', endDate: '', status: 'active', participants: [1] };

    service.updateChallenge(1, updateData).subscribe(challenge => {
      expect(challenge).toEqual(updatedChallenge);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges/1');
    expect(req.request.method).toBe('PATCH');
    req.flush(updatedChallenge);
  });

  it('should delete a challenge', (done) => {
    service.deleteChallenge(1).subscribe(res => {
      expect(res).toEqual({});
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should join challenge and append unique user id', (done) => {
    const currentParticipants = [1, 2];
    const userId = 3;
    const mockUpdatedChallenge: Challenge = { id: 1, title: 'Ch 1', description: 'Desc 1', type: 'steps', target: 10000, startDate: '', endDate: '', status: 'active', participants: [1, 2, 3] };

    service.joinChallenge(1, userId, currentParticipants).subscribe(challenge => {
      expect(challenge).toEqual(mockUpdatedChallenge);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/challenges/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ participants: [1, 2, 3] });
    req.flush(mockUpdatedChallenge);
  });
});
