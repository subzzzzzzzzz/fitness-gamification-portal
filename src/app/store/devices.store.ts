import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { DevicesService } from '../core/services/devices.service';
import { ToastService } from '../core/services/toast.service';
import { Device } from '../core/models';

export interface DevicesState {
  devices: Device[];
  loading: boolean;
  error: string | null;
}

const initialState: DevicesState = {
  devices: [],
  loading: false,
  error: null
};

export const devicesActions = createActionGroup({
  source: 'Devices',
  events: {
    'Load Devices': emptyProps(),
    'Load Devices Success': props<{ devices: Device[] }>(),
    'Load Devices Failure': props<{ error: string }>(),
    'Create Device': props<{ name: string; manufacturer: string; tags: string[]; assignedUserIds?: number[] }>(),
    'Create Device Success': props<{ device: Device }>(),
    'Create Device Failure': props<{ error: string }>(),
    'Update Device': props<{ id: number; changes: Partial<Device> }>(),
    'Update Device Success': props<{ device: Device }>(),
    'Update Device Failure': props<{ error: string }>(),
    'Delete Device': props<{ id: number }>(),
    'Delete Device Success': props<{ id: number }>(),
    'Delete Device Failure': props<{ error: string }>()
  }
});

export const devicesFeature = createFeature({
  name: 'devices',
  reducer: createReducer(
    initialState,
    on(devicesActions.loadDevices, devicesActions.createDevice, devicesActions.updateDevice, devicesActions.deleteDevice, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(devicesActions.loadDevicesSuccess, (state, { devices }) => ({
      ...state,
      loading: false,
      devices
    })),
    on(devicesActions.loadDevicesFailure, devicesActions.createDeviceFailure, devicesActions.updateDeviceFailure, devicesActions.deleteDeviceFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(devicesActions.createDeviceSuccess, (state, { device }) => ({
      ...state,
      loading: false,
      devices: [...state.devices, device]
    })),
    on(devicesActions.updateDeviceSuccess, (state, { device }) => ({
      ...state,
      loading: false,
      devices: state.devices.map(d => d.id === device.id ? device : d)
    })),
    on(devicesActions.deleteDeviceSuccess, (state, { id }) => ({
      ...state,
      loading: false,
      devices: state.devices.filter(d => d.id !== id)
    }))
  )
});

// Functional Effects
export const loadDevicesEffect = createEffect(
  (actions$ = inject(Actions), devicesService = inject(DevicesService)) => {
    return actions$.pipe(
      ofType(devicesActions.loadDevices),
      switchMap(() =>
        devicesService.getDevices().pipe(
          map(devices => devicesActions.loadDevicesSuccess({ devices })),
          catchError(err => of(devicesActions.loadDevicesFailure({ error: err.error?.message || 'Failed to load devices' })))
        )
      )
    );
  },
  { functional: true }
);

export const createDeviceEffect = createEffect(
  (actions$ = inject(Actions), devicesService = inject(DevicesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(devicesActions.createDevice),
      switchMap(deviceData =>
        devicesService.createDevice(deviceData).pipe(
          map(device => {
            toastService.success('Success', 'Device registered successfully!');
            return devicesActions.createDeviceSuccess({ device });
          }),
          catchError(err => of(devicesActions.createDeviceFailure({ error: err.error?.message || 'Failed to register device' })))
        )
      )
    );
  },
  { functional: true }
);

export const updateDeviceEffect = createEffect(
  (actions$ = inject(Actions), devicesService = inject(DevicesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(devicesActions.updateDevice),
      switchMap(({ id, changes }) =>
        devicesService.updateDevice(id, changes).pipe(
          map(device => {
            toastService.success('Success', 'Device updated successfully!');
            return devicesActions.updateDeviceSuccess({ device });
          }),
          catchError(err => of(devicesActions.updateDeviceFailure({ error: err.error?.message || 'Failed to update device' })))
        )
      )
    );
  },
  { functional: true }
);

export const deleteDeviceEffect = createEffect(
  (actions$ = inject(Actions), devicesService = inject(DevicesService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(devicesActions.deleteDevice),
      switchMap(({ id }) =>
        devicesService.deleteDevice(id).pipe(
          map(() => {
            toastService.success('Success', 'Device deleted successfully!');
            return devicesActions.deleteDeviceSuccess({ id });
          }),
          catchError(err => of(devicesActions.deleteDeviceFailure({ error: err.error?.message || 'Failed to delete device' })))
        )
      )
    );
  },
  { functional: true }
);
