import { TestBed } from '@angular/core/testing';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { KeyValueStore } from '../../persistence/key-value-store';
import { InstalledPlugin } from '../installed-plugin';
import { PluginInstallService } from './plugin-install.service';

const KEY = 'lw.shell.installed-plugins';

function entry(overrides: Partial<InstalledPlugin> = {}): InstalledPlugin {
  return {
    id: 'store.sample',
    name: 'Sample',
    entryUrl: '/store/sample/plugin.html',
    capabilities: ['contributions', 'ui'],
    ...overrides,
  };
}

function make() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(PluginInstallService);
}

function makeWith(store: KeyValueStore) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SETTINGS_STORE, useValue: store }],
  });
  return TestBed.inject(PluginInstallService);
}

describe('PluginInstallService', () => {
  afterEach(() => localStorage.clear());

  it('installs a catalog entry and persists it through the settings store', () => {
    const service = make();

    service.install(entry());

    expect(service.isInstalled('store.sample')).toBe(true);
    expect(service.installed()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual([entry()]);
  });

  it('re-applies persisted installs on construction and filters junk shapes', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        entry(),
        { id: '', entryUrl: '/x/plugin.html' },
        { id: 'no-url' },
        'junk',
        entry({ id: 'store.sample' }),
      ]),
    );
    const service = make();

    expect(service.installed().map((plugin) => plugin.id)).toEqual([
      'store.sample',
    ]);
  });

  it('drops a persisted entry whose entryUrl is not same-origin', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        entry({ id: 'evil', entryUrl: 'https://evil.example/plugin.html' }),
      ]),
    );
    const service = make();

    expect(service.installed()).toHaveLength(0);
  });

  it('filters unknown capability names from a persisted entry', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([entry({ capabilities: ['ui', 'root-access'] as never })]),
    );
    const service = make();

    expect(service.installed()[0].capabilities).toEqual(['ui']);
  });

  it('rejects installing a foreign-origin entryUrl', () => {
    const service = make();

    expect(() =>
      service.install(entry({ entryUrl: 'https://evil.example/plugin.html' })),
    ).toThrow(/same-origin/);
    expect(service.installed()).toHaveLength(0);
  });

  it('rejects installing an id that is part of the composition', () => {
    const service = make();
    service.markComposed(['sandbox-rpc']);

    expect(() => service.install(entry({ id: 'sandbox-rpc' }))).toThrow(
      /composition/,
    );
  });

  it('rejects installing an already installed id', () => {
    const service = make();
    service.install(entry());

    expect(() => service.install(entry())).toThrow(/already installed/);
  });

  it('uninstall removes the entry, persists, and is idempotent', () => {
    const service = make();
    service.install(entry());

    service.uninstall('store.sample');

    expect(service.isInstalled('store.sample')).toBe(false);
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual([]);
    expect(() => service.uninstall('store.sample')).not.toThrow();
  });

  it('updates an installed entry in place and persists the new declaration', () => {
    const service = make();
    service.install(entry({ version: '1.0.0' }));

    service.update(
      entry({
        version: '2.0.0',
        entryUrl: '/store/sample/v2/plugin.html',
        capabilities: ['contributions', 'ui', 'navigation'],
      }),
    );

    expect(service.byId('store.sample')?.version).toBe('2.0.0');
    expect(service.byId('store.sample')?.capabilities).toEqual([
      'contributions',
      'ui',
      'navigation',
    ]);
    expect(service.installed()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')[0].entryUrl).toBe(
      '/store/sample/v2/plugin.html',
    );
  });

  it('refuses to update an entry that is not installed or points off-origin', () => {
    const service = make();

    expect(() => service.update(entry())).toThrow(/not installed/);

    service.install(entry());
    expect(() =>
      service.update(entry({ entryUrl: 'https://evil.example/plugin.html' })),
    ).toThrow(/same-origin/);
    expect(service.byId('store.sample')?.entryUrl).toBe(
      '/store/sample/plugin.html',
    );
  });

  it('hydrates from a peek-less store and survives one that rejects', async () => {
    const hydrated = makeWith({
      get: () => Promise.resolve(JSON.stringify([entry()])),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(hydrated.isInstalled('store.sample')).toBe(true);

    const service = makeWith({
      get: () => Promise.reject(new Error('401')),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(service.installed()).toHaveLength(0);
  });
});
