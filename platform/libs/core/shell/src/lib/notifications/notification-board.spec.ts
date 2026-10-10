import { TestBed } from '@angular/core/testing';
import { NotificationBoard } from './notification-board';

describe('NotificationBoard — a raiser with limits', () => {
  const LIMITS = { atOnce: 3, lifetimeMs: 15_000 };
  let board: NotificationBoard;
  let unlimit: () => void;

  const shown = () => board.shown().map((notification) => notification.message);
  const showThree = (timeoutMs?: number) => {
    for (const message of ['one', 'two', 'three']) {
      board.show({ message, timeoutMs }, 'bounded');
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    board = TestBed.inject(NotificationBoard);
    unlimit = board.limit('bounded', LIMITS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets a notification stated to stay leave at the longest lifetime', () => {
    board.show({ message: 'forever', timeoutMs: 0 }, 'bounded');

    vi.advanceTimersByTime(14_999);
    expect(shown()).toEqual(['forever']);
    vi.advanceTimersByTime(1);
    expect(shown()).toEqual([]);
  });

  it('lets an error without a lifetime leave too', () => {
    board.show({ message: 'failed', kind: 'error' }, 'bounded');
    vi.advanceTimersByTime(15_000);
    expect(shown()).toEqual([]);
  });

  it('shortens a longer lifetime and leaves a shorter one alone', () => {
    board.show({ message: 'long', timeoutMs: 600_000 }, 'bounded');
    board.show({ message: 'short', timeoutMs: 2000 }, 'bounded');

    vi.advanceTimersByTime(2000);
    expect(shown()).toEqual(['long']);
    vi.advanceTimersByTime(13_000);
    expect(shown()).toEqual([]);
  });

  it('keeps the lifetime the kind gives where none is stated', () => {
    board.show({ message: 'info' }, 'bounded');
    vi.advanceTimersByTime(5000);
    expect(shown()).toEqual([]);
  });

  it('refuses a fourth notification and leaves the three as they are', () => {
    showThree();

    expect(() => board.show({ message: 'four' }, 'bounded')).toThrow(
      /'bounded' already holds 3 toasts/,
    );
    expect(shown()).toEqual(['one', 'two', 'three']);
    expect(board.shown().map((notification) => notification.count)).toEqual([
      1, 1, 1,
    ]);
  });

  it('counts waiting notifications against the limit', () => {
    board.show({ id: 'own', message: 'own', timeoutMs: 0 });
    showThree();

    expect(() => board.show({ message: 'four' }, 'bounded')).toThrow();
  });

  it('takes a repeat and a replacement while the raiser is at its limit', () => {
    board.show({ message: 'one' }, 'bounded');
    board.show({ message: 'two' }, 'bounded');
    board.show({ id: 'named', message: 'three' }, 'bounded');

    board.show({ message: 'one' }, 'bounded');
    board.show({ id: 'named', message: 'three, updated' }, 'bounded');

    expect(board.shown().map((notification) => notification.count)).toEqual([
      2, 1, 1,
    ]);
    expect(shown()[2]).toBe('three, updated');
  });

  it('does not let a repeated notification outlive its first lifetime', () => {
    showThree();
    board.show({ message: 'A version is waiting', timeoutMs: 0 });

    for (let elapsed = 0; elapsed < 60_000; elapsed += 4000) {
      vi.advanceTimersByTime(4000);
      if (shown().includes('one')) {
        showThree();
      }
    }

    expect(shown()).toContain('A version is waiting');
  });

  it('shows a repeat\'s count while the first lifetime keeps running', () => {
    board.show({ message: 'again', timeoutMs: 10_000 }, 'bounded');
    vi.advanceTimersByTime(9000);
    board.show({ message: 'again', timeoutMs: 10_000 }, 'bounded');
    expect(board.shown()[0].count).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(shown()).toEqual([]);
  });

  it('does not let a replaced notification outlive its first lifetime', () => {
    board.show({ id: 'status', message: 'first', timeoutMs: 0 }, 'bounded');

    vi.advanceTimersByTime(14_000);
    board.show({ id: 'status', message: 'second', timeoutMs: 0 }, 'bounded');
    expect(shown()).toEqual(['second']);

    vi.advanceTimersByTime(1000);
    expect(shown()).toEqual([]);
  });

  it("shows the application's notification once the three before it have left", () => {
    showThree(0);
    board.show({ message: 'A version is waiting', timeoutMs: 0 });
    expect(shown()).not.toContain('A version is waiting');

    vi.advanceTimersByTime(15_000);
    expect(shown()).toEqual(['A version is waiting']);
  });

  it('has room again when a notification has left', () => {
    showThree(1000);
    vi.advanceTimersByTime(1000);

    board.show({ message: 'four' }, 'bounded');
    expect(shown()).toEqual(['four']);
  });

  it('limits nobody else', () => {
    for (const message of ['one', 'two', 'three', 'four']) {
      board.show({ message, timeoutMs: 0 }, 'trusted');
    }
    board.show({ message: 'one', timeoutMs: 0 }, 'trusted');

    vi.advanceTimersByTime(60_000);
    expect(shown()).toEqual(['one', 'two', 'three']);
  });

  it('starts the lifetime over on a repeat by a raiser without limits', () => {
    board.show({ message: 'again', timeoutMs: 10_000 }, 'trusted');
    vi.advanceTimersByTime(9000);
    board.show({ message: 'again', timeoutMs: 10_000 }, 'trusted');

    vi.advanceTimersByTime(9999);
    expect(shown()).toEqual(['again']);
  });

  it('stops limiting a raiser whose limits were taken away', () => {
    unlimit();
    board.show({ message: 'stays now', timeoutMs: 0 }, 'bounded');

    vi.advanceTimersByTime(60_000);
    expect(shown()).toEqual(['stays now']);
  });
});
