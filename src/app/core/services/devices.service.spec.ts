import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DevicesService } from './devices.service';
import { Device } from '../models';

describe('DevicesService', () => {
  let service: DevicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DevicesService]
    });
    service = TestBed.inject(DevicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get devices', (done) => {
    const mockDevices: Device[] = [
      { id: 1, name: 'Smartwatch 1', type: 'watch', status: 'connected', batteryLevel: 80, lastSync: '' }
    ];

    service.getDevices().subscribe(devices => {
      expect(devices).toEqual(mockDevices);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/devices');
    expect(req.request.method).toBe('GET');
    req.flush(mockDevices);
  });

  it('should get a single device', (done) => {
    const mockDevice: Device = { id: 1, name: 'Smartwatch 1', type: 'watch', status: 'connected', batteryLevel: 80, lastSync: '' };

    service.getDevice(1).subscribe(device => {
      expect(device).toEqual(mockDevice);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/devices/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDevice);
  });

  it('should create a device', (done) => {
    const newDevice: Omit<Device, 'id'> = { name: 'Smartwatch 1', type: 'watch', status: 'connected', batteryLevel: 80, lastSync: '' };
    const savedDevice: Device = { id: 1, ...newDevice };

    service.createDevice(newDevice).subscribe(device => {
      expect(device).toEqual(savedDevice);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/devices');
    expect(req.request.method).toBe('POST');
    req.flush(savedDevice);
  });

  it('should update a device', (done) => {
    const updateData: Partial<Device> = { name: 'New name' };
    const updatedDevice: Device = { id: 1, name: 'New name', type: 'watch', status: 'connected', batteryLevel: 80, lastSync: '' };

    service.updateDevice(1, updateData).subscribe(device => {
      expect(device).toEqual(updatedDevice);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/devices/1');
    expect(req.request.method).toBe('PATCH');
    req.flush(updatedDevice);
  });

  it('should delete a device', (done) => {
    service.deleteDevice(1).subscribe(res => {
      expect(res).toEqual({});
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/devices/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
