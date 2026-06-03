import { inject } from '@angular/core';
import { createActionGroup, emptyProps, props, createFeature, createReducer, on } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TasksService } from '../core/services/tasks.service';
import { ToastService } from '../core/services/toast.service';
import { Task } from '../core/models';

export interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null
};

export const tasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    'Load Tasks': emptyProps(),
    'Load Tasks Success': props<{ tasks: Task[] }>(),
    'Load Tasks Failure': props<{ error: string }>(),
    'Create Task': props<{ name: string; description: string; requiredTags: string[]; steps: number; points: number; status: 'Active' | 'Inactive' }>(),
    'Create Task Success': props<{ task: Task }>(),
    'Create Task Failure': props<{ error: string }>(),
    'Update Task': props<{ id: number; changes: Partial<Task> }>(),
    'Update Task Success': props<{ task: Task }>(),
    'Update Task Failure': props<{ error: string }>(),
    'Delete Task': props<{ id: number }>(),
    'Delete Task Success': props<{ id: number }>(),
    'Delete Task Failure': props<{ error: string }>()
  }
});

export const tasksFeature = createFeature({
  name: 'tasks',
  reducer: createReducer(
    initialState,
    on(tasksActions.loadTasks, tasksActions.createTask, tasksActions.updateTask, tasksActions.deleteTask, (state) => ({
      ...state,
      loading: true,
      error: null
    })),
    on(tasksActions.loadTasksSuccess, (state, { tasks }) => ({
      ...state,
      loading: false,
      tasks
    })),
    on(tasksActions.loadTasksFailure, tasksActions.createTaskFailure, tasksActions.updateTaskFailure, tasksActions.deleteTaskFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
    on(tasksActions.createTaskSuccess, (state, { task }) => ({
      ...state,
      loading: false,
      tasks: [...state.tasks, task]
    })),
    on(tasksActions.updateTaskSuccess, (state, { task }) => ({
      ...state,
      loading: false,
      tasks: state.tasks.map(t => t.id === task.id ? task : t)
    })),
    on(tasksActions.deleteTaskSuccess, (state, { id }) => ({
      ...state,
      loading: false,
      tasks: state.tasks.filter(t => t.id !== id)
    }))
  )
});

// Functional Effects
export const loadTasksEffect = createEffect(
  (actions$ = inject(Actions), tasksService = inject(TasksService)) => {
    return actions$.pipe(
      ofType(tasksActions.loadTasks),
      switchMap(() =>
        tasksService.getTasks().pipe(
          map(tasks => tasksActions.loadTasksSuccess({ tasks })),
          catchError(err => of(tasksActions.loadTasksFailure({ error: err.error?.message || 'Failed to load tasks' })))
        )
      )
    );
  },
  { functional: true }
);

export const createTaskEffect = createEffect(
  (actions$ = inject(Actions), tasksService = inject(TasksService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(tasksActions.createTask),
      switchMap(taskData =>
        tasksService.createTask(taskData).pipe(
          map(task => {
            toastService.success('Success', 'Task created successfully!');
            return tasksActions.createTaskSuccess({ task });
          }),
          catchError(err => of(tasksActions.createTaskFailure({ error: err.error?.message || 'Failed to create task' })))
        )
      )
    );
  },
  { functional: true }
);

export const updateTaskEffect = createEffect(
  (actions$ = inject(Actions), tasksService = inject(TasksService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(tasksActions.updateTask),
      switchMap(({ id, changes }) =>
        tasksService.updateTask(id, changes).pipe(
          map(task => {
            toastService.success('Success', 'Task updated successfully!');
            return tasksActions.updateTaskSuccess({ task });
          }),
          catchError(err => of(tasksActions.updateTaskFailure({ error: err.error?.message || 'Failed to update task' })))
        )
      )
    );
  },
  { functional: true }
);

export const deleteTaskEffect = createEffect(
  (actions$ = inject(Actions), tasksService = inject(TasksService), toastService = inject(ToastService)) => {
    return actions$.pipe(
      ofType(tasksActions.deleteTask),
      switchMap(({ id }) =>
        tasksService.deleteTask(id).pipe(
          map(() => {
            toastService.success('Success', 'Task deleted successfully!');
            return tasksActions.deleteTaskSuccess({ id });
          }),
          catchError(err => of(tasksActions.deleteTaskFailure({ error: err.error?.message || 'Failed to delete task' })))
        )
      )
    );
  },
  { functional: true }
);
