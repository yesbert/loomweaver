import { TestBed } from '@angular/core/testing';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { KeyValueStore } from '../../persistence/key-value-store';
import { InstalledPlugin } from './installed-plugin';
import { PluginDeploymentService } from './plugin-deployment.service';
import { PluginInstallService } from './plugin-install.service';
import { PluginEnablementService } from '../../plugin/enablement/plugin-enablement.service';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginStateService } from '../../plugin/plugin-state.service';

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

  it('a plugin removed while switched off starts enabled when it is installed again', () => {
    const service = make();
    const enablement = TestBed.inject(PluginEnablementService);
    service.install(entry());
    service.install(entry({ id: 'store.other', name: 'Other' }));
    enablement.setEnabled('store.sample', false);
    enablement.setEnabled('store.other', false);

    service.uninstall('store.sample');
    service.install(entry());

    expect(enablement.isEnabled('store.sample')).toBe(true);
    expect(enablement.isEnabled('store.other')).toBe(false);
  });

  it('a plugin removed with a capability withdrawn holds what its consent shows when it is installed again', () => {
    const service = make();
    const grants = TestBed.inject(CapabilityGrantService);
    service.install(entry());
    service.install(entry({ id: 'store.other', name: 'Other' }));
    grants.setGranted('store.sample', 'ui', false);
    grants.setGranted('store.other', 'ui', false);

    service.uninstall('store.sample');
    service.install(entry());
    grants.register('store.sample', ['contributions', 'ui'], ['contributions', 'ui']);
    grants.register('store.other', ['contributions', 'ui'], ['contributions', 'ui']);

    expect(grants.isGranted('store.sample', 'ui')).toBe(true);
    expect(grants.isGranted('store.other', 'ui')).toBe(false);
  });

  it('removing a stored install whose id a composed or deployed plugin holds leaves that plugin\'s state, switch-off and revocations alone', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        entry({ id: 'composed' }),
        entry({ id: 'deployed' }),
      ]),
    );
    const service = make();
    service.markComposed(['composed']);
    TestBed.inject(PluginDeploymentService).adopt([
      { ...entry({ id: 'deployed' }), deployed: true },
    ]);
    const enablement = TestBed.inject(PluginEnablementService);
    const grants = TestBed.inject(CapabilityGrantService);
    for (const id of ['composed', 'deployed']) {
      enablement.setEnabled(id, false);
      grants.setGranted(id, 'ui', false);
    }

    const removeState = vi.spyOn(
      TestBed.inject(PluginStateService),
      'removePlugin',
    );

    service.uninstall('composed');
    service.uninstall('deployed');

    expect(removeState).not.toHaveBeenCalled();
    expect(service.installed()).toEqual([]);
    expect(
      JSON.parse(localStorage.getItem('lw.shell.disabled-plugins') ?? '[]'),
    ).toEqual(['composed', 'deployed']);
    expect(
      JSON.parse(
        localStorage.getItem('lw.shell.capability-revocations') ?? '[]',
      ),
    ).toEqual(['composed:ui', 'deployed:ui']);
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

  it('refuses to install a plugin the operator deployed, and records nothing', () => {
    const service = make();
    TestBed.inject(PluginDeploymentService).adopt([
      { ...entry(), deployed: true },
    ]);

    expect(() => service.install(entry())).toThrow(/provided/);
    expect(service.isInstalled('store.sample')).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
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
