import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container';
import { ToastService } from '../../core/services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display toasts and call dismiss on close button click', () => {
    // Add a toast
    toastService.show('success', 'Title A', 'Message A', 0);
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('.toast-item');
    expect(toastElements.length).toBe(1);
    expect(toastElements[0].querySelector('.toast-title').textContent).toContain('Title A');
    expect(toastElements[0].querySelector('.toast-message').textContent).toContain('Message A');

    // Click close button
    const closeBtn = toastElements[0].querySelector('.toast-close');
    const dismissSpy = jest.spyOn(toastService, 'dismiss');
    closeBtn.click();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalledWith(1);
  });
});
