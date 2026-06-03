import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { tasksActions, tasksFeature } from '../../store/tasks.store';
import { challengesActions, challengesFeature } from '../../store/challenges.store';
import { telemetryActions, telemetryFeature } from '../../store/telemetry.store';
import { leaderboardActions } from '../../store/leaderboard.store';
import { AuthService } from '../../core/services/auth.service';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  template: `
    <div class="dashboard-container">
      
      <!-- Greeting Header Banner -->
      <div class="greeting-banner">
        <div class="greeting-left">
          <div class="greeting-row">
            <h1>Good morning, {{ userName() }}</h1>
            <span class="activity-dot-pulse"></span>
          </div>
          <p class="greeting-sub">Wednesday, 27 May 2026 &bull; Evening Watch 336 synced 2 hrs ago</p>
        </div>
        <div class="greeting-right">
          <div class="mini-stat">
            <span class="label">Points</span>
            <span class="val">{{ userPoints() }}</span>
          </div>
          <div class="mini-stat-divider"></div>
          <div class="mini-stat">
            <span class="label">Rank</span>
            <span class="val">#3</span>
          </div>
          <div class="mini-stat-divider"></div>
          <div class="mini-stat">
            <span class="label">Tasks</span>
            <span class="val">4/5</span>
          </div>
        </div>
      </div>

      <!-- KPI Stats Grid Row -->
      <div class="kpi-grid">
        <div class="kpi-card blue-bar">
          <div class="kpi-value blue-text">{{ userPoints() }} pts</div>
          <div class="kpi-label">Total Points</div>
          <div class="kpi-sub">+12% this week</div>
        </div>

        <div class="kpi-card gold-bar">
          <div class="kpi-value gold-text">#3</div>
          <div class="kpi-label">Global Rank</div>
          <div class="kpi-sub">of 20 active users</div>
        </div>

        <div class="kpi-card green-bar">
          <div class="kpi-value green-text">4 / 5</div>
          <div class="kpi-label">Tasks Completed</div>
          <div class="kpi-sub">80% completion rate</div>
        </div>

        <div class="kpi-card indigo-bar">
          <div class="kpi-value indigo-text">2</div>
          <div class="kpi-label">Active Challenges</div>
          <div class="kpi-sub">1 expiring in 2 days</div>
        </div>
      </div>

      <!-- 2-Column Responsive Layout (58% / 42% split) -->
      <div class="dashboard-grid">
        
        <!-- Left Column (58%) -->
        <div class="left-col">
          <!-- Step Count 14-day Chart Card -->
          <div class="card chart-card">
            <div class="flex-between mb-lg">
              <h3 class="section-title">Daily Steps &mdash; Last 14 Days</h3>
              <span class="chart-subtitle">(ActivityItemResponse activityDate + stepCountValue)</span>
            </div>
            
            <!-- Chart Container -->
            <div class="bar-chart-container">
              <!-- Y-Axis markers -->
              <div class="y-axis-labels">
                <span>15k</span>
                <span>10k</span>
                <span>5k</span>
                <span>0</span>
              </div>

              <!-- Goal Line -->
              <div class="goal-line" style="bottom: 66.6%;">
                <span class="goal-label">10k goal</span>
              </div>

              <!-- Bars List -->
              <div class="chart-bars">
                @for (log of chartLogs(); track log.id) {
                  <div class="bar-col">
                    <div class="bar-wrapper">
                      <!-- Bar Tooltip -->
                      <div class="bar-tooltip">
                        <strong>{{ log.stepCount | number }}</strong> steps
                        <span class="text-xs">{{ log.submittedAt | date:'MMM d' }}</span>
                      </div>
                      <!-- Actual Bar -->
                      <div 
                        class="bar-fill" 
                        [ngClass]="getBarClass(log.stepCount)"
                        [style.height.%]="getBarHeightPercentage(log.stepCount)"
                      ></div>
                    </div>
                    <!-- Date Label -->
                    <span class="bar-date-label">{{ log.submittedAt | date:'d' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Chart Legend -->
            <div class="chart-legend mt-lg">
              <div class="legend-item"><span class="legend-dot green"></span> &ge;10k steps</div>
              <div class="legend-item"><span class="legend-dot amber"></span> 6k-10k</div>
              <div class="legend-item"><span class="legend-dot red"></span> &lt;6k</div>
              <div class="legend-item-goal"><span class="legend-line-dashed"></span> Goal Line</div>
              <div class="legend-item-today"><span class="legend-today-border"></span> Today</div>
            </div>
          </div>

          <!-- Active Challenges list -->
          <div class="card challenges-card">
            <h3 class="section-title mb-lg">Active Challenges</h3>
            
            <div class="challenges-list">
              @for (challenge of joinedChallenges(); track challenge.id) {
                <div class="challenge-row-item">
                  <div class="challenge-info">
                    <div class="challenge-header-info">
                      <h4>{{ challenge.name }}</h4>
                      <span class="chip" [ngClass]="challenge.status === 'ACTIVE' ? 'active' : 'closed'">
                        {{ challenge.status }}
                      </span>
                    </div>
                    <p class="challenge-desc">{{ challenge.description }}</p>
                    
                    <div class="challenge-meta">
                      <span class="scope-badge" [ngClass]="challenge.scope | lowercase">{{ challenge.scope }}</span>
                      @if (challenge.region) {
                        <span class="meta-label">{{ challenge.region }}</span>
                      }
                      <span class="meta-divider">&bull;</span>
                      <span class="expiry-text" [ngClass]="{'expires-soon': challenge.id === 1}">
                        {{ getChallengeExpiryText(challenge) }}
                      </span>
                    </div>
                  </div>
                  <div class="challenge-action">
                    <span class="rank-badge">Rank #{{ challenge.id === 1 ? '2' : '3' }}</span>
                    <button class="icon-btn" [routerLink]="['/challenges']">
                      <svg lucideIcon="chevron-right" size="18"></svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column (42%) -->
        <div class="right-col">
          <!-- My Tasks (Read-only progress list) -->
          <div class="card tasks-progress-card">
            <h3 class="section-title mb-lg">My Tasks</h3>
            
            <div class="tasks-progress-list">
              @for (task of dashboardTasks(); track task.id) {
                <div class="task-progress-item">
                  <div class="task-progress-header">
                    <div>
                      <span class="task-title">{{ task.name }}</span>
                      <span class="task-chip-status" [ngClass]="task.status | lowercase">{{ task.status }}</span>
                    </div>
                    <span class="points-badge">{{ task.points }} pts</span>
                  </div>
                  
                  <!-- Tag badge -->
                  <div class="task-tags mt-xs">
                    @for (tag of task.requiredTags; track tag) {
                      <span class="tag-chip">{{ tag }}</span>
                    }
                  </div>

                  <!-- Custom Progress bar visual matching Figma -->
                  <div class="progress-bar-wrapper mt-md">
                    <div class="progress-bar-track">
                      <div class="progress-bar-fill" [style.width.%]="getTaskProgressPercent(task.id)"></div>
                    </div>
                    <div class="progress-details mt-xs">
                      <span>{{ getTaskProgressSteps(task.id, task.steps) }} steps</span>
                      <span class="percent-label">{{ getTaskProgressPercent(task.id) }}% complete</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Reward Badges Row -->
          <div class="card rewards-card">
            <h3 class="section-title mb-lg">My Rewards</h3>
            
            <div class="rewards-badges-row">
              @for (badge of userBadges(); track badge.id) {
                <div class="reward-pill" [ngClass]="getRewardPillClass(badge.name)">
                  <svg lucideIcon="star" size="14"></svg>
                  <span>{{ badge.name }}</span>
                </div>
              }
              <!-- Locked placeholders -->
              <div class="reward-pill locked">
                <svg lucideIcon="star" size="14"></svg>
                <span>Goal-Getter (locked)</span>
              </div>
              <div class="reward-pill locked">
                <svg lucideIcon="star" size="14"></svg>
                <span>Night Owl (locked)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Greeting Banner */
    .greeting-banner {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 24px;
      border-radius: var(--r-xl);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        padding: 32px;
      }
    }

    .greeting-left {
      .greeting-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      h1 {
        font-size: 28px;
        color: white;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
      }
      .greeting-sub {
        font-size: 14px;
        color: var(--primary-100);
        margin: 0;
      }
    }

    .activity-dot-pulse {
      width: 10px;
      height: 10px;
      background-color: var(--success-500);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.5s infinite;
    }

    .greeting-right {
      display: flex;
      align-items: center;
      gap: 16px;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      border-radius: var(--r-xl);
      backdrop-filter: blur(4px);
      width: fit-content;
    }

    .mini-stat {
      display: flex;
      flex-direction: column;
      align-items: center;

      .label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--primary-100);
        font-weight: 600;
      }
      .val {
        font-size: 18px;
        font-weight: 800;
        color: white;
      }
    }

    .mini-stat-divider {
      width: 1px;
      height: 28px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;

      @media (min-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .kpi-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
      }

      &.blue-bar::before { background-color: var(--primary-600); }
      &.gold-bar::before { background-color: var(--warning-500); }
      &.green-bar::before { background-color: var(--success-500); }
      &.indigo-bar::before { background-color: #6366f1; }
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }

    .blue-text { color: var(--primary-600); }
    .gold-text { color: var(--warning-500); }
    .green-text { color: var(--success-600); }
    .indigo-text { color: #4f46e5; }

    .kpi-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* 2-Column Grid Layout */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;

      @media (min-width: 1024px) {
        grid-template-columns: 58% 42%;
      }
    }

    .left-col, .right-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .chart-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* HTML/CSS Bar Chart */
    .bar-chart-container {
      position: relative;
      height: 220px;
      margin-top: 16px;
      border-bottom: 1.5px solid var(--border);
      display: flex;
      padding-left: 36px;
    }

    .y-axis-labels {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      padding-bottom: 4px;
    }

    .goal-line {
      position: absolute;
      left: 36px;
      right: 0;
      border-top: 1.5px dashed var(--error-500);
      opacity: 0.8;
      z-index: 10;
      display: flex;
      align-items: center;

      .goal-label {
        position: absolute;
        right: 0;
        top: -16px;
        background-color: var(--bg-surface);
        padding: 0 4px;
        font-size: 10px;
        font-weight: 700;
        color: var(--error-500);
      }
    }

    .chart-bars {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 100%;
      padding: 0 8px;
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
    }

    .bar-wrapper {
      position: relative;
      width: 60%;
      max-width: 20px;
      min-width: 8px;
      height: calc(100% - 20px);
      display: flex;
      align-items: flex-end;
      cursor: pointer;

      &:hover {
        .bar-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translate(-50%, -8px);
        }
      }
    }

    .bar-fill {
      width: 100%;
      border-radius: var(--r-sm) var(--r-sm) 0 0;
      transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);

      &.green { background-color: var(--success-500); }
      &.amber { background-color: var(--warning-500); }
      &.red { background-color: var(--error-500); }
    }

    .bar-tooltip {
      visibility: hidden;
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translate(-50%, 0);
      background-color: var(--gray-900);
      color: white;
      padding: 6px 10px;
      border-radius: var(--r-xl);
      font-size: 11px;
      white-space: nowrap;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 50;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      
      &::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: var(--gray-900) transparent transparent transparent;
      }
    }

    .bar-date-label {
      margin-top: 6px;
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      
      &.green { background-color: var(--success-500); }
      &.amber { background-color: var(--warning-500); }
      &.red { background-color: var(--error-500); }
    }

    .legend-item-goal {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-line-dashed {
      width: 24px;
      border-top: 1.5px dashed var(--error-500);
    }

    .legend-item-today {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-today-border {
      width: 12px;
      height: 12px;
      border: 1.5px solid var(--primary-600);
      background-color: transparent;
      border-radius: 3px;
    }

    /* Active Challenges List */
    .challenges-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .challenge-row-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);

      &:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .challenge-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;

      .challenge-header-info {
        display: flex;
        align-items: center;
        gap: 8px;
        h4 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
      }
      .challenge-desc {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .challenge-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;

      .scope-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        
        &.friendly { background-color: rgba(99, 102, 241, 0.15); color: #4f46e5; }
        &.regional { background-color: rgba(220, 38, 38, 0.1); color: var(--error-600); }
        &.global { background-color: rgba(37, 99, 235, 0.15); color: var(--primary-600); }
      }

      .meta-divider {
        color: var(--gray-400);
      }

      .expiry-text {
        color: var(--text-secondary);
        &.expires-soon {
          color: var(--success-600);
        }
      }
    }

    .challenge-action {
      display: flex;
      align-items: center;
      gap: 16px;

      .rank-badge {
        font-size: 12px;
        font-weight: 700;
        color: var(--warning-500);
        background-color: rgba(245, 158, 11, 0.1);
        padding: 4px 10px;
        border-radius: var(--r-xl);
      }
    }

    /* Tasks Progress list */
    .tasks-progress-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .task-progress-item {
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);

      &:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .task-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .task-title {
        font-weight: 700;
        font-size: 15px;
      }
      .task-chip-status {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        margin-left: 8px;
        text-transform: uppercase;
        
        &.active { background-color: rgba(16, 185, 129, 0.15); color: var(--success-600); }
        &.inactive { background-color: rgba(148, 163, 184, 0.15); color: var(--gray-700); }
      }
      .points-badge {
        font-size: 13px;
        font-weight: 700;
        color: var(--primary-600);
      }
    }

    .task-tags {
      display: flex;
      gap: 6px;
    }

    .tag-chip {
      background-color: var(--gray-100);
      color: var(--text-secondary);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .progress-bar-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

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
      transition: width 0.6s ease;
    }

    .progress-details {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      
      .percent-label {
        color: var(--primary-600);
      }
    }

    /* Rewards Badges Row */
    .rewards-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .reward-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      border-radius: var(--r-full);
      border: 1px solid transparent;
      
      &.early-bird {
        background-color: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
        color: var(--warning-500);
      }
      
      &.weekend-warrior {
        background-color: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
        color: var(--primary-500);
      }
      
      &.consistent-performer {
        background-color: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
        color: var(--success-600);
      }
      
      &.locked {
        background-color: var(--gray-100);
        border-color: var(--gray-200);
        color: var(--gray-400);
        opacity: 0.7;
      }
    }

    /* Utilities */
    .mb-lg { margin-bottom: 16px; }
    .mt-xs { margin-top: 4px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }
    .w-full { width: 100%; }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private store = inject(Store);
  private authService = inject(AuthService);

  userName = () => this.authService.currentUser()?.name || 'User';
  userPoints = () => this.authService.currentUser()?.points || 0;
  userId = () => this.authService.currentUser()?.id || 1;

  // Store Selectors
  chartLogs = this.store.selectSignal(telemetryFeature.selectTelemetryLogs);
  userBadges = this.store.selectSignal(telemetryFeature.selectBadges);
  allTasks = this.store.selectSignal(tasksFeature.selectTasks);
  allChallenges = this.store.selectSignal(challengesFeature.selectChallenges);

  // Return the first 4 tasks for dashboard preview list
  dashboardTasks = () => this.allTasks().slice(0, 4);

  // Return active challenges that the user joined
  joinedChallenges = () => {
    const uid = this.userId();
    return this.allChallenges().filter(c => c.participants.includes(uid));
  };

  ngOnInit() {
    this.store.dispatch(tasksActions.loadTasks());
    this.store.dispatch(challengesActions.loadChallenges());
    this.store.dispatch(telemetryActions.loadTelemetryAndBadges({ userId: this.userId() }));
    this.store.dispatch(leaderboardActions.loadLeaderboard());
  }

  // Get simulated progress steps based on mock figma details
  getTaskProgressSteps(taskId: number, targetSteps: number): string {
    const progress: { [key: number]: number } = {
      1: 125,  // 125/500
      2: 430,  // 430/1000
      3: 1220, // 1220/2000
      4: 2370, // 2370/3000
      5: 4200  // 4200/5000
    };
    const current = progress[taskId] || 0;
    return `${current.toLocaleString()} / ${targetSteps.toLocaleString()}`;
  }

  getTaskProgressPercent(taskId: number): number {
    const percentages: { [key: number]: number } = {
      1: 25,
      2: 43,
      3: 61,
      4: 79,
      5: 84
    };
    return percentages[taskId] || 0;
  }

  // Get height of bar relative to max 15k steps
  getBarHeightPercentage(steps: number): number {
    const maxSteps = 15000;
    return Math.min(100, Math.round((steps / maxSteps) * 100));
  }

  getBarClass(steps: number): string {
    if (steps >= 10000) return 'green';
    if (steps >= 6000) return 'amber';
    return 'red';
  }

  getChallengeExpiryText(challenge: any): string {
    if (challenge.status === 'CLOSED') return 'Closed';
    // Mock calculate days left
    const expiry: { [key: number]: string } = {
      1: 'Expires in 11d',
      3: 'Expires in 19d',
      4: 'Expires in 24d'
    };
    return expiry[challenge.id] || 'Expires soon';
  }

  getRewardPillClass(name: string): string {
    return name.toLowerCase().replace(/\\s+/g, '-');
  }
}
