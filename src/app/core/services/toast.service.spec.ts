import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, ToastMessage } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show toast message and auto-dismiss it after duration', fakeAsync(() => {
    service.show('success', 'Test Title', 'Test Message', 3000);
    
    let currentToasts = service.toasts();
    expect(currentToasts.length).toBe(1);
    expect(currentToasts[0]).toEqual({
      id: 1,
      type: 'success',
      title: 'Test Title',
      message: 'Test Message',
      duration: 3000
    });

    tick(3000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should not auto-dismiss if duration is 0', fakeAsync(() => {
    service.show('info', 'Persistent', 'Does not close', 0);
    expect(service.toasts().length).toBe(1);
    
    tick(10000);
    expect(service.toasts().length).toBe(1);
  }));

  it('should support helper methods (success, error, warning, info)', () => {
    service.success('S', 'Success Msg');
    service.error('E', 'Error Msg');
    service.warning('W', 'Warning Msg');
    service.info('I', 'Info Msg');

    const list = service.toasts();
    expect(list.length).toBe(4);
    expect(list[0].type).toBe('success');
    expect(list[1].type).toBe('error');
    expect(list[2].type).toBe('warning');
    expect(list[3].type).toBe('info');
  });

  it('should dismiss toast on dismiss call', () => {
    service.success('S', 'Success Msg');
    const toastId = service.toasts()[0].id;
    
    service.dismiss(toastId);
    expect(service.toasts().length).toBe(0);
  });
});
