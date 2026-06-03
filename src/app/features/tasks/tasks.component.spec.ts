import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TasksComponent } from './tasks.component';
import { provideStore, Store } from '@ngrx/store';
import { tasksFeature, tasksActions } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { Task } from '../../core/models';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let store: Store;
  let authServiceSpy: any;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal({
      id: 42,
      name: 'Jane Doe',
      role: 'ROLE_USER'
    });
    authServiceSpy = {
      currentUser: currentUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [TasksComponent, ReactiveFormsModule],
      providers: [
        provideStore({
          [tasksFeature.name]: tasksFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should determine isAdmin status', () => {
    expect(component.isAdmin()).toBe(false);
    currentUserSignal.set({ id: 1, name: 'Admin', role: 'ROLE_ADMIN' });
    expect(component.isAdmin()).toBe(true);
  });

  it('should filter tasks by search, status, and tag', () => {
    const mockTasks: Task[] = [
      { id: 1, name: 'Task Alpha', description: 'Desc A', requiredTags: ['STEPS', 'GPS'], steps: 500, points: 50, status: 'Active' },
      { id: 2, name: 'Task Beta', description: 'Desc B', requiredTags: ['HRM'], steps: 1000, points: 100, status: 'Active' },
      { id: 3, name: 'Task Gamma', description: 'Desc C', requiredTags: ['STEPS'], steps: 2000, points: 200, status: 'Inactive' }
    ];
    store.dispatch(tasksActions.loadTasksSuccess({ tasks: mockTasks }));
    fixture.detectChanges();

    // Text search
    component.searchText.set('alpha');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].id).toBe(1);

    // Reset search, set status to inactive
    component.searchText.set('');
    component.statusFilter.set('inactive');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].id).toBe(3);

    // Reset status, set tag to HRM
    component.statusFilter.set('all');
    component.tagFilter.set('HRM');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].id).toBe(2);
  });

  it('should paginate items', () => {
    const mockTasks = Array(12).fill(0).map((_, i) => ({
      id: i + 1,
      name: `Task ${i}`,
      requiredTags: ['STEPS'],
      steps: 500,
      points: 50,
      status: 'Active'
    } as any));
    store.dispatch(tasksActions.loadTasksSuccess({ tasks: mockTasks }));
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3);
    expect(component.pagesArray()).toEqual([1, 2, 3]);

    component.setCurrentPage(2);
    expect(component.paginatedTasks().length).toBe(5);
    expect(component.paginatedTasks()[0].id).toBe(6);
  });

  it('should filter user tasks (active vs completed)', () => {
    const mockTasks: Task[] = [
      { id: 1, name: 'Task 1', requiredTags: ['STEPS'], steps: 500, points: 50, status: 'Active' },
      { id: 2, name: 'Task 2', requiredTags: ['STEPS'], steps: 1000, points: 100, status: 'Active' },
      { id: 10, name: 'Task 10', requiredTags: ['STEPS'], steps: 2000, points: 200, status: 'Active' }
    ];
    store.dispatch(tasksActions.loadTasksSuccess({ tasks: mockTasks }));
    jest.spyOn(component, 'getUserProgressPercent').mockImplementation((taskId) => {
      if (taskId === 1) return 20;
      if (taskId === 2) return 36;
      if (taskId === 10) return 100;
      return 0;
    });
    fixture.detectChanges();

    // active: progress < 100%
    component.statusFilter.set('active');
    expect(component.userFilteredTasks().length).toBe(2);

    // completed: progress >= 100%
    component.statusFilter.set('completed');
    expect(component.userFilteredTasks().length).toBe(1);
    expect(component.userFilteredTasks()[0].id).toBe(10);
  });

  it('should handle search, filter, and page change events', () => {
    component.onSearchInput({ target: { value: 'test' } } as any);
    expect(component.searchText()).toBe('test');
    expect(component.currentPage()).toBe(1);

    component.setStatusFilter('active');
    expect(component.statusFilter()).toBe('active');
    expect(component.currentPage()).toBe(1);

    component.onTagFilterChange({ target: { value: 'GPS' } } as any);
    expect(component.tagFilter()).toBe('GPS');
    expect(component.currentPage()).toBe(1);

    component.onPageSizeChange({ target: { value: '10' } } as any);
    expect(component.pageSize()).toBe(10);
    expect(component.currentPage()).toBe(1);
  });

  it('should step steps value up and down', () => {
    component.openCreateForm();
    expect(component.taskForm.get('steps')?.value).toBe(500);

    component.stepSteps(100);
    expect(component.taskForm.get('steps')?.value).toBe(600);

    component.stepSteps(-1000);
    expect(component.taskForm.get('steps')?.value).toBe(1); // Min limit is 1
  });

  it('should toggle tag selection', () => {
    component.openCreateForm();
    expect(component.isTagSelected('STEPS')).toBe(true);

    component.toggleTag('GPS');
    expect(component.isTagSelected('GPS')).toBe(true);

    component.toggleTag('STEPS');
    expect(component.isTagSelected('STEPS')).toBe(false);
  });

  it('should open edit form with task details', () => {
    const task: Task = {
      id: 10,
      name: 'Edit Task',
      description: 'Desc',
      requiredTags: ['GPS'],
      steps: 800,
      points: 80,
      status: 'Active'
    };
    component.openEditForm(task);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editingTaskId()).toBe(10);
    expect(component.editingTaskName()).toBe('Edit Task');
    expect(component.selectedTags()).toEqual(['GPS']);
    expect(component.taskForm.value).toEqual({
      name: 'Edit Task',
      description: 'Desc',
      steps: 800,
      points: 80,
      isActive: true
    });
  });

  it('should dispatch create or update task action on form submit', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    // Create Task
    component.openCreateForm();
    component.taskForm.patchValue({
      name: 'New Task',
      steps: 1200,
      points: 120
    });
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: tasksActions.createTask.type,
      name: 'New Task',
      steps: 1200,
      points: 120
    }));

    // Update Task
    component.openEditForm({
      id: 15,
      name: 'Old Task',
      description: 'Desc',
      requiredTags: ['STEPS'],
      steps: 200,
      points: 20,
      status: 'Inactive'
    });
    component.taskForm.patchValue({
      name: 'Updated Task'
    });
    component.onFormSubmit();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: tasksActions.updateTask.type,
      id: 15
    }));
  });

  it('should show errors on form submit if invalid or no tags', () => {
    component.openCreateForm();
    component.taskForm.patchValue({ name: '' }); // invalid name
    component.onFormSubmit();
    expect(component.showErrors()).toBe(true);

    component.taskForm.patchValue({ name: 'Valid' });
    component.selectedTags.set([]); // no tags selected
    component.onFormSubmit();
    expect(component.showErrors()).toBe(true);
  });

  it('should confirm and dispatch deleteTask', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    component.onDelete(5);
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(tasksActions.deleteTask({ id: 5 }));

    confirmSpy.mockRestore();
  });

  it('should return simulated user progress and percent', () => {
    expect(component.getUserProgressSteps(1, 500)).toBe('100 / 500');
    expect(component.getUserProgressSteps(99, 100)).toBe('0 / 100');

    expect(component.getUserProgressPercent(1)).toBe(20);
    expect(component.getUserProgressPercent(99)).toBe(0);
  });
});
