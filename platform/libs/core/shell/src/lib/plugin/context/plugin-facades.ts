import { inject } from '@angular/core';
import { AuthContext } from '../../auth/auth-context';
import { DialogService } from '../../dialog/dialog.service';
import { MenuService } from '../../menu/menu.service';
import { NotificationBoard } from '../../notifications/notification-board';
import { SettingsService } from '../../settings-dialog/settings.service';
import { UpdateService } from '../../update/update.service';
import { VersionService } from '../../version/version.service';
import { PluginHost, PluginSession, PluginUi, UiMenuItem } from '../plugin';
import { MenuListEntry } from '../../menu/menu.service';
import { formatChord } from '../../commands/keyboard/format-chord';

export function pluginUi(pluginId: string, requireUi: () => void): PluginUi {
  const dialogs = inject(DialogService);
  const notifications = inject(NotificationBoard);
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
      return notifications.show(input, pluginId);
    },
    openSettings: () => {
      requireUi();
      return settings.open();
    },
    openMenu: (items, at) => {
      requireUi();
      const runs = new Map<string, () => void>();
      menu.openList(listEntries(items, '', runs), at, (key) =>
        runs.get(key)?.(),
      );
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

function listEntries(
  items: readonly UiMenuItem[],
  prefix: string,
  runs: Map<string, () => void>,
): MenuListEntry[] {
  return items.map((item, index) => {
    const key = `${prefix}${index}`;
    if (item.items !== undefined) {
      return {
        key,
        label: item.label,
        icon: item.icon,
        children: listEntries(item.items, `${key}.`, runs),
      };
    }
    runs.set(key, item.run);
    return {
      key,
      label: item.label,
      icon: item.icon,
      shortcut:
        item.shortcut === undefined ? undefined : formatChord(item.shortcut),
    };
  });
}
