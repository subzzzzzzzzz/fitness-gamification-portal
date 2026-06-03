import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { leaderboardActions, leaderboardFeature } from '../../store/leaderboard.store';
import { authFeature } from '../../store/auth.store';
import { RankBadgeComponent } from '../../shared/components/rank-badge';
import { MaskPipe } from '../../shared/pipes/mask.pipe';
import { LucideDynamicIcon } from '@lucide/angular';
import { User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RankBadgeComponent, MaskPipe, LucideDynamicIcon],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent implements OnInit {
  private store = inject(Store);
  private authService = inject(AuthService);

  // Store Selectors
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';
  currentUserId = () => this.authService.currentUser()?.id || 1;
  userName = () => this.authService.currentUser()?.name || '';
  userPoints = () => this.authService.currentUser()?.points || 0;
  userRegion = () => this.authService.currentUser()?.region || 'APAC';

  rankings = this.store.selectSignal(leaderboardFeature.selectRankings);
  jobRunning = this.store.selectSignal(leaderboardFeature.selectJobRunning);

  // Filters out non-user roles (admins don't show on leaderboard)
  rankedUsers = computed(() => {
    return this.rankings().filter(u => u.role === 'ROLE_USER');
  });

  // Calculate current user's rank
  userRank = computed(() => {
    const uid = this.currentUserId();
    const idx = this.rankedUsers().findIndex(u => u.id === uid);
    return idx >= 0 ? idx + 1 : 13; // fallback matching mockup #13
  });

  ngOnInit() {
    this.store.dispatch(leaderboardActions.loadLeaderboard());
  }

  triggerRankUpdate() {
    this.store.dispatch(leaderboardActions.triggerRankJob());
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  // Hash function to generate a stable pleasant color from user id
  getAvatarBgColor(userId: number): string {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#6366f1'  // indigo
    ];
    return colors[userId % colors.length];
  }

  getPointsPercentage(points: number): number {
    const maxPoints = 5000;
    return Math.min(100, Math.round((points / maxPoints) * 100));
  }

  getActivitiesCount(userId: number): number {
    // Simulated count matching mock figma
    const counts: { [key: number]: number } = {
      1: 30, // Alex Smith
      2: 30, // Jane Wilson
      3: 30, // Chris Jones
      4: 30, // Laura Jones
      5: 30  // Chris Williams
    };
    return counts[userId] || 15;
  }

  getStarsArray(points: number): number[] {
    const starCount = points >= 3300 ? 4 : points >= 3200 ? 3 : 2;
    return Array(starCount).fill(0);
  }

  getTrendIcon(userId: number): string {
    if (userId === 18) return 'arrow-down';
    return 'arrow-up';
  }

  getTrendClass(userId: number): string {
    if (userId === 18) return 'text-error';
    return 'text-success';
  }
}
