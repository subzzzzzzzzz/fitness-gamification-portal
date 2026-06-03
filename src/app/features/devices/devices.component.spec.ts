import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DevicesComponent } from './devices.component';
import { provideStore, Store } from '@ngrx/store';
import { devicesFeature, devicesActions } from '../../store/devices.store';
import { usersFeature } from '../../store/users.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';
import { Device, User } from '../../core/models';

describe('DevicesComponent', () => {
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesComponent, ReactiveFormsModule],
      providers: [
        provideStore({
          [devicesFeature.name]: devicesFeature.reducer,
          [usersFeature.name]: usersFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter devices by text and manufacturer', () => {
    const mockDevices: Device[] = [
      { id: 1, name: 'Watch Alpha', manufacturer: 'FitCo', tags: [] } as any,
      { id: 2, name: 'Tracker Beta', manufacturer: 'BioWatch', tags: [] } as any
    ];
    jest.spyOn(component, 'allDevices').mockReturnValue(mockDevices);

    component.searchText.set('alpha');
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].id).toBe(1);

    component.searchText.set('');
    component.manufacturerFilter.set('BioWatch');
    expect(component.filteredDevices().length).toBe(1);
    expect(component.filteredDevices()[0].id).toBe(2);
  });

  it('should filter users by search text', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice Smith', email: 'alice@test.com', role: 'ROLE_USER' } as any,
      { id: 2, name: 'Bob Admin', email: 'bob@test.com', role: 'ROLE_ADMIN' } as any,
      { id: 3, name: 'Charlie User', email: 'charlie@test.com', role: 'ROLE_USER' } as any
    ];
    jest.spyOn(component, 'allUsers').mockReturnValue(mockUsers);

    expect(component.filteredUsers().length).toBe(2); // Only ROLE_USER

    component.userSearchText.set('charlie');
    expect(component.filteredUsers().length).toBe(1);
  });

  it('should handle search input events', () => {
    component.onSearchInput({ target: { value: 'test' } } as any);
    expect(component.searchText()).toBe('test');

    component.onManufacturerFilterChange({ target: { value: 'FitCo' } } as any);
    expect(component.manufacturerFilter()).toBe('FitCo');

    component.onUserSearchInput({ target: { value: 'john' } } as any);
    expect(component.userSearchText()).toBe('john');
  });

  it('should toggle selected tags', () => {
    component.selectedTags.set(['HRM']);
    expect(component.isTagSelected('HRM')).toBe(true);
    expect(component.isTagSelected('GPS')).toBe(false);

    component.toggleTag('HRM');
    expect(component.isTagSelected('HRM')).toBe(false);

    component.toggleTag('GPS');
    expect(component.isTagSelected('GPS')).toBe(true);
  });

  it('should toggle user assignments', () => {
    component.assignedUserIds.set([1]);
    expect(component.isUserAssigned(1)).toBe(true);
    expect(component.isUserAssigned(2)).toBe(false);

    component.toggleUserAssignment(1);
    expect(component.isUserAssigned(1)).toBe(false);

    component.toggleUserAssignment(2);
    expect(component.isUserAssigned(2)).toBe(true);
  });

  it('should open create form and reset state', () => {
    component.openCreateForm();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editingDeviceId()).toBeNull();
    expect(component.selectedTags()).toEqual(['HRM', 'STEPS']);
  });

  it('should open edit form with device details', () => {
    const device = { id: 10, name: 'Edit Watch', manufacturer: 'Pebble', tags: ['GPS'], assignedUserIds: [2] } as Device;
    component.openEditForm(device);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editingDeviceId()).toBe(10);
    expect(component.selectedTags()).toEqual(['GPS']);
    expect(component.assignedUserIds()).toEqual([2]);
  });

  it('should dispatch actions on submit', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    component.openCreateForm();
    component.deviceForm.setValue({ name: 'New Watch', manufacturer: 'SyncTime' });
    component.selectedTags.set(['HRM']);
    component.assignedUserIds.set([4]);

    // Create Device
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(devicesActions.createDevice({
      name: 'New Watch',
      manufacturer: 'SyncTime',
      tags: ['HRM'],
      assignedUserIds: [4]
    }));

    // Update Device
    component.openEditForm({ id: 10, name: 'E', manufacturer: 'FitCo', tags: ['HRM'] } as any);
    component.deviceForm.setValue({ name: 'E2', manufacturer: 'FitCo' });
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(devicesActions.updateDevice({
      id: 10,
      changes: {
        name: 'E2',
        manufacturer: 'FitCo',
        tags: ['HRM'],
        assignedUserIds: []
      }
    }));
  });

  it('should fail submit if invalid', () => {
    component.openCreateForm();
    component.deviceForm.setValue({ name: '', manufacturer: '' });
    component.onFormSubmit();
    expect(component.showErrors()).toBe(true);
  });

  it('should confirm and dispatch delete action', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    component.onDelete(5);
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(devicesActions.deleteDevice({ id: 5 }));

    confirmSpy.mockRestore();
  });
});
