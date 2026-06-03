import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  template: `
    <div class="shell-layout" [attr.data-theme]="theme()">
      <!-- Top Navigation Bar -->
      <header class="top-navbar">
        <div class="nav-left">
          <!-- Mobile Menu Toggle -->
          <button class="icon-btn mobile-only" (click)="toggleSidebar()" aria-label="Toggle menu">
            <svg [lucideIcon]="menuOpen() ? 'x' : 'menu'" size="20"></svg>
          </button>
          
          <!-- Logo & Brand -->
          <div class="logo-group" (click)="navigateToHome()">
            <div class="logo-box">SW</div>
            <span class="brand-title">Smartwatch LB</span>
          </div>

          <!-- Desktop Navigation Link Group -->
          <nav class="desktop-nav desktop-only">
            @if (isAdmin()) {
              <a routerLink="/admin/tasks" routerLinkActive="active-pill" class="nav-link">Tasks</a>
              <a routerLink="/admin/challenges" routerLinkActive="active-pill" class="nav-link">Challenges</a>
              <a routerLink="/admin/devices" routerLinkActive="active-pill" class="nav-link">Devices</a>
              <a routerLink="/leaderboard" routerLinkActive="active-pill" class="nav-link">Leaderboard</a>
              <a routerLink="/admin/users" routerLinkActive="active-pill" class="nav-link">Users</a>
            } @else {
              <a routerLink="/dashboard" routerLinkActive="active-pill" class="nav-link">Dashboard</a>
              <a routerLink="/tasks" routerLinkActive="active-pill" class="nav-link">Tasks</a>
              <a routerLink="/challenges" routerLinkActive="active-pill" class="nav-link">Challenges</a>
              <a routerLink="/leaderboard" routerLinkActive="active-pill" class="nav-link">Leaderboard</a>
              <a routerLink="/activity" routerLinkActive="active-pill" class="nav-link">Activity</a>
            }
          </nav>
        </div>

        <div class="nav-right">
          <!-- Theme Toggle -->
          <button class="icon-btn" (click)="toggleTheme()" aria-label="Toggle theme">
            <svg [lucideIcon]="theme() === 'light' ? 'moon' : 'sun'" size="20"></svg>
          </button>

          <!-- Notifications Bell -->
          <button class="icon-btn relative" (click)="showNotifications()" aria-label="Notifications">
            <svg lucideIcon="bell" size="20"></svg>
            <span class="badge-dot"></span>
          </button>

          <!-- User Avatar Dropdown Toggle -->
          <div class="avatar-dropdown-wrapper">
            <button class="avatar-btn" (click)="toggleDropdown()">
              {{ userInitials() }}
            </button>

            <!-- Dropdown Menu -->
            @if (dropdownOpen()) {
              <div class="dropdown-menu">
                <div class="dropdown-header">
                  <div class="user-name">{{ userName() }}</div>
                  <div class="user-email">{{ userEmail() }}</div>
                </div>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" (click)="goToProfile()">
                  <svg lucideIcon="user" size="16"></svg>
                  My Profile
                </a>
                <a class="dropdown-item logout" (click)="logout()">
                  <svg lucideIcon="log-out" size="16"></svg>
                  Logout
                </a>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Mobile Sidebar / Drawer Overlay -->
      @if (menuOpen()) {
        <div class="sidebar-overlay" (click)="toggleSidebar()"></div>
      }

      <!-- Mobile Sidebar / Drawer -->
      <aside class="mobile-sidebar" [ngClass]="{'open': menuOpen()}">
        <div class="sidebar-header">
          <div class="logo-group">
            <div class="logo-box">SW</div>
            <span class="brand-title">Smartwatch LB</span>
          </div>
          <button class="icon-btn" (click)="toggleSidebar()">
            <svg lucideIcon="x" size="20"></svg>
          </button>
        </div>
        <div class="sidebar-user">
          <div class="avatar-large">{{ userInitials() }}</div>
          <div>
            <div class="font-bold">{{ userName() }}</div>
            <div class="text-xs text-secondary">{{ userEmail() }}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          @if (isAdmin()) {
            <a routerLink="/admin/tasks" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="clipboard-list" size="18"></svg>
              Tasks Management
            </a>
            <a routerLink="/admin/challenges" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="trophy" size="18"></svg>
              Challenges Management
            </a>
            <a routerLink="/admin/devices" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="watch" size="18"></svg>
              Devices Registry
            </a>
            <a routerLink="/leaderboard" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="trophy" size="18"></svg>
              Leaderboard
            </a>
            <a routerLink="/admin/users" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="users" size="18"></svg>
              Users Directory
            </a>
          } @else {
            <a routerLink="/dashboard" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="layout-dashboard" size="18"></svg>
              Dashboard
            </a>
            <a routerLink="/tasks" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="clipboard-list" size="18"></svg>
              My Tasks
            </a>
            <a routerLink="/challenges" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="trophy" size="18"></svg>
              Challenges
            </a>
            <a routerLink="/leaderboard" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="trophy" size="18"></svg>
              Leaderboard
            </a>
            <a routerLink="/activity" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
              <svg lucideIcon="clipboard-list" size="18"></svg>
              Log Activity
            </a>
          }
          <div class="dropdown-divider"></div>
          <a routerLink="/profile" routerLinkActive="active" class="sidebar-link" (click)="toggleSidebar()">
            <svg lucideIcon="user" size="18"></svg>
            My Profile
          </a>
          <a class="sidebar-link logout mt-auto" (click)="logout()">
            <svg lucideIcon="log-out" size="18"></svg>
            Logout
          </a>
        </nav>
      </aside>

      <!-- Main Content Outlet Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .shell-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--background);
      color: var(--text-primary);
    }

    /* Top Navbar styles */
    .top-navbar {
      height: 64px;
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

      @media (min-width: 768px) {
        padding: 0 24px;
      }
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 100%;
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .logo-box {
      width: 32px;
      height: 32px;
      background-color: var(--primary-600);
      color: white;
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--r-xl);
    }

    .brand-title {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.3px;
    }

    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 24px;
      height: 100%;
    }

    .nav-link {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: var(--r-xl);
      transition: all 0.2s;

      &:hover {
        color: var(--text-primary);
        background-color: var(--gray-100);
      }
    }

    .active-pill {
      background-color: var(--primary-600) !important;
      color: white !important;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--r-xl);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .badge-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background-color: var(--error-500);
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
    }

    /* Avatar and Dropdown */
    .avatar-dropdown-wrapper {
      position: relative;
    }

    .avatar-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--r-full);
      border: none;
      background-color: var(--primary-600);
      color: white;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .dropdown-menu {
      position: absolute;
      right: 0;
      top: 48px;
      width: 220px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      padding: 8px 0;
      z-index: 1010;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.15s ease;
    }

    .dropdown-header {
      padding: 12px 16px;
      .user-name {
        font-weight: 700;
        font-size: 14px;
      }
      .user-email {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border);
      margin: 8px 0;
    }

    .dropdown-item {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;

      &:hover {
        background-color: var(--gray-100);
      }

      &.logout {
        color: var(--error-500);
      }
    }

    /* Mobile Sidebar Drawer */
    .mobile-sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      bottom: 0;
      width: 280px;
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border);
      z-index: 1005;
      display: flex;
      flex-direction: column;
      transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.open {
        left: 0;
      }
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 1004;
      backdrop-filter: blur(2px);
    }

    .sidebar-header {
      height: 64px;
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-user {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border);

      .avatar-large {
        width: 44px;
        height: 44px;
        border-radius: var(--r-full);
        background-color: var(--primary-600);
        color: white;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-link {
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      border-radius: var(--r-xl);
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }

      &.active {
        background-color: var(--primary-100);
        color: var(--primary-600);
      }

      &.logout {
        color: var(--error-500);
        margin-top: auto;
      }
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      padding: 24px 16px;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;

      @media (min-width: 768px) {
        padding: 32px 24px;
      }
    }

    /* Helper utilities */
    .mobile-only {
      @media (min-width: 768px) {
        display: none !important;
      }
    }

    .desktop-only {
      @media (max-width: 767px) {
        display: none !important;
      }
    }

    .relative {
      position: relative;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-xs {
      font-size: 12px;
    }

    .text-secondary {
      color: var(--text-secondary);
    }

    .mt-auto {
      margin-top: auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  theme = signal<'light' | 'dark'>('light');
  menuOpen = signal<boolean>(false);
  dropdownOpen = signal<boolean>(false);

  userName = () => this.authService.currentUser()?.name || 'User';
  userEmail = () => this.authService.currentUser()?.email || '';
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';

  userInitials() {
    const name = this.userName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  toggleTheme() {
    this.theme.update(current => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }

  toggleSidebar() {
    this.menuOpen.update(v => !v);
  }

  toggleDropdown() {
    this.dropdownOpen.update(v => !v);
  }

  navigateToHome() {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/tasks']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToProfile() {
    this.dropdownOpen.set(false);
    this.router.navigate(['/profile']);
  }

  showNotifications() {
    alert('Notifications panel simulated. No new updates.');
  }

  logout() {
    this.dropdownOpen.set(false);
    this.authService.logout();
  }
}
