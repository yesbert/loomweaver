import { StoreConsentDeps } from './consent-deps';

export async function confirmUninstall(
  deps: StoreConsentDeps,
  id: string,
  name: string,
): Promise<void> {
  const accepted = await deps.dialogs.confirm({
    title: deps.transloco.translate('settings.storeUninstallTitle', { name }),
    message: deps.transloco.translate('settings.storeUninstallConfirm', {
      name,
    }),
    confirmLabel: deps.transloco.translate('settings.storeUninstall'),
    tone: 'danger',
  });
  if (!accepted) {
    return;
  }
  if (!(await deps.disableGuard.confirmRemoval(id))) {
    return;
  }
  deps.installs.uninstall(id);
}
