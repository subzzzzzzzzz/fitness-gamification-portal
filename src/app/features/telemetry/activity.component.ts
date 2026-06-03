import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { telemetryActions, telemetryFeature } from '../../store/telemetry.store';
import { authFeature } from '../../store/auth.store';
import { devicesActions, devicesFeature } from '../../store/devices.store';
import { LucideDynamicIcon } from '@lucide/angular';
import { Telemetry } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})
export class ActivityComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  // Signals
  isFormOpen = signal<boolean>(false);
  showErrors = signal<boolean>(false);
  
  // Real-time Preview bindings
  previewDate = signal<string>(new Date().toISOString().substring(0, 10));
  previewSteps = signal<number>(7722);

  // Form Group
  logForm: FormGroup = this.fb.group({
    activityDate: [new Date().toISOString().substring(0, 10), Validators.required],
    stepCount: [7722, [Validators.required, Validators.min(1)]],
    hrVal: [72.5],
    stepsVal: [7722],
    respRateVal: [16.0],
    bpVal: ['118/80'],
    stressVal: [35.0],
    vo2MaxVal: [42.0],
    hydrationVal: [62.0],
    hrvVal: [42.0]
  });

  // Store Selectors
  userId = () => this.authService.currentUser()?.id || 1;
  userPoints = () => this.authService.currentUser()?.points || 0;
  streakCount = () => this.authService.currentUser()?.streak || 5;

  allDevices = this.store.selectSignal(devicesFeature.selectDevices);
  telemetryLogs = this.store.selectSignal(telemetryFeature.selectTelemetryLogs);

  // Find user's assigned device details
  userDevice = computed(() => {
    const uid = this.userId();
    return this.allDevices().find(d => d.assignedUserIds?.includes(uid)) || this.allDevices()[0];
  });

  deviceName = () => this.userDevice()?.name || 'Evening Watch 336';
  deviceManufacturer = () => this.userDevice()?.manufacturer || 'FitCo';
  deviceTags = () => this.userDevice()?.tags || ['HRM', 'STEPS', 'RESPIRATORY_RATE', 'BLOOD_PRESSURE'];

  // History logs and Last 7 Days logs
  historyLogs = computed(() => {
    const uid = this.userId();
    return this.telemetryLogs().filter(t => t.userId === uid);
  });

  last7DaysLogs = computed(() => {
    return this.historyLogs().slice(0, 7).reverse();
  });

  todaySteps = computed(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLog = this.historyLogs().find(t => t.submittedAt.startsWith(todayStr));
    return todayLog ? todayLog.stepCount : 0;
  });

  goalPercent = computed(() => {
    const steps = this.previewSteps();
    return Math.min(100, Math.round((steps / 10000) * 100));
  });

  ngOnInit() {
    this.store.dispatch(devicesActions.loadDevices());
    this.store.dispatch(telemetryActions.loadTelemetryAndBadges({ userId: this.userId() }));
  }

  onUserSearchInput(e: any) {}

  updatePreview() {
    const dateVal = this.logForm.get('activityDate')?.value || new Date().toISOString().substring(0, 10);
    const stepsVal = this.logForm.get('stepCount')?.value || 0;
    
    this.previewDate.set(dateVal);
    this.previewSteps.set(stepsVal);
    
    // Sync stepper stepsVal input
    this.logForm.get('stepsVal')?.setValue(stepsVal, { emitEvent: false });
  }

  stepSteps(amount: number) {
    const current = this.logForm.get('stepCount')?.value || 0;
    const next = Math.max(1, current + amount);
    this.logForm.patchValue({ stepCount: next });
    this.updatePreview();
  }

  getBarHeightPercentage(steps: number): number {
    const maxSteps = 15000;
    return Math.min(100, Math.round((steps / maxSteps) * 100));
  }

  getBarClass(steps: number): string {
    if (steps >= 10000) return 'green';
    if (steps >= 6000) return 'amber';
    return 'red';
  }

  getGoalBadgeText(steps: number): string {
    if (steps >= 10000) return 'Goal Met';
    if (steps >= 6000) return 'Near Goal';
    return 'Below Goal';
  }

  getGoalBadgeClass(steps: number): string {
    if (steps >= 10000) return 'goal-met';
    if (steps >= 6000) return 'near-goal';
    return 'below-goal';
  }

  calculatePoints(steps: number): number {
    return Math.round(steps / 100);
  }

  openLogForm() {
    this.logForm.reset({
      activityDate: new Date().toISOString().substring(0, 10),
      stepCount: 7722,
      hrVal: 72.5,
      stepsVal: 7722,
      respRateVal: 16.0,
      bpVal: '118/80',
      stressVal: 35.0,
      vo2MaxVal: 42.0,
      hydrationVal: 62.0,
      hrvVal: 42.0
    });
    this.updatePreview();
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.showErrors.set(false);
  }

  onFormSubmit() {
    if (this.logForm.invalid) {
      this.showErrors.set(true);
      return;
    }

    const val = this.logForm.value;
    const payload = {
      userId: this.userId(),
      stepCount: val.stepCount,
      heartRate: val.hrVal || 72,
      calories: Math.round(val.stepCount * 0.04), // simple estimation
      distance: Math.round((val.stepCount * 0.00075) * 10) / 10, // simple step -> km
      submittedAt: new Date(val.activityDate).toISOString(),
      tagValues: {
        HRM: val.hrVal || 72,
        STEPS: val.stepCount,
        RESPIRATORY_RATE: val.respRateVal || 16,
        BLOOD_PRESSURE: val.bpVal || '120/80',
        STRESS: val.stressVal || 35,
        VO2_MAX: val.vo2MaxVal || 42,
        HYDRATION: val.hydrationVal || 60,
        HRV: val.hrvVal || 42
      }
    };

    this.store.dispatch(telemetryActions.submitTelemetry(payload));
    this.closeForm();
  }
}
