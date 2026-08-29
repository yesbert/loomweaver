import { TestBed } from '@angular/core/testing';
import { UserOrderService } from './user-order.service';

const STORAGE_KEY = 'lw.shell.item-order';
const key = (item: { id: string }) => item.id;
const items = (...ids: string[]) => ids.map((id) => ({ id }));

describe('UserOrderService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('returns the declared order when no user order is stored', () => {
    const svc = TestBed.inject(UserOrderService);
    expect(svc.applyOrder('c', items('a', 'b', 'c'), key).map((item) => key(item))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('applies the stored user order', () => {
    const svc = TestBed.inject(UserOrderService);
    svc.setOrder('c', ['c', 'a', 'b']);
    expect(svc.applyOrder('c', items('a', 'b', 'c'), key).map((item) => key(item))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('keeps an unknown (newly contributed) item at its declared slot', () => {
    const svc = TestBed.inject(UserOrderService);
    svc.setOrder('c', ['c', 'a']);
    expect(svc.applyOrder('c', items('a', 'b', 'c'), key).map((item) => key(item))).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('drops a removed id silently (no hole)', () => {
    const svc = TestBed.inject(UserOrderService);
    svc.setOrder('c', ['c', 'x', 'a', 'b']);
    expect(svc.applyOrder('c', items('a', 'b', 'c'), key).map((item) => key(item))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('keys each container independently', () => {
    const svc = TestBed.inject(UserOrderService);
    svc.setOrder('rail:left', ['b', 'a']);
    expect(
      svc.applyOrder('content-tabs:x', items('a', 'b'), key).map((item) => key(item)),
    ).toEqual(['a', 'b']);
    expect(svc.applyOrder('rail:left', items('a', 'b'), key).map((item) => key(item))).toEqual([
      'b',
      'a',
    ]);
  });

  it('persists across reloads', () => {
    TestBed.inject(UserOrderService).setOrder('c', ['b', 'a']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(
      TestBed.inject(UserOrderService)
        .applyOrder('c', items('a', 'b'), key)
        .map((item) => key(item)),
    ).toEqual(['b', 'a']);
  });

  it('ignores a corrupted payload and survives unparseable storage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ c: 'nope', d: [1, 2], e: ['b', 'a'] }),
    );
    const svc = TestBed.inject(UserOrderService);
    expect(svc.applyOrder('c', items('a', 'b'), key).map((item) => key(item))).toEqual([
      'a',
      'b',
    ]);
    expect(svc.applyOrder('d', items('a', 'b'), key).map((item) => key(item))).toEqual([
      'a',
      'b',
    ]);
    expect(svc.applyOrder('e', items('a', 'b'), key).map((item) => key(item))).toEqual([
      'b',
      'a',
    ]);

    localStorage.setItem(STORAGE_KEY, '{broken');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(
      TestBed.inject(UserOrderService)
        .applyOrder('e', items('a', 'b'), key)
        .map((item) => key(item)),
    ).toEqual(['a', 'b']);
  });
});
