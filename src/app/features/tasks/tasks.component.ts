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
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
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
