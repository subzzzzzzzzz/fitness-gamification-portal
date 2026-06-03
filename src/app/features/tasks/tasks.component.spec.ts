import { TestBed } from '@angular/core/testing';
import { TasksComponent } from './tasks.component';
import { provideStore } from '@ngrx/store';
import { tasksFeature } from '../../store/tasks.store';
import { authFeature } from '../../store/auth.store';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('TasksComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideStore({
          [tasksFeature.name]: tasksFeature.reducer,
          [authFeature.name]: authFeature.reducer
        }),
        provideHttpClient(),
        provideAnimationsAsync(),
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(TasksComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
