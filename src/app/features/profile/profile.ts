import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { authFeature } from '../../store/auth.store';
import { telemetryFeature, telemetryActions } from '../../store/telemetry.store';
import { leaderboardFeature, leaderboardActions } from '../../store/leaderboard.store';
import { AuthService } from '../../core/services/auth.service';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  template: `
    <div class="profile-container">
      
      <!-- USER PROFILE VIEW -->
      @if (!isAdmin()) {
        <div class="profile-header-row flex-between mb-lg">
          <div>
            <h1>My Profile</h1>
            <p class="subtitle text-secondary">GET /user/{{ userId() }} &bull; UserProgressResponse</p>
          </div>
          <button class="btn btn-secondary" (click)="editProfile()">
            <svg lucideIcon="user" size="16"></svg>
            Edit Profile
          </button>
        </div>

        <div class="profile-grid">
          
          <!-- Left Column Card -->
          <div class="left-col">
            <div class="card center-content">
              <div class="large-avatar-circle">
                {{ userInitials() }}
              </div>
              
              <h2 class="mt-md mb-xs">{{ userName() }}</h2>
              <span class="email-sub text-secondary">{{ userEmail() }}</span>
              
              <span class="region-chip mt-md">Region: {{ userRegion() }}</span>

              <div class="profile-stats-divider mt-lg mb-lg"></div>

              <div class="profile-stats-list w-full">
                <div class="stat-row flex-between">
                  <span class="label text-secondary">Total Points</span>
                  <span class="val font-bold primary-text">{{ userPoints() | number }}</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Global Rank</span>
                  <span class="val font-bold warning-text">#13</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Activities Logged</span>
                  <span class="val font-bold">30</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Badges Earned</span>
                  <span class="val font-bold text-success">{{ earnedBadges().length }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column Details -->
          <div class="right-col">
            <!-- Card 1: Profile Information -->
            <div class="card">
              <h3 class="subsection-title mb-lg">Profile Information</h3>
              
              <div class="read-only-form">
                <div class="form-field-view">
                  <span class="lbl">Full Name</span>
                  <span class="val">{{ userName() }}</span>
                </div>
                <div class="form-field-view">
                  <span class="lbl">Email</span>
                  <span class="val">{{ userEmail() }}</span>
                </div>
                <div class="form-field-view">
                  <span class="lbl">Phone</span>
                  <span class="val">{{ userPhone() }}</span>
                </div>
                <div class="form-field-view">
                  <span class="lbl">City</span>
                  <span class="val">{{ userCity() }}</span>
                </div>
                <div class="form-field-view full-width">
                  <span class="lbl">Region</span>
                  <span class="val">{{ userRegion() }}</span>
                </div>
              </div>
            </div>

            <!-- Card 2: My Rewards & Badges -->
            <div class="card mt-lg">
              <h3 class="subsection-title mb-lg">My Rewards & Badges</h3>
              
              <div class="badges-catalog-list">
                @for (badge of earnedBadges(); track badge.id) {
                  <div class="badge-item-row" [ngClass]="getBadgeClass(badge.name)">
                    <div class="badge-icon-capsule">
                      <svg lucideIcon="star" size="14"></svg>
                    </div>
                    <div class="badge-details">
                      <div class="name font-bold">{{ badge.name }}</div>
                      <div class="desc text-secondary">{{ badge.description }}</div>
                    </div>
                  </div>
                }

                <!-- Locked items -->
                <div class="badge-item-row locked">
                  <div class="badge-icon-capsule">
                    <svg lucideIcon="star" size="14"></svg>
                  </div>
                  <div class="badge-details">
                    <div class="name font-bold">Goal-Getter <span class="lock-lbl">(locked)</span></div>
                    <div class="desc text-secondary">Hit 10,000-step goal 10 days/month</div>
                  </div>
                </div>

                <div class="badge-item-row locked">
                  <div class="badge-icon-capsule">
                    <svg lucideIcon="star" size="14"></svg>
                  </div>
                  <div class="badge-details">
                    <div class="name font-bold">Night Owl <span class="lock-lbl">(locked)</span></div>
                    <div class="desc text-secondary">Log activity after 9 PM, 5 times</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      } @else {
        <!-- ADMIN PROFILE VIEW (Figma Page 40) -->
        <div class="profile-header-row flex-between mb-lg">
          <div>
            <h1>Admin Profile & Platform Controls</h1>
            <p class="subtitle text-secondary">GET /rank &bull; GET /game &bull; Trigger ranking and gamification jobs</p>
          </div>
        </div>

        <div class="profile-grid">
          <!-- Left Column: Admin Details -->
          <div class="left-col">
            <div class="card center-content">
              <div class="large-avatar-circle admin-theme">
                {{ userInitials() }}
              </div>
              
              <span class="role-badge-capsule mt-md">ADMIN</span>
              
              <h2 class="mt-sm mb-xs">{{ userName() }}</h2>
              <span class="email-sub text-secondary">{{ userEmail() }}</span>

              <div class="profile-stats-divider mt-lg mb-lg"></div>

              <div class="profile-stats-list w-full">
                <div class="stat-row flex-between">
                  <span class="label text-secondary">Role</span>
                  <span class="val font-bold">Administrator</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Platform</span>
                  <span class="val font-bold primary-text">Smartwatch LB</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Users Managed</span>
                  <span class="val font-bold">20</span>
                </div>
                <div class="stat-row flex-between mt-sm">
                  <span class="label text-secondary">Active Challenges</span>
                  <span class="val font-bold">3</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Jobs & Catalog -->
          <div class="right-col">
            <!-- Job Controls -->
            <div class="card">
              <h3 class="subsection-title mb-lg">Platform Job Controls</h3>
              
              <div class="jobs-list">
                <!-- Job 1 -->
                <div class="job-item-card">
                  <div class="job-info">
                    <h4 class="font-bold flex-gap-sm">
                      <span class="job-dot blue-dot"></span>
                      Ranking Calculation Job
                    </h4>
                    <p class="job-desc text-secondary">
                      <code>GET /rank</code> &bull; Recalculates user rankings from all activity data
                    </p>
                    <p class="job-metadata mt-xs">
                      Last run: 27 May 2026, 10:00 AM &bull; Status: <span class="text-success font-bold">&check; Success</span> &bull; 20 records updated
                    </p>
                  </div>
                  <button 
                    class="btn btn-primary" 
                    (click)="triggerRankJob()" 
                    [disabled]="jobRunning()"
                  >
                    <svg lucideIcon="play" size="14"></svg>
                    Trigger Now
                  </button>
                </div>

                <!-- Job 2 -->
                <div class="job-item-card mt-md">
                  <div class="job-info">
                    <h4 class="font-bold flex-gap-sm">
                      <span class="job-dot purple-dot"></span>
                      Gamification & Badging Job
                    </h4>
                    <p class="job-desc text-secondary">
                      <code>GET /game</code> &bull; Evaluates badge criteria and awards rewards
                    </p>
                    <p class="job-metadata mt-xs">
                      Last run: 27 May 2026, 09:55 AM &bull; Status: <span class="text-success font-bold">&check; Success</span> &bull; 12 badges awarded
                    </p>
                  </div>
                  <button 
                    class="btn btn-primary purple-btn" 
                    (click)="triggerGameJob()" 
                    [disabled]="jobRunning()"
                  >
                    <svg lucideIcon="sparkles" size="14"></svg>
                    Trigger Now
                  </button>
                </div>
              </div>
            </div>

            <!-- Badge Catalog -->
            <div class="card mt-lg">
              <h3 class="subsection-title mb-lg">Badge Catalog</h3>
              
              <div class="badges-catalog-list">
                <div class="badge-item-row early-bird">
                  <div class="badge-icon-capsule"><svg lucideIcon="star" size="14"></svg></div>
                  <div class="badge-details">
                    <div class="name font-bold">Early Bird</div>
                    <div class="desc text-secondary">&mdash; Log 5 activities before 9 AM</div>
                  </div>
                </div>

                <div class="badge-item-row weekend-warrior">
                  <div class="badge-icon-capsule"><svg lucideIcon="star" size="14"></svg></div>
                  <div class="badge-details">
                    <div class="name font-bold">Weekend Warrior</div>
                    <div class="desc text-secondary">&mdash; Log activity on 3 consecutive weekends</div>
                  </div>
                </div>

                <div class="badge-item-row consistent-performer">
                  <div class="badge-icon-capsule"><svg lucideIcon="star" size="14"></svg></div>
                  <div class="badge-details">
                    <div class="name font-bold">Consistent Performer</div>
                    <div class="desc text-secondary">&mdash; Log activity 14 consecutive days</div>
                  </div>
                </div>

                <div class="badge-item-row goal-getter">
                  <div class="badge-icon-capsule"><svg lucideIcon="star" size="14"></svg></div>
                  <div class="badge-details">
                    <div class="name font-bold">Goal-Getter</div>
                    <div class="desc text-secondary">&mdash; Hit 10,000-step goal 10 days/month</div>
                  </div>
                </div>

                <div class="badge-item-row night-owl">
                  <div class="badge-icon-capsule"><svg lucideIcon="star" size="14"></svg></div>
                  <div class="badge-details">
                    <div class="name font-bold">Night Owl</div>
                    <div class="desc text-secondary">&mdash; Log activity after 9 PM, 5 times</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Grid Layout */
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;

      @media (min-width: 768px) {
        grid-template-columns: 32% 68%;
      }
    }

    .left-col {
      display: flex;
      flex-direction: column;
    }

    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 20px;
    }

    .large-avatar-circle {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background-color: var(--primary-600);
      color: white;
      font-weight: 800;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(37,99,235,0.15);
      
      &.admin-theme {
        background-color: #1e293b;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }
    }

    .role-badge-capsule {
      background-color: var(--error-500);
      color: white;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 12px;
      border-radius: var(--r-xl);
      letter-spacing: 0.5px;
    }

    .email-sub {
      font-size: 13px;
    }

    .region-chip {
      background-color: var(--gray-100);
      color: var(--text-primary);
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: var(--r-xl);
    }

    .profile-stats-divider {
      width: 100%;
      height: 1px;
      background-color: var(--border);
    }

    .profile-stats-list {
      .stat-row {
        font-size: 14px;
      }
      .primary-text { color: var(--primary-600); }
      .warning-text { color: var(--warning-500); }
      .text-success { color: var(--success-600); }
    }

    /* Right Column Read-only Form */
    .read-only-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px 20px;

      @media (min-width: 480px) {
        grid-template-columns: 1fr 1fr;
        .full-width {
          grid-column: span 2;
        }
      }
    }

    .form-field-view {
      display: flex;
      flex-direction: column;
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 6px;

      .lbl {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .val {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-top: 4px;
      }
    }

    /* Badge rows */
    .badges-catalog-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .badge-item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      border-radius: var(--r-xl);
      border: 1.5px solid transparent;

      .badge-icon-capsule {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .badge-details {
        .name { font-size: 14px; }
        .desc { font-size: 12px; }
      }

      &.early-bird {
        background-color: rgba(245,158,11,0.05);
        border-color: rgba(245,158,11,0.15);
        .badge-icon-capsule { color: var(--warning-500); }
      }

      &.weekend-warrior {
        background-color: rgba(139,92,246,0.05);
        border-color: rgba(139,92,246,0.15);
        .badge-icon-capsule { color: #8b5cf6; }
      }

      &.consistent-performer {
        background-color: rgba(16,185,129,0.05);
        border-color: rgba(16,185,129,0.15);
        .badge-icon-capsule { color: var(--success-600); }
      }

      &.goal-getter {
        background-color: rgba(37,99,235,0.05);
        border-color: rgba(37,99,235,0.15);
        .badge-icon-capsule { color: var(--primary-600); }
      }

      &.night-owl {
        background-color: rgba(75,85,99,0.05);
        border-color: rgba(75,85,99,0.15);
        .badge-icon-capsule { color: var(--gray-700); }
      }

      &.locked {
        background-color: var(--gray-50);
        border-color: var(--gray-200);
        opacity: 0.6;
        .badge-icon-capsule { color: var(--gray-400); }
        .lock-lbl { font-size: 11px; font-weight: normal; }
      }
    }

    /* Admin Jobs */
    .jobs-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .job-item-card {
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
      }

      .job-info {
        flex: 1;
        h4 { margin: 0; font-size: 15px; }
        .job-desc { font-size: 13px; margin: 4px 0 0 0; }
        .job-metadata { font-size: 11px; color: var(--text-secondary); margin: 6px 0 0 0; }
      }

      .job-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        &.blue-dot { background-color: var(--primary-600); }
        &.purple-dot { background-color: #8b5cf6; }
      }

      .purple-btn {
        background-color: #8b5cf6;
        color: white;
        &:hover { background-color: #7c3aed; }
      }
    }

    /* Helper Utilities */
    .ml-auto { margin-left: auto; }
    .w-full { width: 100%; }
    .mt-xs { margin-top: 4px; }
    .mt-sm { margin-top: 8px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }
    .mb-xs { margin-bottom: 4px; }
    .mb-sm { margin-bottom: 8px; }
    .mb-md { margin-bottom: 12px; }
    .mb-lg { margin-bottom: 16px; }
    .text-center { text-align: center; }
  `]
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private authService = inject(AuthService);

  // Store Selectors
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';
  userId = () => this.authService.currentUser()?.id || 1;
  userName = () => this.authService.currentUser()?.name || '';
  userEmail = () => this.authService.currentUser()?.email || '';
  userPoints = () => this.authService.currentUser()?.points || 0;
  userRegion = () => this.authService.currentUser()?.region || 'APAC';
  userPhone = () => this.authService.currentUser()?.phone || '+91 690-933-8847';
  userCity = () => this.authService.currentUser()?.city || 'Bengaluru';

  earnedBadges = this.store.selectSignal(telemetryFeature.selectBadges);
  jobRunning = this.store.selectSignal(leaderboardFeature.selectJobRunning);

  ngOnInit() {
    this.store.dispatch(telemetryActions.loadTelemetryAndBadges({ userId: this.userId() }));
    this.store.dispatch(leaderboardActions.loadLeaderboard());
  }

  userInitials() {
    const name = this.userName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  editProfile() {
    alert('Simulated Edit Profile form opened. Changes can be saved.');
  }

  getBadgeClass(name: string): string {
    return name.toLowerCase().replace(/\\s+/g, '-');
  }

  triggerRankJob() {
    this.store.dispatch(leaderboardActions.triggerRankJob());
  }

  triggerGameJob() {
    this.store.dispatch(leaderboardActions.triggerGameJob());
  }
}
