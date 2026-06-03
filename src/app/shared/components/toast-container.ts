import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="toast.type" role="alert">
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close notification">
            <svg lucideIcon="x" size="16"></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: calc(100% - 48px);
    }
    .toast-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      gap: 12px;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      
      &.success {
        border-left: 4px solid var(--success-500);
      }
      &.error {
        border-left: 4px solid var(--error-500);
      }
      &.warning {
        border-left: 4px solid var(--warning-500);
      }
      &.info {
        border-left: 4px solid var(--primary-600);
      }
    }
    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary);
    }
    .toast-message {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .toast-close {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: var(--gray-400);
      display: flex;
      &:hover {
        color: var(--text-primary);
      }
    }
    @keyframes slideIn {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
