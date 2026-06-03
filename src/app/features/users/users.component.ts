import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { usersActions, usersFeature } from '../../store/users.store';
import { RankBadgeComponent } from '../../shared/components/rank-badge';
import { LucideDynamicIcon } from '@lucide/angular';
import { User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RankBadgeComponent, LucideDynamicIcon],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private store = inject(Store);

  // Signals
  searchText = signal<string>('');
  regionFilter = signal<string>('all');

  // Store Selector
  allUsers = this.store.selectSignal(usersFeature.selectUsers);

  // Filter out admins and sort by points descending to determine rank
  rankedUsers = computed(() => {
    return this.allUsers()
      .filter(u => u.role === 'ROLE_USER')
      .sort((a, b) => b.points - a.points);
  });

  // Dynamic filter for display table
  sortedFilteredUsers = computed(() => {
    let list = [...this.rankedUsers()];

    // Search query
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      list = list.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      );
    }

    // Region filter
    const region = this.regionFilter();
    if (region !== 'all') {
      list = list.filter(u => u.region === region);
    }

    return list;
  });

  ngOnInit() {
    this.store.dispatch(usersActions.loadUsers());
  }

  onSearchInput(event: Event) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  setRegionFilter(region: string) {
    this.regionFilter.set(region);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarBgColor(userId: number): string {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
    return colors[userId % colors.length];
  }

  getPointsPercentage(points: number): number {
    const maxPoints = 5000;
    return Math.min(100, Math.round((points / maxPoints) * 100));
  }

  getUserRank(userId: number): number {
    const idx = this.rankedUsers().findIndex(u => u.id === userId);
    return idx >= 0 ? idx + 1 : 1;
  }

  getStarsArray(points: number): number[] {
    const starCount = points >= 3300 ? 4 : points >= 3200 ? 3 : 2;
    return Array(starCount).fill(0);
  }

  onView(user: User) {
    alert(`Viewing user profile: ${user.name}\nPoints: ${user.points}\nRegion: ${user.region}`);
  }

  onEdit(user: User) {
    const newPoints = prompt(`Edit Points for ${user.name}:`, user.points.toString());
    if (newPoints !== null && !isNaN(Number(newPoints))) {
      this.store.dispatch(usersActions.updateUser({
        id: user.id,
        changes: { points: Number(newPoints) }
      }));
    }
  }
}
