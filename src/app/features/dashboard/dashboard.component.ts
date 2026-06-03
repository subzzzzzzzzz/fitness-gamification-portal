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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
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
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}
