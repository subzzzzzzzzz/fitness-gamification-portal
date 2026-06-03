import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rank-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rank-badge-container" [ngClass]="getMedalClass()">
      {{ getRankText() }}
    </div>
  `,
  styles: [`
    .rank-badge-container {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
      border: 1.5px solid var(--border);
    }
    .gold {
      border-color: #eab308;
      background-color: rgba(234, 179, 8, 0.1);
      color: #ca8a04;
    }
    .silver {
      border-color: #94a3b8;
      background-color: rgba(148, 163, 184, 0.1);
      color: #475569;
    }
    .bronze {
      border-color: #b45309;
      background-color: rgba(180, 83, 9, 0.1);
      color: #92400e;
    }
    .normal {
      border: none;
      font-weight: 600;
    }
  `]
})
export class RankBadgeComponent {
  @Input() rank!: number;

  getMedalClass(): string {
    if (this.rank === 1) return 'gold';
    if (this.rank === 2) return 'silver';
    if (this.rank === 3) return 'bronze';
    return 'normal';
  }

  getRankText(): string {
    if (this.rank <= 3) return this.rank.toString();
    return `#${this.rank}`;
  }
}
