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
  template: `
    <div class="activity-container">
      
      @if (isFormOpen()) {
        <!-- Log Activity Form view (Figma Page 34) -->
        <div class="form-card card">
          <div class="form-breadcrumbs">
            <span class="crumb-link" (click)="closeForm()">My Activity</span>
            <span class="crumb-separator">/</span>
            <span class="crumb-active">Log Activity</span>
          </div>

          <h2 class="form-title mt-xs">Log Today's Activity</h2>

          <div class="split-activity-layout mt-lg">
            
            <!-- Left Side: Logger Form -->
            <div class="logger-form-panel">
              <form [formGroup]="logForm" (ngSubmit)="onFormSubmit()">
                <div class="grid-form">
                  <div class="form-field">
                    <label class="required" for="activityDate">Activity Date</label>
                    <input 
                      type="date" 
                      id="activityDate" 
                      formControlName="activityDate"
                      (change)="updatePreview()"
                    />
                  </div>

                  <div class="form-field">
                    <label class="required" for="stepCount">Step Count</label>
                    <div class="numeric-stepper">
                      <button type="button" class="stepper-btn" (click)="stepSteps(-500)">&minus;</button>
                      <input 
                        type="number" 
                        id="stepCount" 
                        formControlName="stepCount"
                        (input)="updatePreview()"
                      />
                      <button type="button" class="stepper-btn" (click)="stepSteps(500)">+</button>
                    </div>
                    @if (showErrors() && logForm.get('stepCount')?.hasError('required')) {
                      <div class="error-text">Step count is required</div>
                    }
                    @if (showErrors() && logForm.get('stepCount')?.hasError('min')) {
                      <div class="error-text">Steps must be greater than 0</div>
                    }
                  </div>
                </div>

                <!-- Goal progress bar -->
                <div class="goal-progress-box mt-md">
                  <div class="flex-between font-bold text-sm">
                    <span>Progress toward 10,000 step goal:</span>
                    <span class="primary-text">{{ goalPercent() }}%</span>
                  </div>
                  <div class="progress-bar-track mt-xs">
                    <div class="progress-bar-fill" [style.width.%]="goalPercent()"></div>
                  </div>
                </div>

                <!-- Sensor readings section -->
                <div class="sensor-readings-section mt-xl">
                  <div class="flex-between">
                    <h3 class="subsection-title">Sensor Readings <span class="sub">(tagValues &mdash; optional)</span></h3>
                    <span class="device-assigned-lbl text-secondary font-bold">from {{ deviceName() }}</span>
                  </div>
                  
                  <div class="sensors-inputs-grid mt-sm">
                    <!-- Heart Rate -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Heart Rate</span>
                        <span class="tag-chip font-bold">HRM</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="hrVal" (input)="updatePreview()" />
                        <span class="unit">bpm</span>
                      </div>
                    </div>

                    <!-- Steps (mirrors Step Count) -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Steps</span>
                        <span class="tag-chip font-bold">STEPS</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="stepsVal" readonly />
                        <span class="unit">steps</span>
                      </div>
                    </div>

                    <!-- Resp. Rate -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Resp. Rate</span>
                        <span class="tag-chip font-bold">RESPIRATORY_RATE</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="respRateVal" (input)="updatePreview()" />
                        <span class="unit">brpm</span>
                      </div>
                    </div>

                    <!-- Blood Pressure -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Blood Pressure</span>
                        <span class="tag-chip font-bold">BLOOD_PRESSURE</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="text" placeholder="e.g. 120/80" formControlName="bpVal" (input)="updatePreview()" />
                        <span class="unit">mmHg</span>
                      </div>
                    </div>

                    <!-- Stress Score -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Stress Score</span>
                        <span class="tag-chip font-bold">STRESS</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="stressVal" (input)="updatePreview()" />
                        <span class="unit">0-100</span>
                      </div>
                    </div>

                    <!-- VO2 Max -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">VO2 Max</span>
                        <span class="tag-chip font-bold">VO2_MAX</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="vo2MaxVal" (input)="updatePreview()" />
                        <span class="unit">mL/kg/min</span>
                      </div>
                    </div>

                    <!-- Hydration -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Hydration</span>
                        <span class="tag-chip font-bold">HYDRATION</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="hydrationVal" (input)="updatePreview()" />
                        <span class="unit">%</span>
                      </div>
                    </div>

                    <!-- Heart Rate Var -->
                    <div class="sensor-field-wrapper">
                      <div class="sensor-label-row flex-between">
                        <span class="sensor-lbl">Heart Rate Var.</span>
                        <span class="tag-chip font-bold">HRV</span>
                      </div>
                      <div class="sensor-input-box">
                        <input type="number" formControlName="hrvVal" (input)="updatePreview()" />
                        <span class="unit">ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Submit actions -->
                <div class="form-actions mt-xl">
                  <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Submit Activity</button>
                </div>
              </form>
            </div>

            <!-- Right Side: Submission Preview -->
            <div class="preview-panel">
              <div class="preview-card card">
                <h3 class="subsection-title mb-md">Submission Preview</h3>
                
                <div class="preview-metric-row">
                  <span class="lbl text-secondary font-bold">Activity Date</span>
                  <span class="val font-bold primary-text">{{ previewDate() | date:'E, dd MMM yyyy' }}</span>
                </div>
                
                <div class="preview-metric-row mt-sm">
                  <span class="lbl text-secondary font-bold">Step Count</span>
                  <span class="val font-bold">{{ previewSteps() | number }} steps</span>
                </div>

                <div class="preview-metric-row mt-sm">
                  <span class="lbl text-secondary font-bold">Goal Progress</span>
                  <span class="val font-bold text-success">{{ goalPercent() }}% of 10k</span>
                </div>

                <div class="progress-bar-track mt-md">
                  <div class="progress-bar-fill" [style.width.%]="goalPercent()"></div>
                </div>
                <div class="text-xs text-secondary mt-xs">{{ previewSteps() | number }} / 10,000 steps today</div>

                <div class="preview-divider mt-lg mb-lg"></div>

                <div class="preview-device-section">
                  <div class="flex-between">
                    <span class="lbl text-secondary font-bold">Device</span>
                    <span class="val font-bold">{{ deviceName() }}</span>
                  </div>
                  <div class="flex-between mt-xs">
                    <span class="lbl text-secondary font-bold">Manufacturer</span>
                    <span class="val font-bold">{{ deviceManufacturer() }}</span>
                  </div>
                </div>

                <div class="preview-divider mt-lg mb-lg"></div>

                <h4 class="text-sm font-bold mb-sm">Active Sensor Tags</h4>
                <div class="sensor-tags-row">
                  @for (tag of deviceTags(); track tag) {
                    <span class="tag-badge">{{ tag }}</span>
                  }
                </div>

                <div class="preview-divider mt-lg mb-lg"></div>

                <h4 class="text-sm font-bold mb-sm">Sensor Readings Summary</h4>
                <div class="readings-summary-list">
                  <div class="summary-row flex-between" *ngIf="logForm.get('hrVal')?.value">
                    <span>Heart Rate</span>
                    <span class="font-bold">{{ logForm.get('hrVal')?.value }} bpm</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('respRateVal')?.value">
                    <span>Resp. Rate</span>
                    <span class="font-bold">{{ logForm.get('respRateVal')?.value }} brpm</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('bpVal')?.value">
                    <span>Blood Pressure</span>
                    <span class="font-bold">{{ logForm.get('bpVal')?.value }} mmHg</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('stressVal')?.value">
                    <span>Stress Score</span>
                    <span class="font-bold">{{ logForm.get('stressVal')?.value }}/100</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('vo2MaxVal')?.value">
                    <span>VO2 Max</span>
                    <span class="font-bold">{{ logForm.get('vo2MaxVal')?.value }} ml/kg</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('hydrationVal')?.value">
                    <span>Hydration</span>
                    <span class="font-bold">{{ logForm.get('hydrationVal')?.value }}%</span>
                  </div>
                  <div class="summary-row flex-between" *ngIf="logForm.get('hrvVal')?.value">
                    <span>Heart Rate Var.</span>
                    <span class="font-bold">{{ logForm.get('hrvVal')?.value }} ms</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      } @else {
        <!-- Activity Dashboard View (Figma Page 33) -->
        <div class="activity-header-row flex-between mb-lg">
          <div>
            <h1>My Activity</h1>
            <p class="subtitle text-secondary">POST /user/{{ userId() }} &bull; GET returns UserProgressResponse</p>
          </div>
          <button class="btn btn-primary" (click)="openLogForm()">
            <svg lucideIcon="plus" size="16"></svg>
            Log Today's Activity
          </button>
        </div>

        <!-- Stats Capsule Ribbon -->
        <div class="user-stats-ribbon mb-lg">
          <div class="stat-capsule">
            <span class="num">{{ userPoints() }}</span>
            <span class="lbl">Total Points</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">{{ todaySteps() | number }}</span>
            <span class="lbl">Today's Steps</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">10,569</span>
            <span class="lbl">7-Day Avg</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">{{ streakCount() }} days</span>
            <span class="lbl">Current Streak</span>
          </div>
        </div>

        <!-- Last 7 Days Steps Chart -->
        <div class="card mb-lg">
          <h3 class="section-title mb-lg">Last 7 Days &mdash; Step Activity</h3>
          
          <div class="seven-days-chart-wrapper">
            <div class="seven-days-chart">
              @for (log of last7DaysLogs(); track log.id) {
                <div class="seven-bar-col">
                  <div class="seven-bar-wrapper">
                    <div 
                      class="seven-bar-fill"
                      [ngClass]="getBarClass(log.stepCount)"
                      [style.height.%]="getBarHeightPercentage(log.stepCount)"
                    >
                      <span class="bar-steps-text">{{ log.stepCount | number }}</span>
                    </div>
                  </div>
                  <span class="seven-bar-date">{{ log.submittedAt | date:'dd-MM' }}</span>
                </div>
              }
            </div>
            
            <div class="chart-goal-indicator mt-md font-bold text-xs text-secondary">
              * Dashed goal line is 10,000 steps
            </div>
          </div>
        </div>

        <!-- Activity History Table -->
        <div class="card table-card overflow-x">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Steps</th>
                <th>Goal Status</th>
                <th>HRM (bpm)</th>
                <th>SPO2 (%)</th>
                <th>Est. Pts</th>
              </tr>
            </thead>
            <tbody>
              @for (log of historyLogs(); track log.id) {
                <tr>
                  <td class="font-bold">{{ log.submittedAt | date:'yyyy-MM-dd' }}</td>
                  <td>{{ log.stepCount | number }}</td>
                  <td>
                    <span class="goal-badge" [ngClass]="getGoalBadgeClass(log.stepCount)">
                      {{ getGoalBadgeText(log.stepCount) }}
                    </span>
                  </td>
                  <td>{{ log.heartRate || '&mdash;' }}</td>
                  <td>{{ log.tagValues?.['SPO2'] || 98 }}%</td>
                  <td class="pts-gain font-bold">+{{ calculatePoints(log.stepCount) }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-xl">
                    <div class="empty-state">
                    <svg lucideIcon="alert-triangle" size="32" class="text-secondary"></svg>
                      <p class="mt-sm font-bold">No activity history logged yet</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .activity-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Stats capsule ribbon */
    .user-stats-ribbon {
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: white;
      padding: 16px 24px;
      border-radius: var(--r-xl);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      width: fit-content;
      gap: 16px;
      box-shadow: 0 4px 6px rgba(37,99,235,0.1);
    }

    .stat-capsule {
      display: flex;
      align-items: center;
      gap: 8px;

      .num {
        font-size: 20px;
        font-weight: 800;
      }
      .lbl {
        font-size: 12px;
        color: var(--primary-100);
        font-weight: 600;
      }
    }

    .stat-divider {
      width: 1px;
      height: 18px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    /* Last 7 days step chart */
    .seven-days-chart {
      display: flex;
      height: 150px;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1.5px solid var(--border);
      padding: 0 16px 4px 16px;
    }

    .seven-bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
    }

    .seven-bar-wrapper {
      width: 50%;
      max-width: 44px;
      height: calc(100% - 20px);
      display: flex;
      align-items: flex-end;
    }

    .seven-bar-fill {
      width: 100%;
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 4px;
      position: relative;
      transition: height 0.3s;

      &.green { background-color: var(--success-500); }
      &.amber { background-color: var(--warning-500); }
      &.red { background-color: var(--error-500); }

      .bar-steps-text {
        color: white;
        font-size: 10px;
        font-weight: 700;
        
        @media (max-width: 540px) {
          display: none;
        }
      }
    }

    .seven-bar-date {
      margin-top: 6px;
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* History Table */
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

      .goal-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: var(--r-full);
        border: 1px solid transparent;
        text-transform: uppercase;
        
        &.goal-met {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: var(--success-600);
        }
        
        &.near-goal {
          background-color: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.2);
          color: var(--warning-500);
        }
        
        &.below-goal {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--error-600);
        }
      }

      .pts-gain {
        color: var(--success-600);
      }
    }

    /* Logger Split Layout */
    .split-activity-layout {
      display: flex;
      flex-direction: column-reverse;
      gap: 24px;

      @media (min-width: 1024px) {
        display: grid;
        grid-template-columns: 58% 42%;
      }
    }

    .subsection-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      .sub { font-weight: normal; color: var(--text-secondary); }
    }

    .device-assigned-lbl {
      font-size: 13px;
    }

    .numeric-stepper {
      display: flex;
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      background-color: var(--bg-input);
      width: 100%;

      input {
        flex: 1;
        border: none !important;
        border-radius: 0 !important;
        text-align: center;
        &:focus {
          box-shadow: none !important;
        }
      }

      .stepper-btn {
        width: 44px;
        border: none;
        background-color: var(--gray-50);
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        &:hover {
          background-color: var(--gray-200);
        }
      }
    }

    /* Sensor Grid Inputs */
    .sensors-inputs-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;

      @media (min-width: 480px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .sensor-field-wrapper {
      background-color: var(--gray-50);
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .sensor-label-row {
        .sensor-lbl { font-size: 13px; font-weight: 700; }
        .tag-chip {
          background-color: rgba(37,99,235,0.1);
          color: var(--primary-600);
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 4px;
        }
      }

      .sensor-input-box {
        display: flex;
        border-bottom: 1.5px solid var(--border);
        align-items: center;
        
        input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 15px;
          font-weight: 700;
          padding: 4px 0;
          outline: none;
        }
        
        .unit {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
        }
      }
    }

    /* Preview Panel */
    .preview-card {
      background-color: var(--bg-surface);
      border: 1.5px solid var(--border);
    }

    .preview-metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      
      .primary-text { color: var(--primary-600); }
      .text-success { color: var(--success-600); }
    }

    .preview-divider {
      height: 1px;
      background-color: var(--border);
    }

    .preview-device-section {
      font-size: 13px;
    }

    .sensor-tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .tag-badge {
        background-color: var(--primary-100);
        color: var(--primary-600);
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .readings-summary-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;

      .summary-row {
        padding-bottom: 6px;
        border-bottom: 1px dashed var(--border);
        
        &:last-child {
          border-bottom: none;
        }
      }
    }

    /* Progress bar track */
    .progress-bar-track {
      height: 8px;
      background-color: var(--gray-100);
      border-radius: var(--r-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--primary-600);
      border-radius: var(--r-full);
      transition: width 0.3s;
    }

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

      @media (min-width: 480px) {
        grid-template-columns: 1fr 1fr;
      }
    }

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
    .mt-sm { margin-top: 8px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }
    .w-full { width: 100%; }
  `]
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
