import { inject } from '@angular/core';
import { AuthContext } from '../../auth/auth-context';
import { DialogService } from '../../dialog/dialog.service';
import { MenuListEntry, MenuService } from '../../menu/menu.service';
import { NotificationBoard } from '../../notifications/notification-board';
import { SettingsService } from '../../settings-dialog/settings.service';
import { UpdateService } from '../../update/update.service';
import { VersionService } from '../../version/version.service';
import { PluginHost, PluginSession, PluginUi, UiMenuItem } from '../plugin';

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

export function pluginHost(requireHost: () => void): PluginHost {
  const version = inject(VersionService);
  const update = inject(UpdateService);
  return {
    version: gated(requireHost, version.version),
    isPreview: gated(requireHost, version.isPreview),
    updateAvailable: gated(requireHost, update.updateAvailable),
    get updatesEnabled() {
      requireHost();
      return update.enabled;
    },
    checkForUpdate: gated(requireHost, () =>
      update.checkForUpdate().then(() => undefined),
    ),
    activateUpdate: gated(requireHost, () => update.activateUpdate()),
  };
}

export function pluginSession(requireSession: () => void): PluginSession {
  const auth = inject(AuthContext);
  return {
    authenticated: gated(requireSession, auth.authenticated),
    roles: gated(requireSession, auth.roles),
    hasRole: gated(requireSession, (role: string) => auth.hasRole(role)),
  };
}

export function gated<A extends unknown[], T>(
  require: () => void,
  use: (...args: A) => T,
): (...args: A) => T {
  return (...args) => {
    require();
    return use(...args);
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
      chord: item.shortcut,
    };
  });
}
