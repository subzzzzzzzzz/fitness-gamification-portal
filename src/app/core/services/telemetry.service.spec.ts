import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TelemetryService } from './telemetry.service';
import { Telemetry, Badge } from '../models';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TelemetryService]
    });
    service = TestBed.inject(TelemetryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get telemetry for user', (done) => {
    const mockTelemetry: Telemetry[] = [
      { id: 1, userId: 1, steps: 5000, calories: 200, heartRate: 72, sleepHours: 8, timestamp: '' }
    ];

    service.getTelemetryForUser(1).subscribe(data => {
      expect(data).toEqual(mockTelemetry);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/telemetry?userId=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTelemetry);
  });

  it('should get badges for user', (done) => {
    const mockBadges: Badge[] = [
      { id: 1, userId: 1, name: 'First Step', description: 'Walk 1000 steps', icon: 'footsteps', unlockedAt: '' }
    ];

    service.getBadgesForUser(1).subscribe(data => {
      expect(data).toEqual(mockBadges);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/badges?userId=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockBadges);
  });

  it('should submit telemetry', (done) => {
    const newTelemetry = { userId: 1, steps: 5000, calories: 200, heartRate: 72, sleepHours: 8, timestamp: '' };
    const savedTelemetry = { id: 1, ...newTelemetry };

    service.submitTelemetry(newTelemetry).subscribe(data => {
      expect(data).toEqual(savedTelemetry);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/telemetry');
    expect(req.request.method).toBe('POST');
    req.flush(savedTelemetry);
  });

  it('should fetch combined dashboard data', (done) => {
    const mockTelemetry: Telemetry[] = [
      { id: 1, userId: 1, steps: 5000, calories: 200, heartRate: 72, sleepHours: 8, timestamp: '' }
    ];
    const mockBadges: Badge[] = [
      { id: 1, userId: 1, name: 'First Step', description: 'Walk 1000 steps', icon: 'footsteps', unlockedAt: '' }
    ];

    service.getDashboardData(1).subscribe(data => {
      expect(data[0]).toEqual(mockTelemetry);
      expect(data[1]).toEqual(mockBadges);
      done();
    });

    const reqTelemetry = httpMock.expectOne('http://localhost:3000/telemetry?userId=1');
    expect(reqTelemetry.request.method).toBe('GET');
    reqTelemetry.flush(mockTelemetry);

    const reqBadges = httpMock.expectOne('http://localhost:3000/badges?userId=1');
    expect(reqBadges.request.method).toBe('GET');
    reqBadges.flush(mockBadges);
  });
});
