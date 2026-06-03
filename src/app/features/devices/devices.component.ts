import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { devicesActions, devicesFeature } from '../../store/devices.store';
import { usersActions, usersFeature } from '../../store/users.store';
import { LucideDynamicIcon } from '@lucide/angular';
import { Device, User } from '../../core/models';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss'
})
export class DevicesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  // Manufacturers
  manufacturers = ['BioWatch', 'FitCo', 'GigaWear', 'Healthify', 'Pebble', 'SyncTime'];

  // All 14 sensor tags from Figma
  allSensorTags = [
    'GPS', 'HRM', 'STEPS', 'SPO2', 'SLEEP', 'ECG', 'HRV', 'STRESS',
    'TEMPERATURE', 'RESPIRATORY_RATE', 'FALL_DETECTION', 'BLOOD_PRESSURE', 'HYDRATION', 'VO2_MAX'
  ];

  // Signals
  isFormOpen = signal<boolean>(false);
  editingDeviceId = signal<number | null>(null);
  editingDeviceName = signal<string>('');
  showErrors = signal<boolean>(false);
  searchText = signal<string>('');
  manufacturerFilter = signal<string>('');
  
  // Tags selected in form
  selectedTags = signal<string[]>([]);
  
  // User assignment search & lists in form
  userSearchText = signal<string>('');
  assignedUserIds = signal<number[]>([]);

  // Form Group
  deviceForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    manufacturer: ['', Validators.required]
  });

  // Store Selectors
  allDevices = this.store.selectSignal(devicesFeature.selectDevices);
  allUsers = this.store.selectSignal(usersFeature.selectUsers);

  // Filters (Devices)
  filteredDevices = computed(() => {
    let result = this.allDevices();
    
    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(search) || 
        d.manufacturer.toLowerCase().includes(search)
      );
    }

    // Manufacturer filter
    const man = this.manufacturerFilter();
    if (man) {
      result = result.filter(d => d.manufacturer === man);
    }

    return result;
  });

  // Filter users inside the assignment panel
  filteredUsers = computed(() => {
    const search = this.userSearchText().toLowerCase().trim();
    // Only return users who are ROLE_USER
    const list = this.allUsers().filter(u => u.role === 'ROLE_USER');
    if (!search) return list;
    return list.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search)
    );
  });

  ngOnInit() {
    this.store.dispatch(devicesActions.loadDevices());
    this.store.dispatch(usersActions.loadUsers());
  }

  onSearchInput(event: Event) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  onManufacturerFilterChange(event: Event) {
    this.manufacturerFilter.set((event.target as HTMLSelectElement).value);
  }

  onUserSearchInput(event: Event) {
    this.userSearchText.set((event.target as HTMLInputElement).value);
  }

  // Tag helpers
  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  toggleTag(tag: string) {
    this.selectedTags.update(current => {
      if (current.includes(tag)) {
        return current.filter(t => t !== tag);
      } else {
        return [...current, tag];
      }
    });
  }

  // Assignment helpers
  isUserAssigned(userId: number): boolean {
    return this.assignedUserIds().includes(userId);
  }

  toggleUserAssignment(userId: number) {
    this.assignedUserIds.update(current => {
      if (current.includes(userId)) {
        return current.filter(id => id !== userId);
      } else {
        return [...current, userId];
      }
    });
  }

  // Form actions
  openCreateForm() {
    this.editingDeviceId.set(null);
    this.selectedTags.set(['HRM', 'STEPS']); // defaults
    this.assignedUserIds.set([]);
    this.userSearchText.set('');
    this.deviceForm.reset({
      name: '',
      manufacturer: ''
    });
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  openEditForm(device: Device) {
    this.editingDeviceId.set(device.id);
    this.editingDeviceName.set(device.name);
    this.selectedTags.set([...device.tags]);
    this.assignedUserIds.set([...(device.assignedUserIds || [])]);
    this.userSearchText.set('');
    this.deviceForm.reset({
      name: device.name,
      manufacturer: device.manufacturer
    });
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingDeviceId.set(null);
    this.showErrors.set(false);
  }

  onFormSubmit() {
    if (this.deviceForm.invalid || this.selectedTags().length === 0) {
      this.showErrors.set(true);
      return;
    }

    const val = this.deviceForm.value;
    const payload = {
      name: val.name,
      manufacturer: val.manufacturer,
      tags: this.selectedTags(),
      assignedUserIds: this.assignedUserIds()
    };

    if (this.editingDeviceId()) {
      this.store.dispatch(devicesActions.updateDevice({
        id: this.editingDeviceId()!,
        changes: payload
      }));
    } else {
      this.store.dispatch(devicesActions.createDevice(payload));
    }

    this.closeForm();
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this device?')) {
      this.store.dispatch(devicesActions.deleteDevice({ id }));
    }
  }
}
