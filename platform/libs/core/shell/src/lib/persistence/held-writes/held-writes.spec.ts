import { TestBed } from '@angular/core/testing';
import { HeldWrites } from './held-writes';

describe('HeldWrites', () => {
  let sent: string[];
  const send = (value: string) => {
    sent.push(value);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    sent = [];
  });

  afterEach(() => vi.useRealTimers());

  it('sends one write, the last, once a key has been quiet', () => {
    const writes = TestBed.inject(HeldWrites);

    writes.hold('k', 'a', send);
    writes.hold('k', 'b', send);
    vi.advanceTimersByTime(399);
    expect(sent).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(sent).toEqual(['b']);
  });

  it('sends the latest value two seconds after the first held write, and holds afresh from there', () => {
    const writes = TestBed.inject(HeldWrites);

    for (let written = 0; written < 20; written += 1) {
      writes.hold('k', String(written), send);
      vi.advanceTimersByTime(200);
    }

    expect(sent).toEqual(['9', '19']);
  });

  it('sends everything held when the page goes away, once', () => {
    const writes = TestBed.inject(HeldWrites);

    writes.hold('k', 'a', send);
    writes.hold('other', 'b', send);
    globalThis.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(2000);

    expect(sent).toEqual(['a', 'b']);
  });

  it('sends nothing for a cancelled key', () => {
    const writes = TestBed.inject(HeldWrites);

    writes.hold('k', 'a', send);
    writes.cancel('k');
    globalThis.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(2000);

    expect(sent).toEqual([]);
  });

  it('sends a flushed key at once and not again', () => {
    const writes = TestBed.inject(HeldWrites);

    writes.hold('k', 'a', send);
    writes.flush('k');
    vi.advanceTimersByTime(2000);

    expect(sent).toEqual(['a']);
  });
});
