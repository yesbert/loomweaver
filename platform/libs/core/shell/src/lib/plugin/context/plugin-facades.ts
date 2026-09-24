import { inject } from '@angular/core';
import { AuthContext } from '../../auth/auth-context';
import { DialogService } from '../../dialog/dialog.service';
import { MenuService } from '../../menu/menu.service';
import { NotificationService } from '../../notifications/notification.service';
import { SettingsService } from '../../settings/settings.service';
import { UpdateService } from '../../update/update.service';
import { VersionService } from '../../version/version.service';
import { PluginHost, PluginSession, PluginUi } from '../plugin';

export function pluginUi(pluginId: string, requireUi: () => void): PluginUi {
  const dialogs = inject(DialogService);
  const notifications = inject(NotificationService);
  const settings = inject(SettingsService);
  const menu = inject(MenuService);
  return {
    confirm: (options) => {
      requireUi();
      return dialogs.confirm(options);
    },
    alert: (options) => {
      requireUi();
      return dialogs.alert(options);
    },
    prompt: (options) => {
      requireUi();
      return dialogs.prompt(options);
    },
    open: (component, options) => {
      requireUi();
      return dialogs.open(component, options);
    },
    progress: (options) => {
      requireUi();
      return dialogs.progress(options);
    },
    withProgress: (options, work) => {
      requireUi();
      return dialogs.withProgress(options, work);
    },
    toast: (input) => {
      requireUi();
      const id = input.id === undefined ? undefined : `${pluginId}.${input.id}`;
      return notifications.show({ ...input, id });
    },
    openSettings: () => {
      requireUi();
      return settings.open();
    },
    openMenu: (items, at) => {
      requireUi();
      const entries = items.map((item, index) => ({
        key: String(index),
        label: item.label,
        icon: item.icon,
      }));
      menu.openList(entries, at, (key) => items[Number(key)]?.run());
    },
  };
}

export function pluginHost(): PluginHost {
  const version = inject(VersionService);
  const update = inject(UpdateService);
  return {
    version: version.version,
    isPreview: version.isPreview,
    updateAvailable: update.updateAvailable,
    updatesEnabled: update.enabled,
    checkForUpdate: () => update.checkForUpdate().then(() => undefined),
    activateUpdate: () => update.activateUpdate(),
  };
}

export function pluginSession(): PluginSession {
  const auth = inject(AuthContext);
  return {
    authenticated: auth.authenticated,
    roles: auth.roles,
    hasRole: (role) => auth.hasRole(role),
  };
}
