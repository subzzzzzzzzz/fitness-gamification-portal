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
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
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
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  triggerRankJob() {
    this.store.dispatch(leaderboardActions.triggerRankJob());
  }

  triggerGameJob() {
    this.store.dispatch(leaderboardActions.triggerGameJob());
  }
}
