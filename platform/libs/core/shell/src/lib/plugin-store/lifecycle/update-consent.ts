import { TranslocoService } from '@jsverse/transloco';
import { Capability } from '@loomweaver/plugin-sdk';
import { PluginCatalogEntry } from '../installed-plugin';
import { addedCapabilities } from './plugin-update';
import { StoreConsentDeps, consentLine } from './consent-deps';

export async function confirmUpdate(
  deps: StoreConsentDeps,
  entry: PluginCatalogEntry,
): Promise<void> {
  const installed = deps.installs.find(entry.id);
  if (!installed) {
    return;
  }
  const added = addedCapabilities(entry, installed);
  if (added.length > 0) {
    const accepted = await deps.dialogs.confirm({
      title: deps.transloco.translate('settings.storeUpdateTitle', {
        name: entry.name,
      }),
      message: consentMessage(deps.transloco, entry, added),
      confirmLabel: deps.transloco.translate('settings.storeUpdate'),
      icon: entry.icon ?? 'plugin',
    });
    if (!accepted) {
      return;
    }
  }
  if (!(await deps.disableGuard.confirmRemoval(entry.id))) {
    return;
  }
  deps.installs.update(entry);
}

function consentMessage(
  transloco: TranslocoService,
  entry: PluginCatalogEntry,
  added: readonly Capability[],
): string {
  return [
    transloco.translate('settings.storeUpdateConsent', {
      name: entry.name,
      version: entry.version ?? '',
    }),
    '',
    ...added.map((capability) => consentLine(transloco, capability)),
  ].join('\n');
}
