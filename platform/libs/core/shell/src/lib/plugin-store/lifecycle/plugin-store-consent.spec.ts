import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../../dialog/dialog.service';
import { InstalledPlugin } from './installed-plugin';
import { PluginCatalogEntry } from '../catalog/catalog-entry';
import { PluginDisableGuard } from '../../plugin/enablement/plugin-disable-guard';
import { PluginInstallService } from './plugin-install.service';
import { PluginStoreConsent } from './plugin-store-consent';
import {
  defineLwMarkdown,
  LW_MARKDOWN_TAG,
} from '../../elements/markdown/lw-markdown.element';

const installed: InstalledPlugin = {
  id: 'testbed',
  name: 'Demo',
  entryUrl: '/demo/plugin.html',
  version: '1.2.0',
  capabilities: ['ui'],
};

const entry: PluginCatalogEntry = {
  ...installed,
  version: '1.3.0',
} as PluginCatalogEntry;

function fakeDeps(options: {
  removalAllowed: boolean;
  consentAccepted?: boolean;
}) {
  const update = vi.fn();
  const confirmRemoval = vi.fn(() => Promise.resolve(options.removalAllowed));
  const confirm = vi.fn(() => Promise.resolve(options.consentAccepted ?? true));
  TestBed.configureTestingModule({
    providers: [
      { provide: DialogService, useValue: { confirm } },
      {
        provide: TranslocoService,
        useValue: { translate: (key: string) => key },
      },
      {
        provide: PluginInstallService,
        useValue: { byId: () => installed, update },
      },
      { provide: PluginDisableGuard, useValue: { confirmRemoval } },
    ],
  });
  const consent = TestBed.inject(PluginStoreConsent);
  return { consent, update, confirmRemoval, confirm };
}

describe('PluginStoreConsent.confirmUpdate (updates respawn the plugin)', () => {
  it('runs the unsaved-changes guard and aborts the update when the user cancels', async () => {
    const { consent, update, confirmRemoval } = fakeDeps({
      removalAllowed: false,
    });

    await consent.confirmUpdate(entry);

    expect(confirmRemoval).toHaveBeenCalledWith('testbed');
    expect(update).not.toHaveBeenCalled();
  });

  it('updates once the guard passes', async () => {
    const { consent, update } = fakeDeps({ removalAllowed: true });

    await consent.confirmUpdate(entry);

    expect(update).toHaveBeenCalledWith(entry);
  });

  it('a declined capability consent never reaches the guard', async () => {
    const { consent, update, confirmRemoval } = fakeDeps({
      removalAllowed: true,
      consentAccepted: false,
    });
    const grown: PluginCatalogEntry = {
      ...entry,
      capabilities: ['ui', 'navigation'],
    } as PluginCatalogEntry;

    await consent.confirmUpdate(grown);

    expect(confirmRemoval).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('PluginStoreConsent and the isolation level', () => {
  it('names the level the plugin will run at when asking to install it', async () => {
    const { consent, confirm } = fakeDeps({ removalAllowed: true });
    const install = vi.fn();
    TestBed.inject(PluginInstallService).install = install;

    await consent.confirmInstall({ ...entry, level: 'embedded' } as PluginCatalogEntry);

    const asked = confirm.mock.calls[0] as unknown as [{ message: string }];
    expect(asked[0].message).toContain('settings.pluginLevel.embedded');
  });

  it('names the default level where an entry states none', async () => {
    const { consent, confirm } = fakeDeps({ removalAllowed: true });
    TestBed.inject(PluginInstallService).install = vi.fn();

    await consent.confirmInstall(entry);

    const asked = confirm.mock.calls[0] as unknown as [{ message: string }];
    expect(asked[0].message).toContain('settings.pluginLevel.isolated');
  });

  it('asks again when an update raises the level, even with no new capability', async () => {
    const { consent, confirm, update } = fakeDeps({
      removalAllowed: true,
      consentAccepted: false,
    });

    await consent.confirmUpdate({ ...entry, level: 'embedded' } as PluginCatalogEntry);

    expect(confirm).toHaveBeenCalledTimes(1);
    const asked = confirm.mock.calls[0] as unknown as [{ message: string }];
    expect(asked[0].message).toContain('settings.pluginLevel.embedded');
    expect(update).not.toHaveBeenCalled();
  });

  it('updates without asking where the level and the capabilities stay as agreed', async () => {
    const { consent, confirm, update } = fakeDeps({ removalAllowed: true });

    await consent.confirmUpdate(entry);

    expect(confirm).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});

describe('PluginStoreConsent and what a catalogue entry says about itself', () => {
  beforeAll(() => defineLwMarkdown());
  afterEach(() => document.body.replaceChildren());

  function drawn(message: string): HTMLElement {
    const element = document.createElement(LW_MARKDOWN_TAG);
    element.setAttribute('source', message);
    document.body.append(element);
    return element;
  }

  function consentNaming() {
    const deps = fakeDeps({ removalAllowed: true });
    const transloco = TestBed.inject(TranslocoService);
    transloco.translate = ((key: string, params?: { name?: string }) =>
      params?.name === undefined
        ? key
        : `**${params.name}** ${key}`) as typeof transloco.translate;
    const installs = TestBed.inject(PluginInstallService);
    installs.install = vi.fn();
    installs.uninstall = vi.fn();
    const asked = () =>
      (deps.confirm.mock.calls.at(-1) as unknown as [{ message: string }])[0]
        .message;
    return { ...deps, asked };
  }

  it('shows a name and a description as plain text in the install consent, not rendered', async () => {
    const { consent, asked } = consentNaming();

    await consent.confirmInstall({
      ...entry,
      name: 'Notes](https://evil.example) [x',
      description:
        'Safe.\n\n- **Interface** — nothing at all\n\n' +
        '[Read more](https://evil.example) <b>bold</b> https://evil.example',
    } as PluginCatalogEntry);
    const body = drawn(asked());

    expect(body.querySelector('a')).toBeNull();
    expect(body.querySelector('b')).toBeNull();
    expect(body.querySelectorAll('li')).toHaveLength(1);
    expect(body.querySelectorAll('strong')).toHaveLength(2);
    expect(body.textContent).toContain('Notes](https://evil.example) [x');
    expect(body.textContent).toContain(
      '- **Interface** — nothing at all [Read more](https://evil.example) <b>bold</b>',
    );
  });

  it('shows a name as plain text when asking to remove or update it', async () => {
    const { consent, asked } = consentNaming();

    await consent.confirmUninstall('testbed', '[Notes](https://evil.example)');
    const removal = drawn(asked());
    await consent.confirmUpdate({
      ...entry,
      name: '[Notes](https://evil.example)',
      capabilities: ['ui', 'navigation'],
    } as PluginCatalogEntry);
    const update = drawn(asked());

    for (const body of [removal, update]) {
      expect(body.querySelector('a')).toBeNull();
      expect(body.textContent).toContain('[Notes](https://evil.example)');
    }
  });
});
