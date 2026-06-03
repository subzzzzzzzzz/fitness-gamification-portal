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
  template: `
    <div class="leaderboard-container">
      
      <!-- Header Row -->
      <div class="leaderboard-header-row flex-between mb-lg">
        <div>
          <h1>Leaderboard</h1>
          @if (isAdmin()) {
            <p class="subtitle text-secondary">Trigger ranking jobs and view full community leaderboard</p>
          } @else {
            <p class="subtitle text-secondary">Your Rank: #{{ userRank() }} &bull; {{ userPoints() | number }} pts</p>
          }
        </div>
        
        <!-- Admin trigger controls -->
        @if (isAdmin()) {
          <button 
            class="btn btn-primary" 
            (click)="triggerRankUpdate()" 
            [disabled]="jobRunning()"
          >
            <svg [lucideIcon]="'refresh-cw'" [ngClass]="{'spin': jobRunning()}" size="16"></svg>
            {{ jobRunning() ? 'Calculating...' : 'Trigger Ranking' }}
          </button>
        }
      </div>

      <!-- User Highlighting Banner (if not admin) -->
      @if (!isAdmin() && userRank() > 0) {
        <div class="user-highlight-banner mb-lg">
          <div class="user-highlight-info">
            <span class="rank-capsule font-bold">#{{ userRank() }}</span>
            <span class="user-details font-bold">
              {{ userName() }} &bull; {{ userPoints() | number }} pts &bull; {{ userRegion() }}
            </span>
          </div>
          <div class="user-highlight-trend font-bold">
            <svg lucideIcon="arrow-up" size="14" class="text-success mr-xs"></svg>
            <span class="text-success">+2 this week</span>
          </div>
        </div>
      }

      <!-- Leaderboard Data Table -->
      <div class="card table-card overflow-x">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px;">Rank</th>
              <th>Name</th>
              <th>Region</th>
              <th>Points</th>
              <th>Activities</th>
              <th>Badges</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            @for (user of rankedUsers(); track user.id; let idx = $index) {
              <tr [ngClass]="{'current-user-row': user.id === currentUserId()}">
                <td>
                  <app-rank-badge [rank]="idx + 1"></app-rank-badge>
                </td>
                <td>
                  <div class="user-identity">
                    <!-- Avatar circle with hash-based color -->
                    <div class="user-avatar" [style.background-color]="getAvatarBgColor(user.id)">
                      {{ getInitials(user.name) }}
                    </div>
                    <!-- Masked names for normal users, full names for admins -->
                    <span class="font-bold">
                      @if (isAdmin() || user.id === currentUserId()) {
                        {{ user.name }}
                      } @else {
                        {{ user.name | appMask }}
                      }
                    </span>
                  </div>
                </td>
                <td>
                  <span class="region-chip">{{ user.region || 'APAC' }}</span>
                </td>
                <td>
                  <!-- Points mini-bar visual matching Figma -->
                  <div class="points-progress-wrapper">
                    <span class="points-text font-bold">{{ user.points | number }}</span>
                    <div class="points-bar-track">
                      <div class="points-bar-fill" [style.width.%]="getPointsPercentage(user.points)"></div>
                    </div>
                  </div>
                </td>
                <td>{{ getActivitiesCount(user.id) }}</td>
                <td>
                  <div class="stars-row">
                    @for (star of getStarsArray(user.points); track star) {
                      <svg lucideIcon="star" class="star-gold" size="12"></svg>
                    }
                  </div>
                </td>
                <td>
                  <svg 
                    [lucideIcon]="getTrendIcon(user.id)" 
                    [ngClass]="getTrendClass(user.id)" 
                    size="16"
                  ></svg>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-xl">
                  <div class="empty-state">
                    <svg lucideIcon="refresh-cw" size="32" class="text-secondary"></svg>
                    <p class="mt-sm font-bold">No rankings calculated yet</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `,
  styles: [`
    .leaderboard-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* User Highlight Banner */
    .user-highlight-banner {
      background-color: var(--primary-600);
      color: white;
      border-radius: var(--r-xl);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px rgba(37,99,235,0.15);
      border-left: 6px solid var(--success-500);

      .user-highlight-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .rank-capsule {
        background-color: rgba(255,255,255,0.2);
        padding: 4px 10px;
        border-radius: var(--r-xl);
        font-size: 14px;
      }

      .user-details {
        font-size: 15px;
      }

      .user-highlight-trend {
        display: flex;
        align-items: center;
        font-size: 13px;
        background-color: rgba(255,255,255,0.1);
        padding: 4px 10px;
        border-radius: var(--r-xl);

        .text-success { color: var(--success-500); }
      }
    }

    /* Table Styles */
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
        padding: 14px 20px;
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

      .current-user-row {
        background-color: rgba(37,99,235,0.03) !important;
        border-left: 4px solid var(--primary-600);
      }
    }

    .user-identity {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      box-shadow: inset 0 -2px 0 rgba(0,0,0,0.1);
    }

    .region-chip {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary-600);
      background-color: rgba(37,99,235,0.08);
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* Points mini-progress bar */
    .points-progress-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      max-width: 160px;
      
      .points-text {
        font-size: 13px;
        color: var(--text-primary);
      }
      .points-bar-track {
        height: 5px;
        background-color: var(--gray-100);
        border-radius: 3px;
        overflow: hidden;
      }
      .points-bar-fill {
        height: 100%;
        background-color: var(--success-500);
        border-radius: 3px;
      }
    }

    .stars-row {
      display: flex;
      gap: 2px;
      
      .star-gold {
        color: var(--warning-500);
        fill: var(--warning-500);
      }
    }

    .text-success { color: var(--success-600); }
    .text-error { color: var(--error-500); }

    .spin {
      animation: rotating 1s linear infinite;
    }

    @keyframes rotating {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .mr-xs { margin-right: 4px; }
    .mb-lg { margin-bottom: 16px; }
    .py-xl { padding-top: 48px; padding-bottom: 48px; }
    .text-center { text-align: center; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `]
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
