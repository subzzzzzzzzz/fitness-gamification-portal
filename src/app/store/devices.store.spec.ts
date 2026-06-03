import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { devicesFeature, devicesActions, loadDevicesEffect, createDeviceEffect, updateDeviceEffect, deleteDeviceEffect } from './devices.store';
import { DevicesService } from '../core/services/devices.service';
import { ToastService } from '../core/services/toast.service';
import { Device } from '../core/models';

describe('Devices Store & Effects', () => {
  let actions$: Observable<any>;
  let devicesServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    devicesServiceSpy = {
      getDevices: jest.fn(),
      createDevice: jest.fn(),
      updateDevice: jest.fn(),
      deleteDevice: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = devicesFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.devices).toEqual([]);
    });

    it('should set loading to true on start actions', () => {
      let state = devicesFeature.reducer(undefined, devicesActions.loadDevices());
      expect(state.loading).toBe(true);
    });

    it('should populate devices on load success', () => {
      const mockList = [{ id: 1 } as Device];
      const state = devicesFeature.reducer(undefined, devicesActions.loadDevicesSuccess({ devices: mockList }));
      expect(state.loading).toBe(false);
      expect(state.devices).toEqual(mockList);
    });

    it('should add device on create success', () => {
      const mockItem = { id: 1 } as Device;
      const state = devicesFeature.reducer({ devices: [], loading: true, error: null }, devicesActions.createDeviceSuccess({ device: mockItem }));
      expect(state.loading).toBe(false);
      expect(state.devices).toEqual([mockItem]);
    });

    it('should update device on update success', () => {
      const initial = { devices: [{ id: 1, name: 'Old' } as Device], loading: true, error: null };
      const updated = { id: 1, name: 'New' } as Device;
      const state = devicesFeature.reducer(initial, devicesActions.updateDeviceSuccess({ device: updated }));
      expect(state.devices[0].name).toBe('New');
    });

    it('should remove device on delete success', () => {
      const initial = { devices: [{ id: 1 } as Device], loading: true, error: null };
      const state = devicesFeature.reducer(initial, devicesActions.deleteDeviceSuccess({ id: 1 }));
      expect(state.devices.length).toBe(0);
    });

    it('should set error on failure actions', () => {
      const state = devicesFeature.reducer(undefined, devicesActions.loadDevicesFailure({ error: 'err' }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('err');
    });
  });

  describe('Effects', () => {
    it('should load devices', (done) => {
      devicesServiceSpy.getDevices.mockReturnValue(of([]));
      actions$ = of(devicesActions.loadDevices());

      TestBed.runInInjectionContext(() => {
        loadDevicesEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.loadDevicesSuccess({ devices: [] }));
          done();
        });
      });
    });

    it('should handle load devices failure', (done) => {
      devicesServiceSpy.getDevices.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(devicesActions.loadDevices());

      TestBed.runInInjectionContext(() => {
        loadDevicesEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.loadDevicesFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should create device', (done) => {
      const item = { id: 1 } as Device;
      devicesServiceSpy.createDevice.mockReturnValue(of(item));
      actions$ = of(devicesActions.createDevice({ name: '', manufacturer: '', tags: [] }));

      TestBed.runInInjectionContext(() => {
        createDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.createDeviceSuccess({ device: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle create device failure', (done) => {
      devicesServiceSpy.createDevice.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(devicesActions.createDevice({ name: '', manufacturer: '', tags: [] }));

      TestBed.runInInjectionContext(() => {
        createDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.createDeviceFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should update device', (done) => {
      const item = { id: 1 } as Device;
      devicesServiceSpy.updateDevice.mockReturnValue(of(item));
      actions$ = of(devicesActions.updateDevice({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.updateDeviceSuccess({ device: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle update device failure', (done) => {
      devicesServiceSpy.updateDevice.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(devicesActions.updateDevice({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.updateDeviceFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should delete device', (done) => {
      devicesServiceSpy.deleteDevice.mockReturnValue(of({}));
      actions$ = of(devicesActions.deleteDevice({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.deleteDeviceSuccess({ id: 1 }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle delete device failure', (done) => {
      devicesServiceSpy.deleteDevice.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(devicesActions.deleteDevice({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteDeviceEffect().subscribe(res => {
          expect(res).toEqual(devicesActions.deleteDeviceFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
