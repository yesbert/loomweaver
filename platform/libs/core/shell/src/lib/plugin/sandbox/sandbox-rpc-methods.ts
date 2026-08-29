import { StateHandle } from '@loomweaver/plugin-sdk';
import { KeyValueStore } from '../../persistence/key-value-store';
import { StateSyncService } from '../../persistence/state-sync.service';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';
import { HostPluginContext } from '../host-plugin-context';
import {
  FrameRemote,
  FrameRpc,
  invokeRpcCommand,
} from './sandbox-rpc-contract';
import {
  sanitizeRpcMenuItem,
  sanitizeRpcSurface,
  sanitizeRpcTabInput,
  sanitizeRpcToastInput,
} from './sandbox-rpc-sanitize';
import {
  buildFrameSection,
  sanitizeRpcSettingsSection,
} from './sandbox-settings';

export interface WatchedKey {
  readonly handle: StateHandle;
  readonly stop: () => void;
}

export interface FrameRpcDeps {
  readonly pluginId: string;
  readonly ctx: HostPluginContext;
  readonly origins: readonly string[] | undefined;
  readonly install: PluginInstallService;
  readonly store: KeyValueStore;
  readonly sync: StateSyncService;
  readonly syncCleanups: (() => void)[];
  readonly watched: Map<string, WatchedKey>;
  readonly watchState: (key: string) => void;
  readonly notify: (send: (remote: FrameRemote) => void) => void;
  readonly reportRefusal: (error: unknown) => void;
}

export function frameRpcMethods(deps: FrameRpcDeps): FrameRpc {
  const { pluginId, ctx, origins, watched } = deps;
  return reportingRefusals(
    {
      registerSurface: (surface) => {
        ctx.registerSurface(sanitizeRpcSurface(pluginId, surface, origins));
      },
      registerMenuItem: (item) => {
        ctx.registerMenuItem(sanitizeRpcMenuItem(item));
      },
      registerSettingsSection: (section) => {
        const built = buildFrameSection({
          pluginId,
          wire: sanitizeRpcSettingsSection(pluginId, section),
          group: deps.install.isInstalled(pluginId)
            ? 'settings.group.community'
            : 'settings.group.plugins',
          store: deps.store,
          sync: deps.sync,
          notify: (sectionId, values) =>
            deps.notify((remote) => remote.settingsChanged(sectionId, values)),
        });
        deps.syncCleanups.push(built.disposeSync);
        ctx.registerSettingsSection(built.section);
      },
      navigateContent: (path) => ctx.navigateContent(path),
      openContentTab: (input) => {
        const sanitized = sanitizeRpcTabInput(input);
        ctx.openContentTab({
          ...sanitized,
          onClose: () =>
            deps.notify((remote) => remote.contentTabClosed(sanitized.path)),
        });
      },
      keepContentTab: (path) => ctx.keepContentTab(path),
      pinContentTab: (path) => ctx.pinContentTab(path),
      unpinContentTab: (path) => ctx.unpinContentTab(path),
      closeContentTab: (path) => ctx.closeContentTab(path),
      revealSurface: (id) => ctx.revealSurface(id),
      invokeCommand: (id, args) => invokeRpcCommand(ctx, id, args),
      invocableCommands: () => ctx.invocableCommands(),
      toast: (input) => ctx.ui.toast(sanitizeRpcToastInput(input)),
      stateWatch: (key) => deps.watchState(key),
      stateSet: (key, value) => watched.get(key)?.handle.set(value),
      stateClear: (key) => watched.get(key)?.handle.clear(),
      stateUnwatch: (key) => {
        watched.get(key)?.stop();
        watched.delete(key);
      },
    },
    deps.reportRefusal,
  );
}

function reportingRefusals(
  methods: FrameRpc,
  report: (error: unknown) => void,
): FrameRpc {
  const reported = Object.entries(methods).map(([name, method]) => [
    name,
    (...args: unknown[]) => {
      try {
        return (method as (...rest: unknown[]) => unknown)(...args);
      } catch (error) {
        report(error);
        throw error;
      }
    },
  ]);
  return Object.fromEntries(reported) as FrameRpc;
}
