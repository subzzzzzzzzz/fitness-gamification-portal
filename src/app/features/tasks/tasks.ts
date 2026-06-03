import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { tasksActions, tasksFeature } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { LucideDynamicIcon } from '@lucide/angular';
import { Task } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  template: `
    <div class="tasks-container">
      
      <!-- Top Success Toast Simulation if state shows success -->
      <!-- We have global toasts, so we rely on them! -->

      <!-- ADMIN VIEW -->
      @if (isAdmin()) {
        @if (isFormOpen()) {
          <!-- Create / Edit Form -->
          <div class="form-card card">
            <div class="form-breadcrumbs">
              <span class="crumb-link" (click)="closeForm()">Tasks</span>
              <span class="crumb-separator">/</span>
              <span class="crumb-active">{{ editingTaskId() ? 'Edit Task' : 'Create Task' }}</span>
            </div>

            <h2 class="form-title mt-xs">
              {{ editingTaskId() ? 'Edit Task: ' + editingTaskName() : 'Create New Task' }}
            </h2>

            <form [formGroup]="taskForm" (ngSubmit)="onFormSubmit()" class="mt-lg">
              <div class="grid-form">
                <div class="form-field">
                  <label class="required" for="name">Task Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    formControlName="name" 
                    placeholder="e.g. Morning Journey"
                  />
                  @if (showErrors() && taskForm.get('name')?.hasError('required')) {
                    <div class="error-text">Task name is required</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="points">Points</label>
                  <input 
                    type="number" 
                    id="points" 
                    formControlName="points" 
                    placeholder="e.g. 50"
                  />
                  @if (showErrors() && taskForm.get('points')?.hasError('required')) {
                    <div class="error-text">Points are required</div>
                  }
                </div>

                <div class="form-field">
                  <label class="required" for="steps">Target Steps</label>
                  <div class="numeric-stepper">
                    <button type="button" class="stepper-btn" (click)="stepSteps(-50)">&minus;</button>
                    <input 
                      type="number" 
                      id="steps" 
                      formControlName="steps" 
                      placeholder="Minimum 1"
                    />
                    <button type="button" class="stepper-btn" (click)="stepSteps(50)">+</button>
                  </div>
                  @if (showErrors() && taskForm.get('steps')?.hasError('required')) {
                    <div class="error-text">Target steps is required</div>
                  }
                  @if (showErrors() && taskForm.get('steps')?.hasError('min')) {
                    <div class="error-text">Steps must be greater than 0</div>
                  }
                </div>

                <div class="form-field">
                  <label>Task Status</label>
                  <div class="toggle-switch-wrapper">
                    <label class="switch">
                      <input type="checkbox" formControlName="isActive" />
                      <span class="slider round"></span>
                    </label>
                    <span class="toggle-status-label" [ngClass]="{'active': taskForm.get('isActive')?.value}">
                      {{ taskForm.get('isActive')?.value ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <div class="form-field full-width">
                  <label for="description">Description</label>
                  <textarea 
                    id="description" 
                    formControlName="description" 
                    rows="3" 
                    placeholder="Describe what users need to complete..."
                  ></textarea>
                </div>
              </div>

              <!-- Required Sensor Tags -->
              <div class="tags-picker-section mt-md">
                <label class="required-label">Required Sensor Tags *</label>
                <div class="sensor-tags-grid mt-sm">
                  @for (tag of sensorTags; track tag) {
                    <button 
                      type="button" 
                      class="sensor-tag-btn" 
                      [ngClass]="{'selected': isTagSelected(tag)}"
                      (click)="toggleTag(tag)"
                    >
                      {{ tag }}
                    </button>
                  }
                </div>
                @if (showErrors() && selectedTags().length === 0) {
                  <div class="error-text">Select at least one sensor tag</div>
                }
              </div>

              <!-- Form Actions Footer -->
              <div class="form-actions mt-xl">
                @if (editingTaskId()) {
                  <button type="button" class="btn btn-danger btn-secondary delete-btn-left" (click)="onDelete(editingTaskId()!)">
                    <svg lucideIcon="trash-2" size="14"></svg>
                    Delete Task
                  </button>
                }
                
                <div class="right-actions ml-auto">
                  <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
                  <button type="submit" class="btn btn-primary">
                    {{ editingTaskId() ? 'Save Changes' : 'Create Task' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        } @else {
          <!-- Admin List View -->
          <div class="admin-header-row flex-between mb-lg">
            <div>
              <h1>Tasks</h1>
              <p class="subtitle text-secondary">Manage training tasks and assign to users</p>
            </div>
            <button class="btn btn-primary" (click)="openCreateForm()">
              <svg lucideIcon="plus" size="16"></svg>
              Create Task
            </button>
          </div>

          <!-- Search + Filter bar molecule -->
          <div class="search-filter-molecule card mb-lg">
            <div class="search-wrapper">
              <svg lucideIcon="search" class="search-icon" size="18"></svg>
              <input 
                type="text" 
                placeholder="Search tasks..." 
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
                [ngClass]="{'active': statusFilter() === 'inactive'}"
                (click)="setStatusFilter('inactive')"
              >Inactive</button>
            </div>

            <div class="tag-filter-dropdown">
              <select (change)="onTagFilterChange($event)">
                <option value="">Filter by Tags</option>
                @for (tag of sensorTags; track tag) {
                  <option [value]="tag">{{ tag }}</option>
                }
              </select>
            </div>

            <div class="results-count ml-auto">
              {{ filteredTasks().length }} results
            </div>
          </div>

          <!-- Data Table -->
          <div class="card table-card overflow-x">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task Name</th>
                  <th>Description</th>
                  <th>Required Tags</th>
                  <th>Steps</th>
                  <th>Points</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (task of paginatedTasks(); track task.id) {
                  <tr>
                    <td class="id-col">{{ task.id }}</td>
                    <td class="font-bold">{{ task.name }}</td>
                    <td class="desc-col">{{ task.description }}</td>
                    <td>
                      <div class="tags-row">
                        @for (tag of task.requiredTags; track tag) {
                          <span class="tag-badge">{{ tag }}</span>
                        }
                      </div>
                    </td>
                    <td>{{ task.steps | number }}</td>
                    <td class="points-col">{{ task.points }}</td>
                    <td>
                      <span class="chip" [ngClass]="task.status === 'Active' ? 'active' : 'closed'">
                        {{ task.status }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="action-icon-btn edit" (click)="openEditForm(task)" aria-label="Edit task">
                          <svg lucideIcon="edit-2" size="14"></svg>
                        </button>
                        <button class="action-icon-btn delete" (click)="onDelete(task.id)" aria-label="Delete task">
                          <svg lucideIcon="trash-2" size="14"></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center py-xl">
                      <div class="empty-state">
                        <svg lucideIcon="alert-triangle" size="32" class="text-secondary"></svg>
                        <p class="mt-sm font-bold">No tasks found matching criteria</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          @if (filteredTasks().length > 0) {
            <div class="pagination-footer mt-md">
              <span class="page-info">
                Showing {{ (currentPage() - 1) * pageSize() + 1 }} - 
                {{ Math.min(currentPage() * pageSize(), filteredTasks().length) }} 
                of {{ filteredTasks().length }} tasks
              </span>
              
              <div class="pagination-controls ml-auto">
                <span class="rows-label">Rows per page:</span>
                <select class="rows-select" [value]="pageSize()" (change)="onPageSizeChange($event)">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>

                <div class="pages-list flex-gap-sm ml-md">
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
          <h1>My Tasks</h1>
          <p class="subtitle text-secondary">Track your progress and earn points</p>
        </div>

        <!-- Blue Stat capsule ribbon -->
        <div class="user-stats-ribbon mt-md mb-lg">
          <div class="stat-capsule">
            <span class="num">4</span>
            <span class="lbl">Active Tasks</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">2</span>
            <span class="lbl">Completed</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-capsule">
            <span class="num">350</span>
            <span class="lbl">Total Points Earned</span>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="search-filter-molecule card mb-lg">
          <div class="search-wrapper">
            <svg lucideIcon="search" class="search-icon" size="18"></svg>
            <input 
              type="text" 
              placeholder="Search tasks..." 
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
              [ngClass]="{'active': statusFilter() === 'completed'}"
              (click)="setStatusFilter('completed')"
            >Completed</button>
          </div>
        </div>

        <!-- User Cards Grid layout -->
        <div class="tasks-grid">
          @for (task of userFilteredTasks(); track task.id) {
            <div class="task-card card blue-accent-top">
              <div class="task-card-header">
                <h3>{{ task.name }}</h3>
                <span class="chip" [ngClass]="task.status === 'Active' ? 'active' : 'closed'">
                  {{ task.status }}
                </span>
              </div>
              <div class="task-tags-row mt-xs">
                @for (tag of task.requiredTags; track tag) {
                  <span class="tag-badge">{{ tag }}</span>
                }
              </div>
              
              <!-- Progress segment -->
              <div class="task-progress-box mt-lg">
                <div class="progress-nums flex-between">
                  <span class="steps-progress">{{ getUserProgressSteps(task.id, task.steps) }} steps</span>
                  <span class="points-val font-bold">{{ task.points }} pts</span>
                </div>
                
                <div class="progress-bar-track mt-xs">
                  <div class="progress-bar-fill" [style.width.%]="getUserProgressPercent(task.id)"></div>
                </div>
                
                <div class="progress-percent-text mt-xs flex-between">
                  <span>{{ getUserProgressPercent(task.id) }}% complete</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="card w-full text-center py-xl col-span-3">
              <svg lucideIcon="alert-triangle" size="48" class="text-secondary"></svg>
              <p class="mt-md font-bold text-secondary">No tasks found matching criteria</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tasks-container {
      display: flex;
      flex-direction: column;
    }

    .subtitle {
      margin-top: 4px;
      margin-bottom: 0;
    }

    /* Search Filter bar */
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
      max-width: 320px;
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

    .tag-filter-dropdown select {
      padding: 8px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      background-color: var(--bg-input);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }

    .results-count {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Data Table styles */
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
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .points-col {
        font-weight: 700;
        color: var(--primary-600);
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

    /* Pagination Footer */
    .pagination-footer {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 600;

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
      }
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rows-select {
      padding: 4px 8px;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      background-color: var(--bg-input);
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
      cursor: pointer;
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

    /* Form Card Styles */
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

    .numeric-stepper {
      display: flex;
      border: 1.5px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      background-color: var(--bg-input);
      width: 100%;

      input {
        flex: 1;
        border: none !important;
        border-radius: 0 !important;
        text-align: center;
        &:focus {
          box-shadow: none !important;
        }
      }

      .stepper-btn {
        width: 44px;
        border: none;
        background-color: var(--gray-50);
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        &:hover {
          background-color: var(--gray-200);
        }
      }
    }

    /* Toggle Switch */
    .toggle-switch-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 44px;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;

      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
    }

    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: var(--gray-200);
      transition: .3s;
      border-radius: 34px;

      &::before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    input:checked + .slider {
      background-color: var(--success-500);
    }

    input:checked + .slider::before {
      transform: translateX(24px);
    }

    .toggle-status-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      
      &.active {
        color: var(--success-600);
      }
    }

    /* Tags Picker Section */
    .tags-picker-section {
      .required-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .sensor-tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sensor-tag-btn {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      border-radius: var(--r-xl);
      border: 1.5px solid var(--border);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;

      &:hover {
        border-color: var(--gray-400);
        color: var(--text-primary);
      }

      &.selected {
        background-color: var(--primary-600);
        color: white;
        border-color: var(--primary-600);
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

    .tasks-grid {
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

    .task-card {
      position: relative;
      overflow: hidden;

      &.blue-accent-top::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background-color: var(--primary-600);
      }
    }

    .task-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;

      h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
      }
    }

    .tag-badge {
      background-color: var(--primary-100);
      color: var(--primary-600);
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .task-progress-box {
      .steps-progress {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
      }
      .points-val {
        font-size: 13px;
        color: var(--primary-600);
      }
      .progress-bar-track {
        height: 6px;
        background-color: var(--gray-100);
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        background-color: var(--primary-600);
        border-radius: 3px;
      }
      .progress-percent-text {
        font-size: 11px;
        font-weight: 600;
        color: var(--primary-600);
      }
    }

    /* Helper Utilities */
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
  `]
})
export class TasksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  Math = Math;

  // Signals
  isFormOpen = signal<boolean>(false);
  editingTaskId = signal<number | null>(null);
  editingTaskName = signal<string>('');
  showErrors = signal<boolean>(false);
  selectedTags = signal<string[]>([]);
  searchText = signal<string>('');
  statusFilter = signal<string>('all');
  tagFilter = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // Available tags
  sensorTags = [
    'GPS', 'HRM', 'STEPS', 'SPO2', 'SLEEP', 'ECG', 'HRV', 'STRESS', 'TEMPERATURE', 'RESPIRATORY_RATE', 'FALL_DETECTION'
  ];

  // Forms
  taskForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    steps: [500, [Validators.required, Validators.min(1)]],
    points: [50, Validators.required],
    isActive: [true]
  });

  // Store Selectors
  isAdmin = () => this.authService.currentUser()?.role === 'ROLE_ADMIN';
  userId = () => this.authService.currentUser()?.id || 1;
  allTasks = this.store.selectSignal(tasksFeature.selectTasks);
  loading = this.store.selectSignal(tasksFeature.selectLoading);

  // Filter Logic (Admin)
  filteredTasks = computed(() => {
    let result = this.allTasks();
    
    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(search) || 
        t.description.toLowerCase().includes(search)
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status !== 'all') {
      const activeVal = status === 'active' ? 'Active' : 'Inactive';
      result = result.filter(t => t.status === activeVal);
    }

    // Tag filter
    const tag = this.tagFilter();
    if (tag) {
      result = result.filter(t => t.requiredTags.includes(tag));
    }

    return result;
  });

  // Pagination Logic
  totalPages = computed(() => {
    return Math.ceil(this.filteredTasks().length / this.pageSize()) || 1;
  });

  pagesArray = computed(() => {
    const arr = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      arr.push(i);
    }
    return arr;
  });

  paginatedTasks = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredTasks().slice(start, end);
  });

  // User Filter Logic (User tasks list has active/completed filter)
  userFilteredTasks = computed(() => {
    let result = this.allTasks();

    // Text search
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(search) || 
        t.description.toLowerCase().includes(search)
      );
    }

    // User view filters: all, active, completed
    const filter = this.statusFilter();
    if (filter === 'active') {
      result = result.filter(t => t.status === 'Active' && this.getUserProgressPercent(t.id) < 100);
    } else if (filter === 'completed') {
      result = result.filter(t => this.getUserProgressPercent(t.id) >= 100);
    }

    return result;
  });

  ngOnInit() {
    this.store.dispatch(tasksActions.loadTasks());
  }

  // Search input handler
  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchText.set(val);
    this.currentPage.set(1); // Reset to first page
  }

  setStatusFilter(val: string) {
    this.statusFilter.set(val);
    this.currentPage.set(1);
  }

  onTagFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.tagFilter.set(val);
    this.currentPage.set(1);
  }

  onPageSizeChange(event: Event) {
    const val = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSize.set(val);
    this.currentPage.set(1);
  }

  setCurrentPage(page: number) {
    this.currentPage.set(page);
  }

  // Stepper handlers
  stepSteps(amount: number) {
    const current = this.taskForm.get('steps')?.value || 0;
    const next = Math.max(1, current + amount);
    this.taskForm.patchValue({ steps: next });
  }

  // Tag selection handlers
  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  toggleTag(tag: string) {
    this.selectedTags.update(current => {
      if (current.includes(tag)) {
        return current.filter(t => t !== tag);
      } else {
        return [...current, tag];
      }
    });
  }

  // Form toggles
  openCreateForm() {
    this.editingTaskId.set(null);
    this.selectedTags.set(['STEPS']); // default
    this.taskForm.reset({
      name: '',
      description: '',
      steps: 500,
      points: 50,
      isActive: true
    });
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  openEditForm(task: Task) {
    this.editingTaskId.set(task.id);
    this.editingTaskName.set(task.name);
    this.selectedTags.set([...task.requiredTags]);
    this.taskForm.reset({
      name: task.name,
      description: task.description,
      steps: task.steps,
      points: task.points,
      isActive: task.status === 'Active'
    });
    this.showErrors.set(false);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingTaskId.set(null);
    this.showErrors.set(false);
  }

  onFormSubmit() {
    if (this.taskForm.invalid || this.selectedTags().length === 0) {
      this.showErrors.set(true);
      return;
    }

    const val = this.taskForm.value;
    const taskPayload = {
      name: val.name,
      description: val.description || '',
      requiredTags: this.selectedTags(),
      steps: val.steps,
      points: val.points,
      status: val.isActive ? 'Active' : ('Inactive' as 'Active' | 'Inactive')
    };

    if (this.editingTaskId()) {
      this.store.dispatch(tasksActions.updateTask({
        id: this.editingTaskId()!,
        changes: taskPayload
      }));
    } else {
      this.store.dispatch(tasksActions.createTask(taskPayload));
    }
    
    // Close form on save
    this.closeForm();
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.store.dispatch(tasksActions.deleteTask({ id }));
      this.closeForm();
    }
  }

  // User simulated values (match Figma layout page 21)
  getUserProgressSteps(taskId: number, targetSteps: number): string {
    const progress: { [key: number]: number } = {
      1: 100,  // 100 / 500
      2: 360,  // 360 / 1000
      3: 1040, // 1040 / 2000
      4: 2039, // 2039 / 3000
      5: 4200  // 4200 / 5000
    };
    const current = progress[taskId] || 0;
    return `${current} / ${targetSteps}`;
  }

  getUserProgressPercent(taskId: number): number {
    const percentages: { [key: number]: number } = {
      1: 20,
      2: 36,
      3: 52,
      4: 68,
      5: 84
    };
    return percentages[taskId] || 0;
  }
}
