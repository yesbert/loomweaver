import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = TestBed.inject(NotificationService);
  });

  it('shows a notification with a generated id and info default', () => {
    const id = service.show({ message: 'hello' });
    const toasts = service.notifications();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, kind: 'info', message: 'hello' });
  });

  it('replaces a notification reusing the same id instead of stacking', () => {
    service.show({ id: 'x', message: 'first', kind: 'warning' });
    service.show({ id: 'x', message: 'second', kind: 'error' });
    const toasts = service.notifications();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: 'second', kind: 'error' });
  });

  it('dismisses by id', () => {
    const id = service.show({ message: 'bye' });
    service.dismiss(id);
    expect(service.notifications()).toHaveLength(0);
  });

  it('keeps stack position when replacing an existing id in place', () => {
    service.show({ id: 'a', message: 'A' });
    service.show({ id: 'b', message: 'B' });
    service.show({ id: 'a', message: 'A2' });

    const toasts = service.notifications();
    expect(toasts.map((t) => t.id)).toEqual(['a', 'b']);
    expect(toasts[0].message).toBe('A2');
  });

  it('auto-dismisses after the timeout, stays sticky without one', () => {
    vi.useFakeTimers();
    try {
      service.show({ id: 'sticky', message: 'stays' });
      service.show({ id: 'temp', message: 'goes', timeoutMs: 1000 });
      expect(service.notifications()).toHaveLength(2);
      vi.advanceTimersByTime(1000);
      const ids = service.notifications().map((t) => t.id);
      expect(ids).toEqual(['sticky']);
    } finally {
      vi.useRealTimers();
    }
  });
});
