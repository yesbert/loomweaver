import { TranslocoService } from '@jsverse/transloco';
import { PluginCatalogEntry } from '../installed-plugin';
import { StoreConsentDeps, consentLine } from './consent-deps';

export async function confirmInstall(
  deps: StoreConsentDeps,
  entry: PluginCatalogEntry,
): Promise<void> {
  const accepted = await deps.dialogs.confirm({
    title: deps.transloco.translate('settings.storeInstallTitle', {
      name: entry.name,
    }),
    message: consentMessage(deps.transloco, entry),
    confirmLabel: deps.transloco.translate('settings.storeInstall'),
    icon: entry.icon ?? 'plugin',
  });
  if (!accepted) {
    return;
  }
  deps.installs.install(entry);
}

function consentMessage(
  transloco: TranslocoService,
  entry: PluginCatalogEntry,
): string {
  const paragraphs: string[] = [];
  if (entry.description) {
    paragraphs.push(entry.description, '');
  }
  const capabilities = entry.capabilities ?? [];
  if (capabilities.length === 0) {
    paragraphs.push(
      transloco.translate('settings.storeConsentNone', { name: entry.name }),
    );
    return paragraphs.join('\n');
  }
  paragraphs.push(
    transloco.translate('settings.storeConsent', { name: entry.name }),
    '',
    ...capabilities.map((cap) => consentLine(transloco, cap)),
  );
  return paragraphs.join('\n');
}
