import { TestBed } from '@angular/core/testing';
import {
  PLUGIN_CATALOG,
  PluginCatalog,
  urlPluginCatalog,
} from './plugin-catalog';
import { providePluginCatalog } from './provide-plugin-catalog';
import { PluginCatalogEntries } from './plugin-catalog-entries';
import { PluginCatalogEntry } from './catalog-entry';
import { SettingsService } from '../../settings-dialog/settings.service';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';

vi.mock('penpal', () => ({
  connect: vi.fn(() => ({
    promise: new Promise(() => undefined),
    destroy: vi.fn(),
  })),
  WindowMessenger: vi.fn(),
}));

describe('urlPluginCatalog', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('rejects a foreign-origin catalog URL up front', () => {
    expect(() => urlPluginCatalog('https://evil.example/catalog.json')).toThrow(
      /same-origin/,
    );
  });

  it('fetches and parses defensively — junk, foreign-origin and unknown-capability entries drop', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'good',
            name: 'Good plugin',
            author: 'Jane Weaver',
            description: 'Does good things',
            version: '1.0.0',
            downloads: 42,
            updated: '2026-07-15',
            repository: 'https://example.com/good',
            readmeUrl: '/good/README.md',
            entryUrl: '/good/plugin.html',
            capabilities: ['ui', 'root-access'],
          },
          {
            id: 'evil',
            name: 'Evil',
            entryUrl: 'https://evil.example/plugin.html',
          },
          { id: '', entryUrl: '/x/plugin.html' },
          'junk',
        ]),
    }) as unknown as typeof fetch;

    const entries = await urlPluginCatalog('/plugins/catalog.json').load();

    expect(entries).toEqual([
      {
        id: 'good',
        name: 'Good plugin',
        author: 'Jane Weaver',
        description: 'Does good things',
        version: '1.0.0',
        downloads: 42,
        updated: '2026-07-15',
        repository: 'https://example.com/good',
        readmeUrl: '/good/README.md',
        entryUrl: '/good/plugin.html',
        capabilities: ['ui'],
        icon: undefined,
      },
    ]);
  });

  it('drops a foreign-origin readmeUrl, a non-http repository and a junk download count — the entry stays', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'odd',
            name: 'Odd plugin',
            entryUrl: '/odd/plugin.html',
            readmeUrl: 'https://evil.example/README.md',
            repository: 'javascript:alert(1)',
            downloads: -5,
          },
        ]),
    }) as unknown as typeof fetch;

    const [entry] = await urlPluginCatalog('/plugins/catalog.json').load();

    expect(entry.id).toBe('odd');
    expect(entry.readmeUrl).toBeUndefined();
    expect(entry.repository).toBeUndefined();
    expect(entry.downloads).toBeUndefined();
  });

  it('names each entry it drops from the catalogue at an address in the console, once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'good', name: 'Good', entryUrl: '/good/plugin.html' },
          { id: 'evil', entryUrl: 'https://evil.example/plugin.html' },
        ]),
    }) as unknown as typeof fetch;
    const catalog = urlPluginCatalog('/plugins/catalog.json');

    await catalog.load();
    await catalog.load();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('"evil"');
    warn.mockRestore();
  });

  it('throws on a non-ok catalog response', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    await expect(
      urlPluginCatalog('/plugins/catalog.json').load(),
    ).rejects.toThrow(/404/);
  });
});

describe('providePluginCatalog', () => {
  afterEach(() => {
    for (const frame of document.querySelectorAll('iframe')) {
      frame.remove();
    }
    localStorage.clear();
  });

  function configure(
    catalog: PluginCatalog,
    options?: { title?: string },
  ): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentTabsService, useValue: {} },
        { provide: MenuService, useValue: {} },
        ...providePluginCatalog(catalog, options),
      ],
    });
  }

  it('registers the store settings section', () => {
    const catalog: PluginCatalog = { load: () => Promise.resolve([]) };
    configure(catalog);

    expect(TestBed.inject(PLUGIN_CATALOG)).toBe(catalog);
    expect(
      TestBed.inject(SettingsService)
        .all()
        .map((section) => section.id),
    ).toContain('shell.pluginStore');
  });

  it('brands the store section title per distribution via options.title', () => {
    configure(
      { load: () => Promise.resolve([]) },
      { title: 'product.marketplace' },
    );

    const store = TestBed.inject(SettingsService)
      .all()
      .find((section) => section.id === 'shell.pluginStore');

    expect(store?.title).toBe('product.marketplace');
  });

  it("entries from a product's own catalogue port are read as defensively as those from an address", async () => {
    configure({
      load: () =>
        Promise.resolve([
          { id: 'good', name: 'Good', entryUrl: '/good/plugin.html' },
          {
            id: 'foreign',
            name: 'Foreign',
            entryUrl: 'https://evil.example/plugin.html',
            deployed: true,
          },
          { id: 'shell.fake', name: 'Fake', entryUrl: '/fake/plugin.html' },
          {
            id: 'caps',
            name: 'Caps',
            entryUrl: '/caps/plugin.html',
            capabilities: ['contributions', 'root-access'],
          },
          'junk',
        ] as unknown as PluginCatalogEntry[]),
    });
    const catalog = TestBed.inject(PluginCatalogEntries);

    const entries = await catalog.load();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();

    expect(
      [...document.querySelectorAll('iframe')].map((frame) =>
        frame.getAttribute('src'),
      ),
    ).toEqual([]);
    expect(entries.map((entry) => entry.id)).toEqual(['good', 'caps']);
    expect(entries[1].capabilities).toEqual(['contributions']);
    expect(catalog.entries()).toEqual(entries);
  });

  it("names each entry it drops from a product's own catalogue port in the console, once", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    configure({
      load: () =>
        Promise.resolve([
          { id: 'good', name: 'Good', entryUrl: '/good/plugin.html' },
          {
            id: 'foreign',
            name: 'Foreign',
            entryUrl: 'https://evil.example/plugin.html',
          },
          { id: 'shell.fake', name: 'Fake', entryUrl: '/fake/plugin.html' },
          'junk',
        ] as unknown as PluginCatalogEntry[]),
    });
    const catalog = TestBed.inject(PluginCatalogEntries);

    await catalog.load();
    await catalog.load();

    const said = warn.mock.calls.map(([message]) => String(message));
    expect(said).toHaveLength(3);
    expect(said[0]).toContain('"foreign"');
    expect(said[1]).toContain('"shell.fake"');
    expect(said[2]).toContain('entry 4');
    warn.mockRestore();
  });

  it('activates the sandbox runtime so a persisted install spawns without any composed plugin', () => {
    localStorage.setItem(
      'lw.shell.installed-plugins',
      JSON.stringify([{ id: 'p9', name: 'P9', entryUrl: '/p9/plugin.html' }]),
    );
    configure({ load: () => Promise.resolve([]) });

    TestBed.inject(SettingsService);

    expect(document.querySelector('iframe')?.getAttribute('src')).toContain(
      '/p9/plugin.html',
    );
  });
});
