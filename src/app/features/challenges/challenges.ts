import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { challengesActions, challengesFeature } from '../../store/challenges.store';
import { tasksActions, tasksFeature } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { LucideDynamicIcon } from '@lucide/angular';
import { Challenge } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  template: `
    <div class="challenges-container">
      
      <!-- ADMIN VIEW -->
      @if (isAdmin()) {
        @if (isFormOpen()) {
          <!-- Create / Edit Form -->
          <div class="form-card card">
            <div class="form-breadcrumbs">
              <span class="crumb-link" (click)="closeForm()">Challenges</span>
              <span class="crumb-separator">/</span>
              <span class="crumb-active">{{ editingChallengeId() ? 'Edit Challenge' : 'Create Challenge' }}</span>
            </div>

            <h2 class="form-title mt-xs">
              {{ editingChallengeId() ? 'Edit Challenge: ' + editingChallengeName() : 'Create New Challenge' }}
            </h2>

            <form [formGroup]="challengeForm" (ngSubmit)="onFormSubmit()" class="mt-lg">
              <div class="grid-form">
                <div class="form-field">
                  <label class="required" for="name">Challenge Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    formControlName="name" 
                    placeholder="e.g. Morning Sprint Challenge"
                  />
                  @if (showErrors() && challengeForm.get('name')?.hasError('required')) {
                    <div class="error-text">Challenge name is required</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="taskId">Linked Task</label>
                  <select id="taskId" formControlName="taskId">
                    <option value="">Select a task...</option>
                    @for (task of activeTasks(); track task.id) {
                      <option [value]="task.id">{{ task.name }} (ID: {{ task.id }})</option>
                    }
                  </select>
                  @if (showErrors() && challengeForm.get('taskId')?.hasError('required')) {
                    <div class="error-text">Please link a task</div>
                  }
                </div>

                <!-- Custom Scope selector visually matching Figma radio layout -->
                <div class="form-field full-width">
                  <label class="required">Scope</label>
                  <div class="scope-radio-group">
                    <label class="scope-radio-btn" [ngClass]="{'selected': scopeVal() === 'GLOBAL'}">
                      <input type="radio" value="GLOBAL" formControlName="scope" (change)="onScopeChange('GLOBAL')" />
                      <span class="scope-label global">GLOBAL</span>
                    </label>

                    <label class="scope-radio-btn" [ngClass]="{'selected': scopeVal() === 'REGIONAL'}">
                      <input type="radio" value="REGIONAL" formControlName="scope" (change)="onScopeChange('REGIONAL')" />
                      <span class="scope-label regional">REGIONAL</span>
                    </label>

                    <label class="scope-radio-btn" [ngClass]="{'selected': scopeVal() === 'FRIENDLY'}">
                      <input type="radio" value="FRIENDLY" formControlName="scope" (change)="onScopeChange('FRIENDLY')" />
                      <span class="scope-label friendly">FRIENDLY</span>
                    </label>
                  </div>
                </div>

                <div class="form-field">
                  <label [ngClass]="{'required': scopeVal() === 'REGIONAL'}" for="region">Region</label>
                  <input 
                    type="text" 
                    id="region" 
                    formControlName="region" 
                    placeholder="e.g. APAC, EMEA, AMER"
                  />
                  @if (showErrors() && scopeVal() === 'REGIONAL' && challengeForm.get('region')?.hasError('required')) {
                    <div class="error-text">Region is required for REGIONAL scope</div>
                  }
                </div>

                <div class="form-field">
                  <label>Status</label>
                  <select formControlName="status">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div class="form-field full-width">
                  <label for="description">Description</label>
                  <textarea 
                    id="description" 
                    formControlName="description" 
                    rows="3" 
                    placeholder="Brief description of the challenge..."
                  ></textarea>
                </div>

                <div class="form-field">
                  <label class="required" for="startAt">Start Date & Time</label>
                  <div class="date-input-wrapper">
                    <input 
                      type="datetime-local" 
                      id="startAt" 
                      formControlName="startAt"
                    />
                  </div>
                  @if (showErrors() && challengeForm.get('startAt')?.hasError('required')) {
                    <div class="error-text">Start date is required</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="endAt">End Date & Time</label>
                  <div class="date-input-wrapper">
                    <input 
                      type="datetime-local" 
                      id="endAt" 
                      formControlName="endAt"
                    />
                  </div>
                  @if (showErrors() && challengeForm.get('endAt')?.hasError('required')) {
                    <div class="error-text">End date is required</div>
                  }
                </div>
              </div>

              <!-- Warning helpful tip block -->
              <div class="helper-note-card mt-md">
                <svg lucideIcon="alert-triangle" size="16" class="note-icon"></svg>
                <p class="note-text">
                  <strong>Note:</strong> End Date must be after Start Date. Scope REGIONAL requires a Region value. 
                  Task must have status Active. Only tasks compatible with at least one registered device will appear in the dropdown.
                </p>
              </div>

              <!-- Form Actions Footer -->
              <div class="form-actions mt-xl">
                @if (editingChallengeId()) {
                  <button type="button" class="btn btn-danger btn-secondary delete-btn-left" (click)="onDelete(editingChallengeId()!)">
                    <svg lucideIcon="trash-2" size="14"></svg>
                    Delete Challenge
                  </button>
                }
                
                <div class="right-actions ml-auto">
                  <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
                  <button type="submit" class="btn btn-primary">
                    {{ editingChallengeId() ? 'Save Changes' : 'Create Challenge' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        } @else {
          <!-- Admin List View -->
          <div class="admin-header-row flex-between mb-lg">
            <div>
              <h1>Challenges</h1>
              <p class="subtitle text-secondary">Create and manage fitness challenges for participants</p>
            </div>
            <button class="btn btn-primary" (click)="openCreateForm()">
              <svg lucideIcon="plus" size="16"></svg>
              Create Challenge
            </button>
          </div>

          <!-- Search + Filter Bar -->
          <div class="search-filter-molecule card mb-lg">
            <div class="search-wrapper">
              <svg lucideIcon="search" class="search-icon" size="18"></svg>
              <input 
                type="text" 
                placeholder="Search challenges..." 
                [value]="searchText()"
                (input)="onSearchInput($event)"
              />
            </div>
            
            <div class="filter-btn-group">
              <button 
                class="filter-tab" 
                [ngClass]="{'active': statusFilter() === 'all'}"
                (click)="setStatusFilter('all')"
              >All</button>
              <button 
                class="filter-tab" 
                [ngClass]="{'active': statusFilter() === 'active'}"
                (click)="setStatusFilter('active')"
              >Active</button>
              <button 
                class="filter-tab" 
                [ngClass]="{'active': statusFilter() === 'closed'}"
                (click)="setStatusFilter('closed')"
              >Closed</button>
            </div>

            <!-- Scope filter badges -->
            <div class="scope-filters flex-gap-sm ml-md">
              <button 
                class="scope-filter-pill global" 
                [ngClass]="{'active': scopeFilter() === 'GLOBAL'}"
                (click)="toggleScopeFilter('GLOBAL')"
              >GLOBAL</button>
              <button 
                class="scope-filter-pill regional" 
                [ngClass]="{'active': scopeFilter() === 'REGIONAL'}"
                (click)="toggleScopeFilter('REGIONAL')"
              >REGIONAL</button>
              <button 
                class="scope-filter-pill friendly" 
                [ngClass]="{'active': scopeFilter() === 'FRIENDLY'}"
                (click)="toggleScopeFilter('FRIENDLY')"
              >FRIENDLY</button>
            </div>

            <div class="results-count ml-auto">
              {{ filteredChallenges().length }} challenges
            </div>
          </div>

          <!-- Challenges Data Table -->
          <div class="card table-card overflow-x">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Task</th>
                  <th>Region</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (challenge of paginatedChallenges(); track challenge.id) {
                  <tr>
                    <td class="id-col">{{ challenge.id }}</td>
                    <td class="font-bold">{{ challenge.name }}</td>
                    <td class="desc-col">{{ challenge.description }}</td>
                    <td>
                      <span class="scope-badge" [ngClass]="challenge.scope | lowercase">{{ challenge.scope }}</span>
                    </td>
                    <td>
                      <span class="chip" [ngClass]="challenge.status === 'ACTIVE' ? 'active' : 'closed'">
                        {{ challenge.status }}
                      </span>
                    </td>
                    <td>#{{ challenge.taskId }}</td>
                    <td>{{ challenge.region || '&mdash;' }}</td>
                    <td>{{ challenge.endAt | date:'dd MMM yyyy' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="action-icon-btn edit" (click)="openEditForm(challenge)" aria-label="Edit challenge">
                          <svg lucideIcon="edit-2" size="14"></svg>
                        </button>
                        <button class="action-icon-btn delete" (click)="onDelete(challenge.id)" aria-label="Delete challenge">
                          <svg lucideIcon="trash-2" size="14"></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="text-center py-xl">
                      <div class="empty-state">
                        <svg lucideIcon="alert-triangle" size="32" class="text-secondary"></svg>
                        <p class="mt-sm font-bold">No challenges found matching criteria</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination numbers -->
          @if (filteredChallenges().length > 0) {
            <div class="pagination-footer mt-md">
              <span class="page-info">
                Showing {{ (currentPage() - 1) * pageSize() + 1 }} - 
                {{ Math.min(currentPage() * pageSize(), filteredChallenges().length) }} 
                of {{ filteredChallenges().length }} challenges
              </span>
              
              <div class="pagination-controls ml-auto">
                <div class="pages-list flex-gap-sm">
                  @for (p of pagesArray(); track p) {
                    <button 
                      class="page-num-btn" 
                      [ngClass]="{'active': p === currentPage()}"
                      (click)="setCurrentPage(p)"
                    >
                      {{ p }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        }
      } @else {
        <!-- USER VIEW -->
        <div class="user-header">
          <h1>Challenges</h1>
          <p class="subtitle text-secondary">Join challenges and push your limits with the community</p>
        </div>

        <!-- Blue Stat ribbon -->
        <div class="user-stats-ribbon mt-md mb-lg">
          <div class="stat-capsule">
            <span class="num">3</span>
            <span class="lbl">Active Challenges</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">{{ userJoinedCount() }}</span>
            <span class="lbl">Joined</span>
          </div>
        </div>

        <!-- Search + Filter Bar -->
        <div class="search-filter-molecule card mb-lg">
          <div class="search-wrapper">
            <svg lucideIcon="search" class="search-icon" size="18"></svg>
            <input 
              type="text" 
              placeholder="Search challenges..." 
              [value]="searchText()"
              (input)="onSearchInput($event)"
            />
          </div>
          
          <div class="filter-btn-group">
            <button 
              class="filter-tab" 
              [ngClass]="{'active': statusFilter() === 'all'}"
              (click)="setStatusFilter('all')"
            >All</button>
            <button 
              class="filter-tab" 
              [ngClass]="{'active': statusFilter() === 'active'}"
              (click)="setStatusFilter('active')"
            >Active</button>
            <button 
              class="filter-tab" 
              [ngClass]="{'active': statusFilter() === 'joined'}"
              (click)="setStatusFilter('joined')"
            >Joined</button>
          </div>
        </div>

        <!-- User Cards Grid layout -->
        <div class="challenges-grid">
          @for (c of userFilteredChallenges(); track c.id) {
            <div class="challenge-card card scope-accent-top" [ngClass]="c.scope | lowercase">
              <div class="challenge-card-header">
                <h3>{{ c.name }}</h3>
                <span class="chip" [ngClass]="c.status === 'ACTIVE' ? 'active' : 'closed'">
                  {{ c.status }}
                </span>
              </div>
              
              <div class="challenge-tags mt-xs">
                <span class="scope-badge" [ngClass]="c.scope | lowercase">{{ c.scope }}</span>
                @if (c.region) {
                  <span class="region-lbl">{{ c.region }}</span>
                }
              </div>

              <p class="challenge-description-text mt-md">{{ c.description }}</p>
              
              <div class="challenge-meta-row mt-lg flex-between">
                <span class="ends-date">Ends {{ c.endAt | date:'dd MMM yyyy' }}</span>
                @if (isJoined(c)) {
                  <span class="joined-rank-label">Rank #{{ c.id === 1 ? '2' : '3' }}</span>
                }
              </div>

              <!-- Footer CTA section -->
              <div class="card-footer-cta mt-md flex-between">
                <!-- Expiry chip -->
                <span class="expiry-countdown-chip" [ngClass]="{'active': c.status === 'ACTIVE', 'closed': c.status === 'CLOSED'}">
                  {{ getChallengeExpiryText(c) }}
                </span>

                <!-- Action button -->
                @if (c.status === 'CLOSED') {
                  <button class="btn btn-secondary" disabled>Closed</button>
                } @else if (isJoined(c)) {
                  <button class="btn btn-secondary" disabled>Joined</button>
                } @else {
                  <button class="btn btn-primary" (click)="onJoinChallenge(c)">Join</button>
                }
              </div>
            </div>
          } @empty {
            <div class="card w-full text-center py-xl col-span-3">
              <svg lucideIcon="alert-triangle" size="48" class="text-secondary"></svg>
              <p class="mt-md font-bold text-secondary">No challenges found matching criteria</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .challenges-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Search Filter Bar */
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

    .scope-filters {
      display: flex;
      gap: 8px;
    }

    .scope-filter-pill {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      border: 1.5px solid var(--border);
      background-color: var(--bg-surface);
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;

      &.global { color: var(--primary-600); &.active { background-color: var(--primary-600); color: white; border-color: var(--primary-600); } }
      &.regional { color: var(--error-600); &.active { background-color: var(--error-600); color: white; border-color: var(--error-600); } }
      &.friendly { color: #4f46e5; &.active { background-color: #4f46e5; color: white; border-color: #4f46e5; } }

      &:hover {
        border-color: var(--gray-400);
      }
    }

    .results-count {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 600;
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
        padding: 16px 20px;
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

      .desc-col {
        color: var(--text-secondary);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
          &.edit { background-color: var(--primary-600); border-color: var(--primary-600); }
          &.delete { background-color: var(--error-500); border-color: var(--error-500); }
        }
      }
    }

    .scope-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-block;

      &.friendly { background-color: rgba(99, 102, 241, 0.15); color: #4f46e5; }
      &.regional { background-color: rgba(220, 38, 38, 0.1); color: var(--error-600); }
      &.global { background-color: rgba(37, 99, 235, 0.15); color: var(--primary-600); }
    }

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .page-num-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background-color: var(--gray-100);
      }

      &.active {
        background-color: var(--primary-600);
        color: white;
        border-color: var(--primary-600);
      }
    }

    /* Form Styles */
    .form-card {
      .form-breadcrumbs {
        display: flex;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        
        .crumb-link {
          color: var(--primary-600);
          cursor: pointer;
          &:hover { text-decoration: underline; }
        }
        .crumb-separator { color: var(--gray-400); }
        .crumb-active { color: var(--text-secondary); }
      }

      .form-title {
        font-size: 24px;
        margin: 8px 0 0 0;
      }
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px 20px;

      @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
        .full-width {
          grid-column: span 2;
        }
      }
    }

    /* Scope custom radio buttons selector */
    .scope-radio-group {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }

    .scope-radio-btn {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      padding: 10px 20px;
      cursor: pointer;
      background-color: var(--bg-surface);
      transition: all 0.2s;
      flex: 1;
      justify-content: center;

      input {
        display: none;
      }

      .scope-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      &.selected {
        &.global { border-color: var(--primary-600); background-color: rgba(37,99,235,0.05); .global { color: var(--primary-600); } }
        &.regional { border-color: var(--error-600); background-color: rgba(220,38,38,0.05); .regional { color: var(--error-600); } }
        &.friendly { border-color: #4f46e5; background-color: rgba(99,102,241,0.05); .friendly { color: #4f46e5; } }
      }

      /* Hover effects */
      &:hover:not(.selected) {
        border-color: var(--gray-400);
      }
    }

    .date-input-wrapper {
      width: 100%;
      input {
        width: 100%;
      }
    }

    .helper-note-card {
      background-color: rgba(37, 99, 235, 0.05);
      border: 1px solid rgba(37, 99, 235, 0.15);
      border-radius: var(--r-xl);
      padding: 14px 18px;
      display: flex;
      gap: 12px;
      align-items: flex-start;

      .note-icon {
        color: var(--primary-600);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .note-text {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.45;
      }
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      border-top: 1px solid var(--border);
      padding-top: 24px;

      .right-actions {
        display: flex;
        gap: 12px;
      }
    }

    /* USER VIEW STYLES */
    .user-stats-ribbon {
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: white;
      padding: 16px 24px;
      border-radius: var(--r-xl);
      display: flex;
      align-items: center;
      width: fit-content;
      gap: 16px;
      box-shadow: 0 4px 6px rgba(37,99,235,0.1);
    }

    .stat-capsule {
      display: flex;
      align-items: center;
      gap: 8px;

      .num {
        font-size: 20px;
        font-weight: 800;
      }
      .lbl {
        font-size: 12px;
        color: var(--primary-100);
        font-weight: 600;
      }
    }

    .stat-divider {
      width: 1px;
      height: 18px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    .challenges-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .challenge-card {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.scope-accent-top::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
      }
      
      &.global::before { background-color: var(--primary-600); }
      &.regional::before { background-color: var(--error-600); }
      &.friendly::before { background-color: #4f46e5; }
    }

    .challenge-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;

      h3 {
        font-size: 17px;
        font-weight: 700;
        margin: 0;
      }
    }

    .challenge-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;

      .region-lbl {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-secondary);
      }
    }

    .challenge-description-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
      flex: 1;
    }

    .challenge-meta-row {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);

      .joined-rank-label {
        color: var(--warning-500);
        background-color: rgba(245,158,11,0.1);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    .card-footer-cta {
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }

    .expiry-countdown-chip {
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: var(--r-xl);
      
      &.active {
        background-color: rgba(16,185,129,0.1);
        color: var(--success-600);
      }
      &.closed {
        background-color: var(--gray-100);
        color: var(--gray-600);
      }
    }

    /* Helper utilities */
    .ml-auto { margin-left: auto; }
    .ml-md { margin-left: 16px; }
    .py-xl { padding-top: 48px; padding-bottom: 48px; }
    .col-span-3 { grid-column: span 3; }
    .text-center { text-align: center; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .mt-xs { margin-top: 4px; }
    .mt-md { margin-top: 12px; }
    .mt-lg { margin-top: 16px; }
    .mt-xl { margin-top: 24px; }
    .w-full { width: 100%; }
  `]
})
export class ChallengesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  Math = Math;

  // Signals
  isFormOpen = signal<boolean>(false);
  editingChallengeId = signal<number | null>(null);
  editingChallengeName = signal<string>('');
  showErrors = signal<boolean>(false);
  searchText = signal<string>('');
  statusFilter = signal<string>('all');
  scopeFilter = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Available tags
  sensorTags = ['GPS', 'HRM', 'STEPS', 'SPO2', 'SLEEP', 'ECG', 'HRV', 'STRESS'];

  // Form group
  challengeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    taskId: ['', Validators.required],
    scope: ['GLOBAL', Validators.required],
    region: [''],
    status: ['ACTIVE', Validators.required],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required]
  });

  // Store selectors
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';
  userId = () => this.authService.currentUser()?.id || 1;
  allChallenges = this.store.selectSignal(challengesFeature.selectChallenges);
  allTasks = this.store.selectSignal(tasksFeature.selectTasks);
  
  // Select active tasks for form links dropdown
  activeTasks = computed(() => this.allTasks().filter(t => t.status === 'Active'));

  scopeVal = () => this.challengeForm.get('scope')?.value || 'GLOBAL';

  // Statistics for user view
  userJoinedCount = computed(() => {
    const uid = this.userId();
    return this.allChallenges().filter(c => c.participants.includes(uid)).length;
  });

  // Filter Logic (Admin)
  filteredChallenges = computed(() => {
    let result = this.allChallenges();
    
    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.description.toLowerCase().includes(search)
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status !== 'all') {
      const activeVal = status === 'active' ? 'ACTIVE' : 'CLOSED';
      result = result.filter(c => c.status === activeVal);
    }

    // Scope filter
    const scope = this.scopeFilter();
    if (scope) {
      result = result.filter(c => c.scope === scope);
    }

    return result;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredChallenges().length / this.pageSize()) || 1;
  });

  pagesArray = computed(() => {
    const arr = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      arr.push(i);
    }
    return arr;
  });

  paginatedChallenges = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredChallenges().slice(start, end);
  });

  // Filter Logic (User)
  userFilteredChallenges = computed(() => {
    let result = this.allChallenges();

    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.description.toLowerCase().includes(search)
      );
    }

    // Filters: all, active (status ACTIVE), joined (user joined)
    const filter = this.statusFilter();
    if (filter === 'active') {
      result = result.filter(c => c.status === 'ACTIVE');
    } else if (filter === 'joined') {
      result = result.filter(c => c.participants.includes(this.userId()));
    }

    return result;
  });

  ngOnInit() {
    this.store.dispatch(challengesActions.loadChallenges());
    this.store.dispatch(tasksActions.loadTasks());
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText.set(val);
    this.currentPage.set(1);
  }

  setStatusFilter(val: string) {
    this.statusFilter.set(val);
    this.currentPage.set(1);
  }

  toggleScopeFilter(scope: string) {
    this.scopeFilter.update(current => current === scope ? '' : scope);
    this.currentPage.set(1);
  }

  setCurrentPage(page: number) {
    this.currentPage.set(page);
  }

  onScopeChange(scope: string) {
    const regionControl = this.challengeForm.get('region');
    if (scope === 'REGIONAL') {
      regionControl?.setValidators(Validators.required);
    } else {
      regionControl?.clearValidators();
      regionControl?.setValue('');
    }
    regionControl?.updateValueAndValidity();
  }

  isTagSelected(tag: string): boolean {
    return false; // Not used on this form (Scope is checked instead)
  }

  // Joined check
  isJoined(challenge: Challenge): boolean {
    return challenge.participants.includes(this.userId());
  }

  onJoinChallenge(challenge: Challenge) {
    this.store.dispatch(challengesActions.joinChallenge({
      id: challenge.id,
      userId: this.userId(),
      currentParticipants: challenge.participants
    }));
  }

  // Form toggles
  openCreateForm() {
    this.editingChallengeId.set(null);
    this.challengeForm.reset({
      name: '',
      description: '',
      taskId: '',
      scope: 'GLOBAL',
      region: '',
      status: 'ACTIVE',
      startAt: new Date().toISOString().substring(0, 16),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
    });
    this.onScopeChange('GLOBAL');
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  openEditForm(challenge: Challenge) {
    this.editingChallengeId.set(challenge.id);
    this.editingChallengeName.set(challenge.name);
    
    // Format dates to fit input datetime-local format YYYY-MM-DDTHH:MM
    const startStr = new Date(challenge.startAt).toISOString().substring(0, 16);
    const endStr = new Date(challenge.endAt).toISOString().substring(0, 16);

    this.challengeForm.reset({
      name: challenge.name,
      description: challenge.description,
      taskId: challenge.taskId,
      scope: challenge.scope,
      region: challenge.region || '',
      status: challenge.status,
      startAt: startStr,
      endAt: endStr
    });
    this.onScopeChange(challenge.scope);
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingChallengeId.set(null);
    this.showErrors.set(false);
  }

  onFormSubmit() {
    if (this.challengeForm.invalid) {
      this.showErrors.set(true);
      return;
    }

    const val = this.challengeForm.value;
    
    // Start date and end date validation
    const start = new Date(val.startAt).getTime();
    const end = new Date(val.endAt).getTime();
    if (end <= start) {
      alert('End Date must be after Start Date');
      return;
    }

    const payload = {
      name: val.name,
      description: val.description || '',
      taskId: Number(val.taskId),
      scope: val.scope as 'GLOBAL' | 'REGIONAL' | 'FRIENDLY',
      region: val.region || '',
      status: val.status as 'ACTIVE' | 'CLOSED',
      startAt: new Date(val.startAt).toISOString(),
      endAt: new Date(val.endAt).toISOString(),
      requiredTags: ['STEPS'] // default
    };

    if (this.editingChallengeId()) {
      this.store.dispatch(challengesActions.updateChallenge({
        id: this.editingChallengeId()!,
        changes: payload
      }));
    } else {
      this.store.dispatch(challengesActions.createChallenge(payload));
    }

    this.closeForm();
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this challenge?')) {
      this.store.dispatch(challengesActions.deleteChallenge({ id }));
      this.closeForm();
    }
  }

  getChallengeExpiryText(challenge: Challenge): string {
    if (challenge.status === 'CLOSED') return 'Closed';
    const expiry: { [key: number]: string } = {
      1: 'Expires in 11d',
      3: 'Expires in 19d',
      4: 'Expires in 24d'
    };
    return expiry[challenge.id] || 'Expires soon';
  }
}
