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
  template: `
    <div class="users-directory-container">
      
      <!-- Header Row -->
      <div class="admin-header-row mb-lg">
        <h1>Users</h1>
        <p class="subtitle text-secondary">
          All registered users &bull; UserProgressResponse merged &bull; {{ allUsers().length }} total
        </p>
      </div>

      <!-- Search + Filter bar -->
      <div class="search-filter-molecule card mb-lg">
        <div class="search-wrapper">
          <svg lucideIcon="search" class="search-icon" size="18"></svg>
          <input 
            type="text" 
            placeholder="Search users..." 
            [value]="searchText()"
            (input)="onSearchInput($event)"
          />
        </div>
        
        <div class="filter-btn-group">
          <button 
            class="filter-tab" 
            [ngClass]="{'active': regionFilter() === 'all'}"
            (click)="setRegionFilter('all')"
          >All</button>
          <button 
            class="filter-tab" 
            [ngClass]="{'active': regionFilter() === 'APAC'}"
            (click)="setRegionFilter('APAC')"
          >APAC</button>
          <button 
            class="filter-tab" 
            [ngClass]="{'active': regionFilter() === 'EMEA'}"
            (click)="setRegionFilter('EMEA')"
          >EMEA</button>
          <button 
            class="filter-tab" 
            [ngClass]="{'active': regionFilter() === 'AMER'}"
            (click)="setRegionFilter('AMER')"
          >AMER</button>
        </div>

        <div class="results-count ml-auto">
          {{ sortedFilteredUsers().length }} users
        </div>
      </div>

      <!-- Users list data table -->
      <div class="card table-card overflow-x">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Region</th>
              <th>Points</th>
              <th style="width: 80px;">Rank</th>
              <th>Badges</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of sortedFilteredUsers(); track user.id) {
              <tr>
                <td class="id-col">{{ user.id }}</td>
                <td>
                  <div class="user-identity">
                    <!-- Colored initials avatar -->
                    <div class="user-avatar" [style.background-color]="getAvatarBgColor(user.id)">
                      {{ getInitials(user.name) }}
                    </div>
                    <span class="font-bold">{{ user.name }}</span>
                  </div>
                </td>
                <td class="email-col">{{ user.email }}</td>
                <td>
                  <span class="region-chip">{{ user.region || 'APAC' }}</span>
                </td>
                <td>
                  <!-- Points mini bar progress visual -->
                  <div class="points-progress-wrapper">
                    <span class="points-text font-bold">{{ user.points | number }}</span>
                    <div class="points-bar-track">
                      <div class="points-bar-fill" [style.width.%]="getPointsPercentage(user.points)"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <app-rank-badge [rank]="getUserRank(user.id)"></app-rank-badge>
                </td>
                <td>
                  <!-- Stars badges row -->
                  <div class="stars-row">
                    @for (star of getStarsArray(user.points); track star) {
                      <svg lucideIcon="star" class="star-gold" size="12"></svg>
                    }
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="action-icon-btn view" (click)="onView(user)" aria-label="View user profile">
                      <svg lucideIcon="eye" size="14"></svg>
                    </button>
                    <button class="action-icon-btn edit" (click)="onEdit(user)" aria-label="Edit user details">
                      <svg lucideIcon="edit-2" size="14"></svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="text-center py-xl">
                  <div class="empty-state">
                    <svg lucideIcon="alert-triangle" size="32" class="text-secondary"></svg>
                    <p class="mt-sm font-bold">No users registered in this region</p>
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
    .users-directory-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Search filter molecule */
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
      max-width: 300px;
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

    .filter-btn-group {
      display: flex;
      background-color: var(--gray-100);
      padding: 3px;
      border-radius: var(--r-xl);
      gap: 2px;
      width: 100%;
      max-width: fit-content;
    }

    .filter-tab {
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        background-color: var(--bg-surface);
        color: var(--primary-600);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
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

      .id-col {
        color: var(--text-secondary);
        font-weight: 600;
        width: 60px;
      }

      .email-col {
        color: var(--text-secondary);
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
          &.view { background-color: var(--primary-600); border-color: var(--primary-600); }
          &.edit { background-color: var(--warning-500); border-color: var(--warning-500); }
        }
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

    /* Points mini progress bar */
    .points-progress-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      max-width: 140px;
      
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

    .ml-auto { margin-left: auto; }
    .py-xl { padding-top: 48px; padding-bottom: 48px; }
    .text-center { text-align: center; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `]
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
