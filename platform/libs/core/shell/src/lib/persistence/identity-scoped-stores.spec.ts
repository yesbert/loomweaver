import { TestBed } from '@angular/core/testing';
import {
  DEVICE_LEVEL_KEYS,
  provideIdentityScopedStores,
} from './identity-scoped-stores';
import { BootLatchedIdentity, IdentityScopedStore } from './boot-latched-scope';
import { KeyValueStore, LocalStorageStore } from './key-value-store';
import { SETTINGS_STORE } from './settings-store';
import { WORKING_STATE_STORE } from './working-state-store';

describe('IdentityScopedStore', () => {
  let identity: string | null;

  beforeEach(() => {
    localStorage.clear();
    identity = null;
  });

  const create = (options?: {
    deviceKeys?: readonly string[];
    store?: KeyValueStore;
    latch?: BootLatchedIdentity;
  }) =>
    new IdentityScopedStore(
      options?.store ?? new LocalStorageStore(),
      options?.latch ?? new BootLatchedIdentity(() => identity),
      new Set(options?.deviceKeys ?? DEVICE_LEVEL_KEYS),
    );

  it('leaves keys unscoped while anonymous', async () => {
    const store = create();
    await store.set('lw.shell.pane-trees', 'anon');
    expect(localStorage.getItem('lw.shell.pane-trees')).toBe('anon');
    await expect(store.get('lw.shell.pane-trees')).resolves.toBe('anon');
  });

  it('prefixes identity-level keys per signed-in identity', async () => {
    const store = create();
    identity = 'ada';
    await store.set('lw.shell.pane-trees', 'adas layout');
    expect(localStorage.getItem('lw.id.ada:lw.shell.pane-trees')).toBe(
      'adas layout',
    );
    expect(localStorage.getItem('lw.shell.pane-trees')).toBeNull();
  });

  it('separates two identities and the anonymous namespace across boots', async () => {
    identity = 'ada';
    await create().set('lw.shell.workspaces', 'ada');
    identity = 'grace';
    await create().set('lw.shell.workspaces', 'grace');
    await expect(create().get('lw.shell.workspaces')).resolves.toBe('grace');
    identity = 'ada';
    await expect(create().get('lw.shell.workspaces')).resolves.toBe('ada');
    identity = null;
    await expect(create().get('lw.shell.workspaces')).resolves.toBeUndefined();
  });

  it('latches the identity per boot: a live subject switch keeps writing to the first namespace', async () => {
    const store = create();
    identity = 'ada';
    await store.set('lw.shell.pane-trees', 'adas layout');
    identity = 'grace';
    await store.set('lw.shell.pane-trees', 'written mid-switch');
    expect(localStorage.getItem('lw.id.ada:lw.shell.pane-trees')).toBe(
      'written mid-switch',
    );
    expect(localStorage.getItem('lw.id.grace:lw.shell.pane-trees')).toBeNull();
    await expect(create().get('lw.shell.pane-trees')).resolves.toBeUndefined();
  });

  it('re-latches once on the anonymous-to-first-sign-in upgrade', async () => {
    const store = create();
    await store.set('lw.shell.workspaces', 'anon');
    identity = 'ada';
    await store.set('lw.shell.workspaces', 'adas');
    expect(localStorage.getItem('lw.shell.workspaces')).toBe('anon');
    expect(localStorage.getItem('lw.id.ada:lw.shell.workspaces')).toBe('adas');
  });

  it('stays latched after sign-out', async () => {
    const store = create();
    identity = 'ada';
    await store.set('lw.shell.workspaces', 'adas');
    identity = null;
    await store.set('lw.shell.workspaces', 'post-sign-out');
    expect(localStorage.getItem('lw.id.ada:lw.shell.workspaces')).toBe(
      'post-sign-out',
    );
    expect(localStorage.getItem('lw.shell.workspaces')).toBeNull();
  });

  it('peek follows the latch, not the live identity', () => {
    const store = create();
    identity = 'ada';
    localStorage.setItem('lw.id.ada:lw.shell.panel-sizes', 'adas');
    expect(store.peek?.('lw.shell.panel-sizes')).toBe('adas');
    identity = 'grace';
    expect(store.peek?.('lw.shell.panel-sizes')).toBe('adas');
  });

  it('keeps device-level keys unscoped regardless of identity', async () => {
    const store = create();
    identity = 'ada';
    for (const key of DEVICE_LEVEL_KEYS) {
      await store.set(key, 'shared');
      expect(localStorage.getItem(key)).toBe('shared');
    }
    identity = null;
    await expect(store.get('lw.shell.theme')).resolves.toBe('shared');
  });

  it('a custom deviceKeys list replaces the default', async () => {
    const store = create({ deviceKeys: ['my.device-key'] });
    identity = 'ada';
    await store.set('my.device-key', 'shared');
    await store.set('lw.shell.theme', 'scoped');
    expect(localStorage.getItem('my.device-key')).toBe('shared');
    expect(localStorage.getItem('lw.id.ada:lw.shell.theme')).toBe('scoped');
  });

  it('encodes an identity that carries delimiter characters', async () => {
    const store = create();
    identity = 'tenant:a/user b';
    await store.set('lw.shell.workspaces', 'v');
    expect(
      localStorage.getItem('lw.id.tenant%3Aa%2Fuser%20b:lw.shell.workspaces'),
    ).toBe('v');
  });

  it('treats an empty-string identity as anonymous', async () => {
    const store = create();
    identity = '';
    await store.set('lw.shell.workspaces', 'v');
    expect(localStorage.getItem('lw.shell.workspaces')).toBe('v');
  });

  it('deletes within the active namespace only', async () => {
    identity = 'ada';
    await create().set('lw.shell.workspaces', 'ada');
    identity = null;
    const anonStore = create();
    await anonStore.set('lw.shell.workspaces', 'anon');
    await anonStore.delete('lw.shell.workspaces');
    identity = 'ada';
    await expect(create().get('lw.shell.workspaces')).resolves.toBe('ada');
  });

  it('peeks through the scoped key when the inner store peeks', () => {
    const store = create();
    identity = 'ada';
    localStorage.setItem('lw.id.ada:lw.shell.panel-sizes', 'peeked');
    expect(store.peek?.('lw.shell.panel-sizes')).toBe('peeked');
  });

  it('offers no peek when the inner store has none', () => {
    const asyncOnly: KeyValueStore = {
      get: () => Promise.resolve('async'),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
    const store = create({ store: asyncOnly });
    expect(store.peek).toBeUndefined();
  });

  it('delegates get/set/delete to a custom inner store with scoped keys', async () => {
    const writes: string[] = [];
    const inner: KeyValueStore = {
      get: (key) => Promise.resolve(key),
      set: (key) => {
        writes.push(key);
        return Promise.resolve();
      },
      delete: (key) => {
        writes.push(`del:${key}`);
        return Promise.resolve();
      },
    };
    const store = create({ store: inner });
    identity = 'ada';
    await store.set('lw.shell.item-order', 'v');
    await store.delete('lw.shell.item-order');
    await expect(store.get('lw.shell.item-order')).resolves.toBe(
      'lw.id.ada:lw.shell.item-order',
    );
    expect(writes).toEqual([
      'lw.id.ada:lw.shell.item-order',
      'del:lw.id.ada:lw.shell.item-order',
    ]);
  });

  it('two stores sharing one latch scope to the same identity', async () => {
    const latch = new BootLatchedIdentity(() => identity);
    const settings = create({ latch });
    const workingState = create({ latch });
    identity = 'ada';
    await settings.set('lw.shell.workspaces', 'adas');
    identity = 'grace';
    await workingState.set('lw.shell.pane-trees', 'layout');
    expect(localStorage.getItem('lw.id.ada:lw.shell.pane-trees')).toBe(
      'layout',
    );
    expect(localStorage.getItem('lw.id.grace:lw.shell.pane-trees')).toBeNull();
  });
});

describe('provideIdentityScopedStores', () => {
  beforeEach(() => localStorage.clear());

  it('provides the identity-scoping wrapper for both persistence ports', async () => {
    TestBed.configureTestingModule({
      providers: [provideIdentityScopedStores({ identity: () => 'ada' })],
    });
    await TestBed.inject(WORKING_STATE_STORE).set('lw.shell.pane-trees', '{}');
    await TestBed.inject(SETTINGS_STORE).set('lw.shell.workspaces', '[]');
    expect(localStorage.getItem('lw.id.ada:lw.shell.pane-trees')).toBe('{}');
    expect(localStorage.getItem('lw.id.ada:lw.shell.workspaces')).toBe('[]');
  });

  it('composes with a remote settings store while working state stays local', async () => {
    const writes = new Map<string, string>();
    const remote: KeyValueStore = {
      get: (key) => Promise.resolve(writes.get(key)),
      set: (key, value) => {
        writes.set(key, value);
        return Promise.resolve();
      },
      delete: (key) => {
        writes.delete(key);
        return Promise.resolve();
      },
    };
    TestBed.configureTestingModule({
      providers: [
        provideIdentityScopedStores({
          identity: () => 'ada',
          settingsStore: remote,
        }),
      ],
    });
    const settings = TestBed.inject(SETTINGS_STORE);
    await settings.set('lw.shell.workspaces', '[]');
    await settings.set('lw.shell.theme', 'dark');
    await TestBed.inject(WORKING_STATE_STORE).set('lw.shell.pane-trees', '{}');

    expect([...writes.keys()]).toEqual([
      'lw.id.ada:lw.shell.workspaces',
      'lw.shell.theme',
    ]);
    expect(localStorage.getItem('lw.id.ada:lw.shell.pane-trees')).toBe('{}');
    expect(settings.peek).toBeUndefined();
  });
});
