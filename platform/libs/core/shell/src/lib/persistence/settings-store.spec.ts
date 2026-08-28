import { TestBed } from '@angular/core/testing';
import { KeyValueStore, LocalStorageStore } from './key-value-store';
import { SETTINGS_STORE, provideSettingsStore } from './settings-store';
import {
  WORKING_STATE_STORE,
  provideWorkingStateStore,
} from './working-state-store';
import {
  DEFAULT_PANEL_WIDTH,
  PanelSizeService,
} from '../regions/panel/panel-size.service';
import { ActiveWorkspaceService } from '../workspace/active-workspace.service';

describe('LocalStorageStore', () => {
  let store: LocalStorageStore;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageStore();
  });

  it('round-trips a value (peek is synchronous, get is async)', async () => {
    await store.set('k', 'v');
    expect(store.peek('k')).toBe('v');
    expect(localStorage.getItem('k')).toBe('v');
    await expect(store.get('k')).resolves.toBe('v');
  });

  it('returns undefined for a missing key', async () => {
    expect(store.peek('missing')).toBeUndefined();
    await expect(store.get('missing')).resolves.toBeUndefined();
  });

  it('deletes a value', async () => {
    await store.set('k', 'v');
    await store.delete('k');
    expect(store.peek('k')).toBeUndefined();
  });

  it('is best-effort when writing throws (private browsing / quota)', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
    await expect(store.set('k', 'v')).resolves.toBeUndefined();
    spy.mockRestore();
  });
});

describe('SETTINGS_STORE token', () => {
  it('defaults to localStorage-backed persistence with no wiring', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    const store = TestBed.inject(SETTINGS_STORE);
    await store.set('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
    expect(store.peek?.('k')).toBe('v');
  });

  it('provideSettingsStore overrides the default (last provider wins)', async () => {
    const writes: string[] = [];
    const custom: KeyValueStore = {
      get: () => Promise.resolve('from-custom'),
      set: (key) => {
        writes.push(key);
        return Promise.resolve();
      },
      delete: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideSettingsStore(custom)],
    });
    const store = TestBed.inject(SETTINGS_STORE);
    await store.set('k', 'v');
    await expect(store.get('k')).resolves.toBe('from-custom');
    expect(writes).toEqual(['k']);
  });

  it('keeps a peek-less store peek-less (async hydration must stay detectable)', () => {
    const custom: KeyValueStore = {
      get: () => Promise.resolve(undefined),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideSettingsStore(custom)],
    });
    expect(TestBed.inject(SETTINGS_STORE).peek).toBeUndefined();
  });
});

describe('WORKING_STATE_STORE token', () => {
  it('defaults to localStorage-backed persistence with no wiring', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    const store = TestBed.inject(WORKING_STATE_STORE);
    await store.set('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
    expect(store.peek?.('k')).toBe('v');
  });

  it('is a port of its own: overriding it leaves the settings store untouched', async () => {
    const writes: string[] = [];
    const custom: KeyValueStore = {
      get: () => Promise.resolve(undefined),
      set: (key) => {
        writes.push(key);
        return Promise.resolve();
      },
      delete: () => Promise.resolve(),
    };
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(custom)],
    });
    await TestBed.inject(WORKING_STATE_STORE).set('lw.shell.pane-trees', '{}');
    await TestBed.inject(SETTINGS_STORE).set('lw.shell.theme', 'dark');

    expect(writes).toEqual(['lw.shell.pane-trees']);
    expect(localStorage.getItem('lw.shell.theme')).toBe('dark');
    expect(localStorage.getItem('lw.shell.pane-trees')).toBeNull();
  });
});

describe('async hydration (a network-backed store has no peek)', () => {
  it('a persistence service starts at its default, then reconciles once the store hydrates', async () => {
    const asyncStore: KeyValueStore = {
      get: (key) =>
        Promise.resolve(
          key === 'lw.shell.panel-sizes'
            ? JSON.stringify({ primary: 320 })
            : undefined,
        ),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(asyncStore)],
    });

    const size = TestBed.inject(PanelSizeService);
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH);

    await TestBed.inject(ActiveWorkspaceService).ready;
    await Promise.resolve();
    expect(size.width('primary')).toBe(320);
  });
});
