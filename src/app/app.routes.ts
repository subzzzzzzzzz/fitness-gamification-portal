import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-split.component').then(m => m.AuthSplitComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/auth-split.component').then(m => m.AuthSplitComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'challenges',
        loadComponent: () => import('./features/challenges/challenges.component').then(m => m.ChallengesComponent)
      },
      {
        path: 'activity',
        loadComponent: () => import('./features/telemetry/activity.component').then(m => m.ActivityComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'admin/tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent),
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' }
      },
      {
        path: 'admin/challenges',
        loadComponent: () => import('./features/challenges/challenges.component').then(m => m.ChallengesComponent),
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' }
      },
      {
        path: 'admin/devices',
        loadComponent: () => import('./features/devices/devices.component').then(m => m.DevicesComponent),
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' }
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
