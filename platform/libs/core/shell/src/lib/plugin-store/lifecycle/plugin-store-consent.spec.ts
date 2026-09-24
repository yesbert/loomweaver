import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../../dialog/dialog.service';
import { InstalledPlugin } from './installed-plugin';
import { PluginCatalogEntry } from '../catalog/catalog-entry';
import { PluginDisableGuard } from '../../plugin/enablement/plugin-disable-guard';
import { PluginInstallService } from './plugin-install.service';
import { PluginStoreConsent } from './plugin-store-consent';

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
