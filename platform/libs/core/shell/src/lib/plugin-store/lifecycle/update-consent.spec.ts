import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../../dialog/dialog.service';
import { StoreConsentDeps } from './consent-deps';
import { InstalledPlugin, PluginCatalogEntry } from '../installed-plugin';
import { PluginDisableGuard } from './plugin-disable-guard';
import { PluginInstallService } from './plugin-install.service';
import { confirmUpdate } from './update-consent';

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
  const deps: StoreConsentDeps = {
    dialogs: { confirm } as unknown as DialogService,
    transloco: {
      translate: (key: string) => key,
    } as unknown as TranslocoService,
    installs: {
      find: () => installed,
      update,
    } as unknown as PluginInstallService,
    disableGuard: { confirmRemoval } as unknown as PluginDisableGuard,
  };
  return { deps, update, confirmRemoval, confirm };
}

describe('confirmUpdate (updates respawn the plugin)', () => {
  it('runs the unsaved-changes guard and aborts the update when the user cancels', async () => {
    const { deps, update, confirmRemoval } = fakeDeps({
      removalAllowed: false,
    });

    await confirmUpdate(deps, entry);

    expect(confirmRemoval).toHaveBeenCalledWith('testbed');
    expect(update).not.toHaveBeenCalled();
  });

  it('updates once the guard passes', async () => {
    const { deps, update } = fakeDeps({ removalAllowed: true });

    await confirmUpdate(deps, entry);

    expect(update).toHaveBeenCalledWith(entry);
  });

  it('a declined capability consent never reaches the guard', async () => {
    const { deps, update, confirmRemoval } = fakeDeps({
      removalAllowed: true,
      consentAccepted: false,
    });
    const grown: PluginCatalogEntry = {
      ...entry,
      capabilities: ['ui', 'navigation'],
    } as PluginCatalogEntry;

    await confirmUpdate(deps, grown);

    expect(confirmRemoval).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
