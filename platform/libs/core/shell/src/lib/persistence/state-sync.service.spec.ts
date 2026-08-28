import { TestBed } from '@angular/core/testing';
import { KeyValueStore } from './key-value-store';
import { SETTINGS_STORE } from './settings-store';
import { WORKING_STATE_STORE } from './working-state-store';
import { StateSyncChannel } from './state-sync-channel';
import { StateSyncService } from './state-sync.service';
import { ThemeService } from '../theme/theme.service';

class FakeChannel {
  posted: string[] = [];
  private listener: ((key: string) => void) | undefined;

  post(key: string): void {
    this.posted.push(key);
  }

  listen(listener: (key: string) => void): void {
    this.listener = listener;
  }

  whileApplying(apply: () => void): void {
    apply();
  }

  receive(key: string): void {
    this.listener?.(key);
  }
}

describe('StateSyncService', () => {
  let channel: FakeChannel;

  function configure(stores?: {
    settings?: KeyValueStore;
    workingState?: KeyValueStore;
  }) {
    channel = new FakeChannel();
    TestBed.configureTestingModule({
      providers: [
        { provide: StateSyncChannel, useValue: channel },
        ...(stores?.settings
          ? [{ provide: SETTINGS_STORE, useValue: stores.settings }]
          : []),
        ...(stores?.workingState
          ? [{ provide: WORKING_STATE_STORE, useValue: stores.workingState }]
          : []),
      ],
    });
    return TestBed.inject(StateSyncService);
  }

  function flush(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function stubStore(value: string): KeyValueStore {
    return {
      get: () => Promise.resolve(value),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
  }

  beforeEach(() => localStorage.clear());

  it('applies a remote change by reading the key back from the settings store', async () => {
    localStorage.setItem('k', 'fresh');
    const sync = configure();
    const seen: (string | undefined)[] = [];
    sync.register('settings', 'k', (raw) => seen.push(raw));

    channel.receive('k');
    await flush();

    expect(seen).toEqual(['fresh']);
  });

  it('reads a working-state registration back from the working-state store, not the settings store', async () => {
    const sync = configure({
      settings: stubStore('from-settings'),
      workingState: stubStore('from-working-state'),
    });
    const seen: (string | undefined)[] = [];
    sync.register('working-state', 'k', (raw) => seen.push(raw));

    channel.receive('k');
    await flush();

    expect(seen).toEqual(['from-working-state']);
  });

  it('an external registration never reads either store and applies undefined', async () => {
    const settingsGet = vi.fn(() => Promise.resolve('x'));
    const workingGet = vi.fn(() => Promise.resolve('y'));
    const sync = configure({
      settings: { ...stubStore(''), get: settingsGet },
      workingState: { ...stubStore(''), get: workingGet },
    });
    const seen: (string | undefined)[] = [];
    sync.register('external', 'product.session', (raw) => seen.push(raw));

    channel.receive('product.session');
    await flush();

    expect(seen).toEqual([undefined]);
    expect(settingsGet).not.toHaveBeenCalled();
    expect(workingGet).not.toHaveBeenCalled();
  });

  it('notifyRemoteChange runs the registered applier in this window', async () => {
    localStorage.setItem('k', 'pushed');
    const sync = configure();
    const seen: (string | undefined)[] = [];
    sync.register('settings', 'k', (raw) => seen.push(raw));

    sync.notifyRemoteChange('k');
    await flush();

    expect(seen).toEqual(['pushed']);
  });

  it('notifyRemoteChange is a no-op for keys without a registration', async () => {
    const sync = configure();

    sync.notifyRemoteChange('unknown');
    await flush();

    expect(channel.posted).toEqual([]);
  });

  it('register returns a disposer — a disposed applier no longer reacts', async () => {
    localStorage.setItem('k', 'fresh');
    const sync = configure();
    const apply = vi.fn();
    const dispose = sync.register('settings', 'k', apply);

    dispose();
    channel.receive('k');
    await flush();

    expect(apply).not.toHaveBeenCalled();
  });

  it('a stale disposer never removes a later re-registration (last one wins)', async () => {
    localStorage.setItem('k', 'fresh');
    const sync = configure();
    const stale = vi.fn();
    const current = vi.fn();
    const disposeStale = sync.register('settings', 'k', stale);
    sync.register('settings', 'k', current);

    disposeStale();
    channel.receive('k');
    await flush();

    expect(current).toHaveBeenCalledWith('fresh', 'k');
    expect(stale).not.toHaveBeenCalled();
  });

  it('registerPrefix returns a disposer — a disposed prefix applier no longer reacts', async () => {
    localStorage.setItem('lw.plugin-settings:p1:prefs', '{}');
    const sync = configure();
    const apply = vi.fn();
    const dispose = sync.registerPrefix(
      'settings',
      'lw.plugin-settings:',
      apply,
    );

    dispose();
    channel.receive('lw.plugin-settings:p1:prefs');
    await flush();

    expect(apply).not.toHaveBeenCalled();
  });

  it('ignores keys nobody registered', async () => {
    const sync = configure();
    const apply = vi.fn();
    sync.register('settings', 'k', apply);

    channel.receive('other');
    await flush();

    expect(apply).not.toHaveBeenCalled();
  });

  it('matches a registered prefix and passes the full key through', async () => {
    localStorage.setItem('lw.shell.view-state:outline', '{"sort":"alpha"}');
    const sync = configure();
    const seen: string[] = [];
    sync.registerPrefix('working-state', 'lw.shell.view-state:', (_raw, key) =>
      seen.push(key),
    );

    channel.receive('lw.shell.view-state:outline');
    await flush();

    expect(seen).toEqual(['lw.shell.view-state:outline']);
  });

  it('prefers an exact registration over a matching prefix', async () => {
    const sync = configure();
    const exact = vi.fn();
    const prefix = vi.fn();
    sync.registerPrefix('settings', 'lw.shell.', prefix);
    sync.register('settings', 'lw.shell.theme', exact);

    channel.receive('lw.shell.theme');
    await flush();

    expect(exact).toHaveBeenCalled();
    expect(prefix).not.toHaveBeenCalled();
  });

  it('announce posts a key for state persisted outside the ports', () => {
    const sync = configure();

    sync.announce('testbed.auth.principal');

    expect(channel.posted).toEqual(['testbed.auth.principal']);
  });

  it('survives a store that rejects the read-back', async () => {
    const sync = configure({
      settings: {
        get: () => Promise.reject(new Error('offline')),
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      },
    });
    const apply = vi.fn();
    sync.register('settings', 'k', apply);

    channel.receive('k');
    await flush();

    expect(apply).toHaveBeenCalledWith(undefined, 'k');
  });

  it('a synced service adopts the other window value without writing it back', async () => {
    configure();
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('system');

    localStorage.setItem('lw.shell.theme', 'dark');
    channel.receive('lw.shell.theme');
    await flush();

    expect(theme.mode()).toBe('dark');
    expect(channel.posted).toEqual([]);
  });
});
