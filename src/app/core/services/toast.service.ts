import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  toasts = signal<ToastMessage[]>([]);

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 5000) {
    const id = this.nextId++;
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    this.toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(title: string, message: string, duration = 5000) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration = 5000) {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration = 5000) {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration = 5000) {
    this.show('info', title, message, duration);
  }

  dismiss(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
