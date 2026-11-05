import { TestBed } from '@angular/core/testing';
import { UserOrderService } from './user-order.service';
import { KeyValueStore } from '../../persistence/key-value-store';
import { provideWorkingStateStore } from '../../persistence/working-state-store';

const STORAGE_KEY = 'lw.shell.item-order';
const key = (item: { id: string }) => item.id;
const items = (...ids: string[]) => ids.map((id) => ({ id }));

class HandAnsweredStore implements KeyValueStore {
  readonly written = new Map<string, string>();
  private readonly waiting: ((raw: string | undefined) => void)[] = [];

  get(): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  set(key: string, value: string): Promise<void> {
    this.written.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.written.delete(key);
    return Promise.resolve();
  }

  async answer(raw: string | undefined): Promise<void> {
    for (const resolve of this.waiting.splice(0)) {
      resolve(raw);
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

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

describe('UserOrderService on a store that answers later', () => {
  it('keeps an order made before the store answered, beside the orders the store held', async () => {
    const store = new HandAnsweredStore();
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(store)],
    });
    const order = TestBed.inject(UserOrderService);
    const idsIn = (container: string) =>
      order.applyOrder(container, items('a', 'b'), key).map((item) => key(item));

    order.setOrder('rail', ['b', 'a']);
    await store.answer(JSON.stringify({ bar: ['b', 'a'] }));

    expect(idsIn('rail')).toEqual(['b', 'a']);
    expect(idsIn('bar')).toEqual(['b', 'a']);
    expect(JSON.parse(store.written.get(STORAGE_KEY) ?? '{}')).toEqual({
      rail: ['b', 'a'],
      bar: ['b', 'a'],
    });
  });
});
