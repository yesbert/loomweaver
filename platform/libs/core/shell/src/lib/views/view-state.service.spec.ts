import { TestBed } from '@angular/core/testing';
import { ViewStateService } from './view-state.service';
import { KeyValueStore } from '../persistence/key-value-store';
import { provideWorkingStateStore } from '../persistence/working-state-store';

const KEY = 'lw.shell.view-state:v1';

describe('ViewStateService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('a fresh instance reads undefined and carries its id', () => {
    const handle = TestBed.inject(ViewStateService).handle('v1');
    expect(handle.value()).toBeUndefined();
    expect(handle.instanceId).toBe('v1');
  });

  it('set updates value immediately and persists after the debounce', () => {
    vi.useFakeTimers();
    const handle = TestBed.inject(ViewStateService).handle('v1');

    handle.set({ sort: 'alpha' });
    expect(handle.value()).toEqual({ sort: 'alpha' });
    expect(localStorage.getItem(KEY)).toBeNull();

    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ sort: 'alpha' }));
  });

  it('collapses rapid writes into a single persist', () => {
    vi.useFakeTimers();
    const handle = TestBed.inject(ViewStateService).handle('v1');
    handle.set({ n: 1 });
    handle.set({ n: 2 });
    handle.set({ n: 3 });
    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ n: 3 }));
  });

  it('restores a persisted blob synchronously via peek', () => {
    localStorage.setItem(KEY, JSON.stringify({ sort: 'alpha' }));
    expect(TestBed.inject(ViewStateService).handle('v1').value()).toEqual({
      sort: 'alpha',
    });
  });

  it('ignores a corrupted blob', () => {
    localStorage.setItem(KEY, '{not json');
    expect(
      TestBed.inject(ViewStateService).handle('v1').value(),
    ).toBeUndefined();
  });

  it('shares one cached handle per instance id', () => {
    const service = TestBed.inject(ViewStateService);
    service.handle('v1').set({ a: 1 });
    expect(service.handle('v1').value()).toEqual({ a: 1 });
  });

  it('clear cancels a pending save so the removed key is not resurrected', () => {
    vi.useFakeTimers();
    const service = TestBed.inject(ViewStateService);
    const handle = service.handle('v1');

    handle.set({ sort: 'alpha' });
    service.clear('v1');
    expect(localStorage.getItem(KEY)).toBeNull();

    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('reset clears a live handle reactively and deletes the persisted blob', () => {
    vi.useFakeTimers();
    localStorage.setItem(KEY, JSON.stringify({ sort: 'alpha' }));
    const service = TestBed.inject(ViewStateService);
    const handle = service.handle('v1');
    expect(handle.value()).toEqual({ sort: 'alpha' });

    handle.set({ sort: 'z' });
    service.reset('v1');
    expect(handle.value()).toBeUndefined();
    expect(localStorage.getItem(KEY)).toBeNull();

    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('reset without a live handle just deletes the persisted blob', () => {
    localStorage.setItem(KEY, JSON.stringify({ sort: 'alpha' }));
    TestBed.inject(ViewStateService).reset('v1');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('hydrates asynchronously when the store has no peek (network-backed)', async () => {
    const asyncStore: KeyValueStore = {
      get: (key) =>
        Promise.resolve(
          key === KEY ? JSON.stringify({ sort: 'alpha' }) : undefined,
        ),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(asyncStore)],
    });

    const handle = TestBed.inject(ViewStateService).handle('v1');
    expect(handle.value()).toBeUndefined();

    await Promise.resolve();
    expect(handle.value()).toEqual({ sort: 'alpha' });
  });
});
