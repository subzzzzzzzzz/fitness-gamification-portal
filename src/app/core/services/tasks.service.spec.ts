import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TasksService } from './tasks.service';
import { Task } from '../models';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksService]
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get tasks', (done) => {
    const mockTasks: Task[] = [
      { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, userId: 1, type: 'daily', points: 10, createdAt: '', updatedAt: '' }
    ];

    service.getTasks().subscribe(tasks => {
      expect(tasks).toEqual(mockTasks);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('should get a single task', (done) => {
    const mockTask: Task = { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, userId: 1, type: 'daily', points: 10, createdAt: '', updatedAt: '' };

    service.getTask(1).subscribe(task => {
      expect(task).toEqual(mockTask);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/tasks/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('should create a task with timestamps', (done) => {
    const newTask = { title: 'Task 1', description: 'Desc 1', completed: false, userId: 1, type: 'daily' as const, points: 10 };
    const savedTask: Task = { id: 1, ...newTask, createdAt: '2026-06-03T10:00:00Z', updatedAt: '2026-06-03T10:00:00Z' };

    service.createTask(newTask).subscribe(task => {
      expect(task).toEqual(savedTask);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.createdAt).toBeDefined();
    expect(req.request.body.updatedAt).toBeDefined();
    req.flush(savedTask);
  });

  it('should update a task and update updatedAt timestamp', (done) => {
    const updateData: Partial<Task> = { completed: true };
    const updatedTask: Task = { id: 1, title: 'Task 1', description: 'Desc 1', completed: true, userId: 1, type: 'daily', points: 10, createdAt: '', updatedAt: '2026-06-03T10:00:00Z' };

    service.updateTask(1, updateData).subscribe(task => {
      expect(task).toEqual(updatedTask);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/tasks/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.updatedAt).toBeDefined();
    req.flush(updatedTask);
  });

  it('should delete a task', (done) => {
    service.deleteTask(1).subscribe(res => {
      expect(res).toEqual({});
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/tasks/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
