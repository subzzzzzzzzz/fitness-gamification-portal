import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { tasksFeature, tasksActions, loadTasksEffect, createTaskEffect, updateTaskEffect, deleteTaskEffect } from './tasks.store';
import { TasksService } from '../core/services/tasks.service';
import { ToastService } from '../core/services/toast.service';
import { Task } from '../core/models';

describe('Tasks Store & Effects', () => {
  let actions$: Observable<any>;
  let tasksServiceSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    tasksServiceSpy = {
      getTasks: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn()
    };
    toastServiceSpy = {
      success: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: TasksService, useValue: tasksServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  describe('Reducer', () => {
    it('should return initial state', () => {
      const state = tasksFeature.reducer(undefined, { type: 'unknown' });
      expect(state.loading).toBe(false);
      expect(state.tasks).toEqual([]);
    });

    it('should set loading on load tasks', () => {
      let state = tasksFeature.reducer(undefined, tasksActions.loadTasks());
      expect(state.loading).toBe(true);
    });

    it('should populate tasks on load success', () => {
      const list = [{ id: 1 } as Task];
      const state = tasksFeature.reducer(undefined, tasksActions.loadTasksSuccess({ tasks: list }));
      expect(state.loading).toBe(false);
      expect(state.tasks).toEqual(list);
    });

    it('should add task on create success', () => {
      const item = { id: 1 } as Task;
      const state = tasksFeature.reducer({ tasks: [], loading: true, error: null }, tasksActions.createTaskSuccess({ task: item }));
      expect(state.loading).toBe(false);
      expect(state.tasks).toEqual([item]);
    });

    it('should update task on update success', () => {
      const initial = { tasks: [{ id: 1, title: 'Old' } as Task], loading: true, error: null };
      const updated = { id: 1, title: 'New' } as Task;
      const state = tasksFeature.reducer(initial, tasksActions.updateTaskSuccess({ task: updated }));
      expect(state.tasks[0].title).toBe('New');
    });

    it('should remove task on delete success', () => {
      const initial = { tasks: [{ id: 1 } as Task], loading: true, error: null };
      const state = tasksFeature.reducer(initial, tasksActions.deleteTaskSuccess({ id: 1 }));
      expect(state.tasks.length).toBe(0);
    });
  });

  describe('Effects', () => {
    it('should load tasks', (done) => {
      tasksServiceSpy.getTasks.mockReturnValue(of([]));
      actions$ = of(tasksActions.loadTasks());

      TestBed.runInInjectionContext(() => {
        loadTasksEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.loadTasksSuccess({ tasks: [] }));
          done();
        });
      });
    });

    it('should handle load tasks failure', (done) => {
      tasksServiceSpy.getTasks.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(tasksActions.loadTasks());

      TestBed.runInInjectionContext(() => {
        loadTasksEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.loadTasksFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should create task', (done) => {
      const item = { id: 1 } as Task;
      tasksServiceSpy.createTask.mockReturnValue(of(item));
      actions$ = of(tasksActions.createTask({ name: '', description: '', requiredTags: [], steps: 0, points: 0, status: 'Active' }));

      TestBed.runInInjectionContext(() => {
        createTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.createTaskSuccess({ task: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle create task failure', (done) => {
      tasksServiceSpy.createTask.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(tasksActions.createTask({ name: '', description: '', requiredTags: [], steps: 0, points: 0, status: 'Active' }));

      TestBed.runInInjectionContext(() => {
        createTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.createTaskFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should update task', (done) => {
      const item = { id: 1 } as Task;
      tasksServiceSpy.updateTask.mockReturnValue(of(item));
      actions$ = of(tasksActions.updateTask({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.updateTaskSuccess({ task: item }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle update task failure', (done) => {
      tasksServiceSpy.updateTask.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(tasksActions.updateTask({ id: 1, changes: {} }));

      TestBed.runInInjectionContext(() => {
        updateTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.updateTaskFailure({ error: 'Failed' }));
          done();
        });
      });
    });

    it('should delete task', (done) => {
      tasksServiceSpy.deleteTask.mockReturnValue(of({}));
      actions$ = of(tasksActions.deleteTask({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.deleteTaskSuccess({ id: 1 }));
          expect(toastServiceSpy.success).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should handle delete task failure', (done) => {
      tasksServiceSpy.deleteTask.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));
      actions$ = of(tasksActions.deleteTask({ id: 1 }));

      TestBed.runInInjectionContext(() => {
        deleteTaskEffect().subscribe(res => {
          expect(res).toEqual(tasksActions.deleteTaskFailure({ error: 'Failed' }));
          done();
        });
      });
    });
  });
});
