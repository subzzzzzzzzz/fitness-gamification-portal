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
  template: `
    <div class="devices-container">
      
      @if (isFormOpen()) {
        <!-- Register / Edit Device Form -->
        <div class="form-card card">
          <div class="form-breadcrumbs">
            <span class="crumb-link" (click)="closeForm()">Devices</span>
            <span class="crumb-separator">/</span>
            <span class="crumb-active">{{ editingDeviceId() ? 'Edit Device' : 'Register Device' }}</span>
          </div>

          <h2 class="form-title mt-xs">
            {{ editingDeviceId() ? 'Edit Device: ' + editingDeviceName() : 'Register New Device' }}
          </h2>

          <form [formGroup]="deviceForm" (ngSubmit)="onFormSubmit()" class="mt-lg">
            <div class="grid-form">
              <div class="form-field">
                <label class="required" for="name">Device Name</label>
                <input 
                  type="text" 
                  id="name" 
                  formControlName="name" 
                  placeholder="e.g. Pro Watch X1"
                />
                @if (showErrors() && deviceForm.get('name')?.hasError('required')) {
                  <div class="error-text">Device name is required</div>
                }
              </div>

              <div class="form-field">
                <label class="required" for="manufacturer">Manufacturer</label>
                <select id="manufacturer" formControlName="manufacturer">
                  <option value="">Select manufacturer...</option>
                  @for (m of manufacturers; track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
                @if (showErrors() && deviceForm.get('manufacturer')?.hasError('required')) {
                  <div class="error-text">Manufacturer is required</div>
                }
              </div>
            </div>

            <!-- Feature Tags Picker (all 14 tags) -->
            <div class="tags-picker-section mt-lg">
              <label class="required-label">Feature Tags * <span class="sub">(select all sensors this device supports)</span></label>
              
              <div class="sensor-tags-grid mt-sm">
                @for (tag of allSensorTags; track tag) {
                  <button 
                    type="button" 
                    class="sensor-tag-btn" 
                    [ngClass]="{'selected': isTagSelected(tag)}"
                    (click)="toggleTag(tag)"
                  >
                    {{ tag }}
                  </button>
                }
              </div>
              
              <div class="tag-counter mt-xs">
                Selected: {{ selectedTags().length }} / 14 tags
              </div>
              @if (showErrors() && selectedTags().length === 0) {
                <div class="error-text">Select at least one feature tag</div>
              }
            </div>

            <!-- User Assignment checkboxes -->
            <div class="assignment-section mt-xl">
              <label class="required-label">Assign Users <span class="sub">(optional)</span></label>
              
              <div class="assignment-box mt-sm">
                <div class="assign-search-bar">
                  <svg lucideIcon="search" class="search-icon" size="16"></svg>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    [value]="userSearchText()"
                    (input)="onUserSearchInput($event)"
                  />
                </div>

                <div class="users-assign-list">
                  @for (u of filteredUsers(); track u.id) {
                    <div class="user-assign-row" [ngClass]="{'assigned': isUserAssigned(u.id)}">
                      <label class="assign-label">
                        <input 
                          type="checkbox" 
                          [checked]="isUserAssigned(u.id)"
                          (change)="toggleUserAssignment(u.id)"
                        />
                        <span class="user-check-info">
                          <span class="name font-bold">{{ u.name }}</span>
                          <span class="email text-secondary">{{ u.email }}</span>
                        </span>
                      </label>
                      <span class="region-badge">{{ u.region || 'APAC' }}</span>
                      <span class="status-badge" [ngClass]="isUserAssigned(u.id) ? 'active' : 'inactive'">
                        {{ isUserAssigned(u.id) ? 'Assigned' : 'Not assigned' }}
                      </span>
                    </div>
                  }
                </div>

                <div class="assign-footer mt-xs">
                  {{ assignedUserIds().length }} of {{ allUsers().length }} assigned
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions mt-xl">
              <div class="right-actions ml-auto">
                <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                  {{ editingDeviceId() ? 'Save Changes' : 'Register Device' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      } @else {
        <!-- Desktop/Mobile List View -->
        <div class="admin-header-row flex-between mb-lg">
          <div>
            <h1>Devices</h1>
            <p class="subtitle text-secondary">Register and manage wearable telemetry smartwatch devices</p>
          </div>
          <button class="btn btn-primary" (click)="openCreateForm()">
            <svg lucideIcon="plus" size="16"></svg>
            Register Device
          </button>
        </div>

        <!-- Search + Filter Bar -->
        <div class="search-filter-molecule card mb-lg">
          <div class="search-wrapper">
            <svg lucideIcon="search" class="search-icon" size="18"></svg>
            <input 
              type="text" 
              placeholder="Search devices..." 
              [value]="searchText()"
              (input)="onSearchInput($event)"
            />
          </div>

          <div class="tag-filter-dropdown">
            <select (change)="onManufacturerFilterChange($event)">
              <option value="">All Manufacturers</option>
              @for (m of manufacturers; track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
          </div>

          <div class="results-count ml-auto">
            {{ filteredDevices().length }} results
          </div>
        </div>

        <!-- Desktop View Table (hidden on mobile) -->
        <div class="card table-card overflow-x desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Device Name</th>
                <th>Manufacturer</th>
                <th>Feature Tags</th>
                <th>Assigned Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (device of filteredDevices(); track device.id) {
                <tr>
                  <td class="id-col">{{ device.id }}</td>
                  <td class="font-bold">{{ device.name }}</td>
                  <td>
                    <span class="manufacturer-pill">{{ device.manufacturer }}</span>
                  </td>
                  <td>
                    <div class="tags-row">
                      @for (tag of device.tags.slice(0, 4); track tag) {
                        <span class="tag-badge">{{ tag }}</span>
                      }
                      @if (device.tags.length > 4) {
                        <span class="tag-badge overflow">+{{ device.tags.length - 4 }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="assigned-count-lbl">
                      {{ device.assignedUserIds?.length || 0 }} users
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-icon-btn edit" (click)="openEditForm(device)" aria-label="Edit device">
                        <svg lucideIcon="edit-2" size="14"></svg>
                      </button>
                      <button class="action-icon-btn delete" (click)="onDelete(device.id)" aria-label="Delete device">
                        <svg lucideIcon="trash-2" size="14"></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-xl">
                    <div class="empty-state">
                      <svg lucideIcon="alert-triangle" size="32" class="text-secondary"></svg>
                      <p class="mt-sm font-bold">No devices registered</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile/Tablet view: Responsive Cards list -->
        <div class="mobile-only devices-grid">
          @for (device of filteredDevices(); track device.id) {
            <div class="device-card card blue-accent-top">
              <div class="device-card-header flex-between">
                <div>
                  <h3>{{ device.name }}</h3>
                  <span class="manufacturer-label mt-xs">{{ device.manufacturer }}</span>
                </div>
                <div class="action-buttons">
                  <button class="action-icon-btn edit" (click)="openEditForm(device)">
                    <svg lucideIcon="edit-2" size="14"></svg>
                  </button>
                  <button class="action-icon-btn delete" (click)="onDelete(device.id)">
                    <svg lucideIcon="trash-2" size="14"></svg>
                  </button>
                </div>
              </div>

              <!-- Tags row -->
              <div class="tags-row mt-md">
                @for (tag of device.tags.slice(0, 3); track tag) {
                  <span class="tag-badge">{{ tag }}</span>
                }
                @if (device.tags.length > 3) {
                  <span class="tag-badge overflow">+{{ device.tags.length - 3 }}</span>
                }
              </div>

              <div class="assigned-users-badge mt-md">
                {{ device.assignedUserIds?.length || 0 }} assigned users
              </div>
            </div>
          } @empty {
            <div class="card w-full text-center py-xl">
              <svg lucideIcon="alert-triangle" size="48" class="text-secondary"></svg>
              <p class="mt-md font-bold text-secondary">No devices registered</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .devices-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Search + Filter Bar */
    .search-filter-molecule {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      align-items: flex-start;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        padding: 16px 24px;
      }
    }

    .search-wrapper {
      position: relative;
      width: 100%;
      max-width: 320px;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 12px;
        color: var(--gray-400);
      }

      input {
        width: 100%;
        padding: 8px 12px 8px 38px;
        border: 1.5px solid var(--border);
        border-radius: var(--r-xl);
        background-color: var(--bg-input);
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
        &:focus {
          border-color: var(--border-focus);
        }
      }
    }

    .tag-filter-dropdown select {
      padding: 8px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      background-color: var(--bg-input);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }

    .results-count {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Table styles */
    .table-card {
      padding: 0;
      border-radius: var(--r-xl);
      overflow: hidden;
    }

    .overflow-x {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;

      th, td {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }

      th {
        background-color: var(--gray-50);
        color: var(--text-secondary);
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      tr {
        background-color: var(--bg-surface);
        &:nth-child(even) {
          background-color: var(--gray-50);
        }
      }

      .id-col {
        color: var(--text-secondary);
        font-weight: 600;
        width: 60px;
      }

      .manufacturer-pill {
        background-color: var(--gray-100);
        color: var(--text-primary);
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
      }

      .action-icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background-color: var(--bg-surface);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: white;
          &.edit { background-color: var(--primary-600); border-color: var(--primary-600); }
          &.delete { background-color: var(--error-500); border-color: var(--error-500); }
        }
      }
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag-badge {
      background-color: rgba(37,99,235,0.1);
      color: var(--primary-600);
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;

      &.overflow {
        background-color: var(--gray-100);
        color: var(--text-secondary);
      }
    }

    .assigned-count-lbl {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    /* Mobile view cards */
    .devices-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;

      @media (min-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .device-card {
      position: relative;
      overflow: hidden;

      &.blue-accent-top::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: var(--primary-600);
      }
    }

    .device-card-header {
      h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
      }
      .manufacturer-label {
        background-color: var(--gray-100);
        color: var(--text-primary);
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }
    }

    .assigned-users-badge {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    /* Form Styles */
    .form-card {
      .form-breadcrumbs {
        display: flex;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        
        .crumb-link {
          color: var(--primary-600);
          cursor: pointer;
          &:hover { text-decoration: underline; }
        }
        .crumb-separator { color: var(--gray-400); }
        .crumb-active { color: var(--text-secondary); }
      }

      .form-title {
        font-size: 24px;
        margin: 8px 0 0 0;
      }
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px 20px;

      @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Feature tags picker */
    .tags-picker-section {
      .required-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        .sub { font-weight: normal; color: var(--text-secondary); }
      }
    }

    .sensor-tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sensor-tag-btn {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      border-radius: var(--r-xl);
      border: 1.5px solid var(--border);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;

      &:hover {
        border-color: var(--gray-400);
        color: var(--text-primary);
      }

      &.selected {
        background-color: var(--primary-600);
        color: white;
        border-color: var(--primary-600);
      }
    }

    .tag-counter {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Assignment Section checkboxes */
    .assignment-section {
      .required-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        .sub { font-weight: normal; color: var(--text-secondary); }
      }
    }

    .assignment-box {
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      padding: 16px;
      background-color: var(--bg-surface);
    }

    .assign-search-bar {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .search-icon {
        position: absolute;
        left: 10px;
        color: var(--gray-400);
      }

      input {
        width: 100%;
        padding: 6px 10px 6px 32px;
        border: 1.5px solid var(--border);
        border-radius: 6px;
        background-color: var(--bg-input);
        color: var(--text-primary);
        font-size: 13px;
        outline: none;
        &:focus {
          border-color: var(--border-focus);
        }
      }
    }

    .users-assign-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      border: 1.5px solid var(--border);
      border-radius: 6px;
    }

    .user-assign-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;

      &:last-child {
        border-bottom: none;
      }

      .assign-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        flex: 1;

        input {
          cursor: pointer;
        }
      }

      .user-check-info {
        display: flex;
        flex-direction: column;
        
        .name { color: var(--text-primary); }
        .email { font-size: 11px; }
      }

      .region-badge {
        font-size: 10px;
        font-weight: 700;
        color: var(--primary-600);
        background-color: rgba(37,99,235,0.1);
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 16px;
      }

      .status-badge {
        font-size: 11px;
        font-weight: 600;
        
        &.active { color: var(--success-600); }
        &.inactive { color: var(--gray-400); }
      }

      &.assigned {
        background-color: rgba(16,185,129,0.02);
      }
    }

    .assign-footer {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      border-top: 1px solid var(--border);
      padding-top: 24px;

      .right-actions {
        display: flex;
        gap: 12px;
      }
    }

    /* Helper Utilities */
    .ml-auto { margin-left: auto; }
    .ml-md { margin-left: 16px; }
    .py-xl { padding-top: 48px; padding-bottom: 48px; }
    .text-center { text-align: center; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .mt-xs { margin-top: 4px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }
    .w-full { width: 100%; }
    .mobile-only {
      @media (min-width: 768px) {
        display: none !important;
      }
    }
    .desktop-only {
      @media (max-width: 767px) {
        display: none !important;
      }
    }
  `]
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
