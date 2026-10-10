import { TestBed } from '@angular/core/testing';
import { NotificationBoard } from './notification-board';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const shownIds = () => service.notifications().map((toast) => toast.id);
  const shownMessages = () =>
    service.notifications().map((toast) => toast.message);

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a notification with a generated id and info default', () => {
    const id = service.show({ message: 'hello' });
    const toasts = service.notifications();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      id,
      kind: 'info',
      message: 'hello',
      count: 1,
    });
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

  it('carries the icon the raiser named', () => {
    service.show({ message: 'Synced', icon: 'refresh' });
    expect(service.notifications()[0].icon).toBe('refresh');
  });

  describe('lifetime', () => {
    it.each([
      ['info', 5000],
      ['success', 5000],
      ['warning', 8000],
    ] as const)(
      'lets a %s without a stated lifetime leave after %i ms',
      (kind, lifetime) => {
        service.show({ message: 'goes', kind });

        vi.advanceTimersByTime(lifetime - 1);
        expect(service.notifications()).toHaveLength(1);
        vi.advanceTimersByTime(1);
        expect(service.notifications()).toHaveLength(0);
      },
    );

    it('keeps an error without a stated lifetime until dismissed', () => {
      service.show({ message: 'broken', kind: 'error' });
      vi.advanceTimersByTime(60_000);
      expect(service.notifications()).toHaveLength(1);
    });

    it('keeps a notification of any kind that states zero', () => {
      service.show({ message: 'stays', kind: 'success', timeoutMs: 0 });
      vi.advanceTimersByTime(60_000);
      expect(service.notifications()).toHaveLength(1);
    });

    it('lets a stated lifetime win over the kind, for an error too', () => {
      service.show({ message: 'brief', kind: 'error', timeoutMs: 1000 });
      service.show({ message: 'long', kind: 'info', timeoutMs: 20_000 });

      vi.advanceTimersByTime(1000);
      expect(shownMessages()).toEqual(['long']);
      vi.advanceTimersByTime(18_999);
      expect(shownMessages()).toEqual(['long']);
      vi.advanceTimersByTime(1);
      expect(shownMessages()).toEqual([]);
    });

    it('shows a notification with a lifetime longer than a timer can hold, instead of dropping it', () => {
      service.show({ message: 'next month', timeoutMs: 2 ** 31 });
      vi.advanceTimersByTime(60_000);
      expect(service.notifications()).toHaveLength(1);
    });

    it('starts the lifetime over when a notification is replaced by id', () => {
      service.show({ id: 'x', message: 'first', timeoutMs: 1000 });
      vi.advanceTimersByTime(900);
      service.show({ id: 'x', message: 'second', timeoutMs: 1000 });

      vi.advanceTimersByTime(900);
      expect(shownMessages()).toEqual(['second']);
      vi.advanceTimersByTime(100);
      expect(shownMessages()).toEqual([]);
    });
  });

  describe('hold', () => {
    it('keeps a held notification past its lifetime', () => {
      service.show({ message: 'read me', timeoutMs: 1000 });
      service.hold();
      vi.advanceTimersByTime(60_000);
      expect(service.notifications()).toHaveLength(1);
    });

    it('holds every notification shown, not one of them', () => {
      service.show({ message: 'one', timeoutMs: 1000 });
      service.show({ message: 'two', timeoutMs: 2000 });
      service.hold();
      vi.advanceTimersByTime(60_000);
      expect(shownMessages()).toEqual(['one', 'two']);
    });

    it('runs what was left of the lifetime after the hold', () => {
      service.show({ message: 'long', timeoutMs: 10_000 });
      vi.advanceTimersByTime(4000);
      service.hold();
      vi.advanceTimersByTime(60_000);
      service.release();

      vi.advanceTimersByTime(5999);
      expect(service.notifications()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.notifications()).toHaveLength(0);
    });

    it('gives a notification about to leave at least a second after the hold', () => {
      service.show({ message: 'nearly gone', timeoutMs: 1000 });
      vi.advanceTimersByTime(950);
      service.hold();
      service.release();

      vi.advanceTimersByTime(999);
      expect(service.notifications()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.notifications()).toHaveLength(0);
    });

    it('starts the lifetime of a notification raised during a hold when the hold ends', () => {
      service.show({ message: 'held', timeoutMs: 0 });
      service.hold();
      service.show({ message: 'late', timeoutMs: 3000 });
      vi.advanceTimersByTime(60_000);
      expect(shownMessages()).toEqual(['held', 'late']);

      service.release();
      vi.advanceTimersByTime(3000);
      expect(shownMessages()).toEqual(['held']);
    });

    it('does not begin a hold while nothing is shown', () => {
      service.hold();
      service.show({ message: 'nobody attends', timeoutMs: 1000 });
      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });

    it('leaves no timer behind when a held notification is dismissed', () => {
      const id = service.show({ message: 'gone', timeoutMs: 1000 });
      service.hold();
      service.dismiss(id);
      service.release();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('ends a hold when the last notification is dismissed', () => {
      const id = service.show({ message: 'only', timeoutMs: 1000 });
      service.hold();
      service.dismiss(id);

      service.show({ message: 'next', timeoutMs: 1000 });
      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });

    it('treats a second hold and a release without a hold as nothing', () => {
      service.show({ message: 'plain', timeoutMs: 1000 });
      service.release();
      service.hold();
      service.hold();
      service.release();
      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });
  });

  describe('bound', () => {
    const raiseFour = () =>
      ['a', 'b', 'c', 'd'].map((id) =>
        service.show({ id, message: id, timeoutMs: 0 }),
      );

    it('shows three and keeps a fourth waiting', () => {
      raiseFour();
      expect(shownIds()).toEqual(['a', 'b', 'c']);
    });

    it('shows the longest-waiting notification when one is dismissed', () => {
      raiseFour();
      service.show({ id: 'e', message: 'e', timeoutMs: 0 });
      service.dismiss('b');
      expect(shownIds()).toEqual(['a', 'c', 'd']);
    });

    it('gives a notification that waited its whole lifetime', () => {
      service.show({ id: 'a', message: 'a', timeoutMs: 10_000 });
      service.show({ id: 'b', message: 'b', timeoutMs: 0 });
      service.show({ id: 'c', message: 'c', timeoutMs: 0 });
      service.show({ id: 'd', message: 'd', timeoutMs: 2000 });

      vi.advanceTimersByTime(10_000);
      expect(shownIds()).toEqual(['b', 'c', 'd']);
      vi.advanceTimersByTime(1999);
      expect(shownIds()).toEqual(['b', 'c', 'd']);
      vi.advanceTimersByTime(1);
      expect(shownIds()).toEqual(['b', 'c']);
    });

    it('replaces a waiting notification by id without moving it up', () => {
      raiseFour();
      service.show({ id: 'e', message: 'e', timeoutMs: 0 });
      service.show({ id: 'd', message: 'd2', timeoutMs: 0 });
      service.dismiss('a');

      expect(shownMessages()).toEqual(['b', 'c', 'd2']);
    });
  });

  describe('repeat', () => {
    it('counts the same notification raised twice on the first', () => {
      const first = service.show({ message: 'Saving failed', kind: 'error' });
      const second = service.show({ message: 'Saving failed', kind: 'error' });

      expect(second).toBe(first);
      expect(service.notifications()).toHaveLength(1);
      expect(service.notifications()[0].count).toBe(2);
    });

    it('starts the lifetime over on a repeat', () => {
      service.show({ message: 'Saved', timeoutMs: 1000 });
      vi.advanceTimersByTime(900);
      service.show({ message: 'Saved', timeoutMs: 1000 });

      vi.advanceTimersByTime(999);
      expect(service.notifications()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.notifications()).toHaveLength(0);
    });

    it('takes the newer action on a repeat', () => {
      const ran: string[] = [];
      service.show({
        message: 'Retry?',
        action: {
          label: 'Retry',
          run: () => {
            ran.push('older');
          },
        },
      });
      service.show({
        message: 'Retry?',
        action: {
          label: 'Retry',
          run: () => {
            ran.push('newer');
          },
        },
      });

      service.notifications()[0].action?.run();
      expect(ran).toEqual(['newer']);
    });

    it('counts a repeat of a waiting notification without moving it up', () => {
      for (const id of ['a', 'b', 'c']) {
        service.show({ id, message: id, timeoutMs: 0 });
      }
      service.show({ message: 'waiting', timeoutMs: 0 });
      service.show({ id: 'e', message: 'e', timeoutMs: 0 });
      service.show({ message: 'waiting', timeoutMs: 0 });
      service.dismiss('a');

      expect(shownMessages()).toEqual(['b', 'c', 'waiting']);
      expect(service.notifications()[2].count).toBe(2);
    });

    it.each([
      ['kind', { message: 'Same', kind: 'warning' as const }],
      ['wording', { message: 'Other' }],
      ['icon', { message: 'Same', icon: 'refresh' }],
      [
        'action label',
        { message: 'Same', action: { label: 'Undo', run: () => undefined } },
      ],
    ])('shows a notification that differs in %s as its own', (_, other) => {
      service.show({ message: 'Same' });
      service.show(other);
      expect(service.notifications()).toHaveLength(2);
    });

    it('replaces a notification with an id and never counts it', () => {
      service.show({ id: 'update', message: 'A version is waiting' });
      service.show({ id: 'update', message: 'A version is waiting' });
      expect(service.notifications()[0].count).toBe(1);
    });

    it('replaces rather than counts when the generated id is passed back', () => {
      const id = service.show({ message: 'Syncing' });
      service.show({ id, message: 'Syncing' });
      expect(service.notifications()[0].count).toBe(1);
    });

    it('does not count a repeat once the first has left', () => {
      service.show({ message: 'Saved', timeoutMs: 1000 });
      vi.advanceTimersByTime(1000);
      service.show({ message: 'Saved', timeoutMs: 1000 });
      expect(service.notifications()[0].count).toBe(1);
    });
  });

  describe('raiser', () => {
    let board: NotificationBoard;

    beforeEach(() => {
      board = TestBed.inject(NotificationBoard);
    });

    it('shows the same wording from two plugins as two notifications', () => {
      board.show({ message: 'Done' }, 'plugin.a');
      board.show({ message: 'Done' }, 'plugin.b');
      expect(service.notifications()).toHaveLength(2);
    });

    it("does not count a plugin's notification on the application's own", () => {
      service.show({ message: 'Done' });
      board.show({ message: 'Done' }, 'plugin.a');
      expect(service.notifications()).toHaveLength(2);
    });

    it('keeps the ids two plugins chose apart', () => {
      board.show({ id: 'status', message: 'A' }, 'plugin.a');
      board.show({ id: 'status', message: 'B' }, 'plugin.b');
      expect(shownIds()).toEqual(['plugin.a.status', 'plugin.b.status']);
    });

    it("leaves the application's notification alone when a plugin's name and id spell its id", () => {
      service.show({ id: 'shell.update', message: 'A version is waiting' });
      board.show({ id: 'update', message: 'Mine now' }, 'shell');

      expect(shownMessages()).toEqual(['A version is waiting', 'Mine now']);
      expect(new Set(shownIds()).size).toBe(2);
    });

    it("gives the application's notification its id back when a plugin spelled it first", () => {
      board.show({ id: 'update', message: 'Squatting' }, 'shell');
      service.show({ id: 'shell.update', message: 'A version is waiting' });
      service.dismiss('shell.update');

      expect(shownMessages()).toEqual(['Squatting']);
    });

    it('still finds a notification by the id its raiser was returned, after that id was taken back', () => {
      const returned = board.show({ id: 'update', message: 'Mine' }, 'shell');
      service.show({ id: 'shell.update', message: 'A version is waiting' });
      const again = board.show(
        { id: returned, message: 'Mine, updated' },
        'shell',
      );
      board.show({ id: again, message: 'Mine, updated twice' }, 'shell');

      expect(again).toBe(returned);
      expect(shownMessages()).toEqual([
        'Mine, updated twice',
        'A version is waiting',
      ]);
    });

    it('keeps the lifetime of a notification whose id was taken from it', () => {
      board.show({ id: 'update', message: 'Squatting', timeoutMs: 1000 }, 'shell');
      service.show({ id: 'shell.update', message: 'Mine', timeoutMs: 0 });

      vi.advanceTimersByTime(1000);
      expect(shownMessages()).toEqual(['Mine']);
    });

    it("leaves another plugin's notification alone when the joined ids are equal", () => {
      board.show({ id: 'status', message: 'Mail' }, 'acme.mail');
      board.show({ id: 'mail.status', message: 'Not mail' }, 'acme');

      expect(shownMessages()).toEqual(['Mail', 'Not mail']);
    });

    it('leaves a generated id alone when a plugin spells it', () => {
      const generated = service.show({ message: 'Anonymous' });
      const prefix = generated.slice(0, generated.indexOf('.'));
      const rest = generated.slice(generated.indexOf('.') + 1);
      board.show({ id: rest, message: 'Spelled' }, prefix);

      expect(shownMessages()).toEqual(['Anonymous', 'Spelled']);
    });

    it('replaces when a plugin passes back the id it was returned', () => {
      const id = board.show({ message: 'Syncing' }, 'plugin.a');
      board.show({ id, message: 'Synced' }, 'plugin.a');

      expect(shownMessages()).toEqual(['Synced']);
    });
  });
});
