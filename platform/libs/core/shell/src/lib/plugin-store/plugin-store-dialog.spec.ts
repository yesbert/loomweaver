import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PluginStoreDialog } from './plugin-store-dialog';
import { PLUGIN_CATALOG, PluginCatalog } from './catalog/plugin-catalog';
import { PluginCatalogEntry } from './installed-plugin';
import { PluginEnablementService } from './lifecycle/plugin-enablement.service';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { DialogRef } from '../dialog/dialog-ref';
import { DialogService } from '../dialog/dialog.service';
import { SettingsService } from '../settings/settings.service';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        dialog: { close: 'Close' },
        settings: {
          pluginStore: 'Plugin store',
          storeSearch: 'Search plugins',
          storeNoResults: 'No plugins match',
          storeSelectHint: 'Select a plugin',
          storeInstalledBadge: 'Installed',
          storeBy: 'by {{author}}',
          storeDownloads: '{{count}} downloads',
          storeUpdated: 'updated {{date}}',
          storeRepository: 'Repository',
          storeInstall: 'Install',
          storeUninstall: 'Uninstall',
          storeInstallTitle: 'Install {{name}}?',
          storeConsent: '**{{name}}** requests the following permissions:',
          storeConsentNone: '**{{name}}** requests no permissions.',
          storeLoading: 'Loading',
          storeError: 'Catalog failed',
          storeEmpty: 'Catalog empty',
          capability: {
            ui: 'Show dialogs and messages',
            contributions: 'Contribute to the UI',
          },
          capabilityDesc: { ui: 'Toasts.', contributions: 'Register things.' },
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

const DEMO: PluginCatalogEntry = {
  id: 'store-full',
  name: 'Store demo',
  author: 'LoomWeaver Team',
  category: 'Productivity',
  description: 'Adds a dashboard tab.',
  version: '1.0.0',
  downloads: 12842,
  updated: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  repository: 'https://example.com/store-full',
  readmeUrl: '/store-full/README.md',
  iconUrl: '/store-full/icon.svg',
  entryUrl: '/store-full/plugin.html',
  capabilities: ['contributions', 'ui'],
};

const HELLO: PluginCatalogEntry = {
  id: 'store-minimal',
  name: 'Hello store',
  author: 'Jane Weaver',
  description: 'The smallest plugin.',
  downloads: 3417,
  entryUrl: '/store-minimal/plugin.html',
  capabilities: ['contributions'],
};

const originalFetch = globalThis.fetch;

async function render(
  catalog: PluginCatalog = { load: () => Promise.resolve([DEMO, HELLO]) },
  confirm = vi.fn().mockResolvedValue(true),
) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('# Store demo readme'),
  }) as unknown as typeof fetch;
  TestBed.configureTestingModule({
    imports: [PluginStoreDialog, transloco()],
    providers: [
      { provide: PLUGIN_CATALOG, useValue: catalog },
      { provide: DialogRef, useValue: new DialogRef() },
      {
        provide: DialogService,
        useValue: { confirm } as unknown as DialogService,
      },
    ],
  });
  const fixture = TestBed.createComponent(PluginStoreDialog);
  fixture.detectChanges();
  await settle();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement, confirm };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('PluginStoreDialog', () => {
  afterEach(() => {
    localStorage.clear();
    globalThis.fetch = originalFetch;
  });

  it('lists the catalog sorted by downloads with name, author, downloads, update date and description', async () => {
    const { host } = await render();

    const cards = [...host.querySelectorAll('[data-testid^="store-card-"]')];
    expect(cards.map((card) => card.getAttribute('data-testid'))).toEqual([
      'store-card-store-full',
      'store-card-store-minimal',
    ]);
    expect(cards[0].textContent).toContain('Store demo');
    expect(cards[0].textContent).toContain('by LoomWeaver Team');
    expect(cards[0].textContent).toContain('Productivity');
    expect(cards[0].textContent).toContain('downloads');
    expect(cards[0].textContent).toContain('updated 2 days ago');
    expect(cards[0].querySelector('lw-icon[name="download"]')).not.toBeNull();
    expect(cards[0].querySelector('img')?.getAttribute('src')).toBe(
      '/store-full/icon.svg',
    );
    expect(cards[0].textContent).toContain('Adds a dashboard tab.');
  });

  it('the installed tab lists installed plugins with settings, toggle and uninstall actions', async () => {
    const { fixture, host } = await render();
    const installs = TestBed.inject(PluginInstallService);
    const enablement = TestBed.inject(PluginEnablementService);
    installs.install(DEMO);
    TestBed.inject(SettingsService).register({
      id: 'store-full.prefs',
      title: 'Store demo',
      group: 'settings.group.community',
      rows: [],
    });
    const openSettings = vi
      .spyOn(TestBed.inject(SettingsService), 'open')
      .mockReturnValue(new DialogRef());

    (
      host.querySelector('[data-testid="store-tab-installed"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    const row = host.querySelector(
      '[data-testid="store-installed-store-full"]',
    ) as HTMLElement;
    expect(row.textContent).toContain('Store demo');
    expect(row.textContent).toContain('by LoomWeaver Team');
    expect(row.querySelector('img')?.getAttribute('src')).toBe(
      '/store-full/icon.svg',
    );

    (
      row.querySelector(
        '[data-testid="store-settings-store-full"]',
      ) as HTMLElement
    ).click();
    expect(openSettings).toHaveBeenCalledWith('store-full.prefs');

    (
      row.querySelector(
        '[data-testid="store-toggle-store-full"]',
      ) as HTMLElement
    ).click();
    expect(enablement.isEnabled('store-full')).toBe(false);

    (
      row.querySelector(
        '[data-testid="store-remove-store-full"]',
      ) as HTMLElement
    ).click();
    await settle();
    fixture.detectChanges();
    expect(installs.isInstalled('store-full')).toBe(false);
    expect(
      host.querySelector('[data-testid="store-installed-store-full"]'),
    ).toBeNull();
  });

  it('a plugin without a community settings section gets no gear action', async () => {
    const { fixture, host } = await render();
    TestBed.inject(PluginInstallService).install(HELLO);

    (
      host.querySelector('[data-testid="store-tab-installed"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-testid="store-installed-store-minimal"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="store-settings-store-minimal"]'),
    ).toBeNull();
  });

  it('filters the list by name, author and description', async () => {
    const { fixture, host } = await render();

    const search = host.querySelector(
      '[data-testid="store-search"]',
    ) as HTMLInputElement;
    search.value = 'jane';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cards = [...host.querySelectorAll('[data-testid^="store-card-"]')];
    expect(cards.map((card) => card.getAttribute('data-testid'))).toEqual([
      'store-card-store-minimal',
    ]);
  });

  it('shows the detail pane with repository link and fetches the README in-app', async () => {
    const { fixture, host } = await render();

    (
      host.querySelector('[data-testid="store-card-store-full"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    const detail = host.querySelector(
      '[data-testid="store-detail"]',
    ) as HTMLElement;
    expect(detail.textContent).toContain('Store demo');
    expect(detail.textContent).toContain('v1.0.0');
    const repository = detail.querySelector(
      '[data-testid="store-repository"]',
    ) as HTMLAnchorElement;
    expect(repository.getAttribute('href')).toBe(
      'https://example.com/store-full',
    );
    expect(repository.getAttribute('target')).toBe('_blank');
    expect(globalThis.fetch).toHaveBeenCalledWith('/store-full/README.md');
    const markdown = detail.querySelector('lw-markdown') as HTMLElement & {
      source?: string;
    };
    expect(markdown.source).toBe('# Store demo readme');
  });

  it('installs from the detail pane after consent and switches to uninstall', async () => {
    const { fixture, host, confirm } = await render();
    (
      host.querySelector('[data-testid="store-card-store-full"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    (
      host.querySelector(
        '[data-testid="store-install-store-full"]',
      ) as HTMLElement
    ).click();
    await settle();
    fixture.detectChanges();

    expect(confirm.mock.calls[0][0].icon).toBe('plugin');
    expect(TestBed.inject(PluginInstallService).isInstalled('store-full')).toBe(
      true,
    );
    expect(
      host.querySelector('[data-testid="store-uninstall-store-full"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="store-card-store-full"]')?.textContent,
    ).toContain('Installed');
  });

  it('does not install when consent is declined', async () => {
    const declined = vi.fn().mockResolvedValue(false);
    const { fixture, host } = await render(undefined, declined);
    (
      host.querySelector(
        '[data-testid="store-card-store-minimal"]',
      ) as HTMLElement
    ).click();
    fixture.detectChanges();

    (
      host.querySelector(
        '[data-testid="store-install-store-minimal"]',
      ) as HTMLElement
    ).click();
    await settle();

    expect(
      TestBed.inject(PluginInstallService).isInstalled('store-minimal'),
    ).toBe(false);
  });

  it('shows the error state when the catalog fails to load', async () => {
    const { host } = await render({
      load: () => Promise.reject(new Error('500')),
    });

    expect(host.querySelector('[data-testid="store-error"]')).not.toBeNull();
  });
});
