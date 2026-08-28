import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PluginStoreSettings } from './plugin-store-settings';
import { PLUGIN_CATALOG } from './catalog/plugin-catalog';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { PluginDeploymentService } from './lifecycle/plugin-deployment.service';
import { PluginStoreService } from './plugin-store.service';
import { DialogService } from '../dialog/dialog.service';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        settings: {
          storeDesc: 'Browse plugins desc',
          storeBrowse: 'Browse plugins',
          storeSearch: 'Search plugins',
          storeNoInstalled: 'Nothing installed',
          storeNoResults: 'No plugins match',
          storeUninstall: 'Uninstall',
          storeActionSettings: 'Open settings',
          storeActionEnable: 'Enable',
          storeActionDisable: 'Disable',
          storeBy: 'by {{author}}',
          storeProvidedBadge: 'Provided',
          storeProvidedHint: 'Provided by your organisation',
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('PluginStoreSettings', () => {
  afterEach(() => localStorage.clear());

  function render(open = vi.fn()) {
    TestBed.configureTestingModule({
      imports: [PluginStoreSettings, transloco()],
      providers: [
        {
          provide: PluginStoreService,
          useValue: { open } as unknown as PluginStoreService,
        },
        { provide: DialogService, useValue: {} as unknown as DialogService },
        {
          provide: PLUGIN_CATALOG,
          useValue: { load: () => Promise.resolve([]) },
        },
      ],
    });
    const fixture = TestBed.createComponent(PluginStoreSettings);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement, open };
  }

  it('opens the store dialog from the browse button', () => {
    const { host, open } = render();

    expect(host.textContent).toContain('Browse plugins desc');
    (host.querySelector('[data-testid="store-browse"]') as HTMLElement).click();

    expect(open).toHaveBeenCalled();
  });

  it('shows the installed plugins directly on the page, filtered by its own search field', async () => {
    const { fixture, host } = render();
    TestBed.inject(PluginInstallService).install({
      id: 'store.sample',
      name: 'Sample plugin',
      entryUrl: '/store/sample/plugin.html',
    });
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-testid="store-installed-store.sample"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="store-remove-store.sample"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="store-toggle-store.sample"]'),
    ).not.toBeNull();

    const search = host.querySelector(
      '[data-testid="store-settings-search"]',
    ) as HTMLInputElement;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(
      host.querySelector('[data-testid="store-installed-store.sample"]'),
    ).toBeNull();
    expect(host.textContent).toContain('No plugins match');
  });

  it('lists a deployed plugin as provided, without a way to turn it off or remove it', async () => {
    const { fixture, host } = render();
    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'treaties',
        name: 'Treaties',
        entryUrl: '/treaties/plugin.html',
        deployed: true,
      },
    ]);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-testid="store-installed-treaties"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="store-provided-treaties"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('Provided by your organisation');
    expect(
      host.querySelector('[data-testid="store-toggle-treaties"]'),
    ).toBeNull();
    expect(
      host.querySelector('[data-testid="store-remove-treaties"]'),
    ).toBeNull();
  });

  it('a deployed plugin does not make the empty state claim nothing is installed', async () => {
    const { fixture, host } = render();
    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'treaties',
        name: 'Treaties',
        entryUrl: '/treaties/plugin.html',
        deployed: true,
      },
    ]);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();

    const search = host.querySelector(
      '[data-testid="store-settings-search"]',
    ) as HTMLInputElement;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.textContent).toContain('No plugins match');
    expect(host.textContent).not.toContain('Nothing installed');
  });
});
