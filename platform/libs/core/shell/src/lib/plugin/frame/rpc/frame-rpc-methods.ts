import { CommandOutcome } from '@loomweaver/plugin-sdk';
import { tabBadgeOf } from '../../../contributions/tab-badge';
import { asCommandArguments } from '../../../foundation/command-arguments';
import { KeyValueStore } from '../../../persistence/key-value-store';
import { StateSyncService } from '../../../persistence/state-sync.service';
import { PluginInstallService } from '../../../plugin-store/lifecycle/plugin-install.service';
import { HostPluginContext } from '../../context/host-plugin-context';
import {
  buildFrameSection,
  frameSettingsGroup,
} from '../frame-settings-section';
import { FrameSession } from '../frame-session';
import { FrameRpc } from './frame-rpc-contract';
import {
  sanitizeRpcMenuItem,
  sanitizeRpcTabInput,
  sanitizeRpcTabLabel,
  sanitizeRpcToastInput,
} from './sanitize-inputs';
import { sanitizeRpcSettingsSection } from './sanitize-settings';
import { sanitizeRpcSurface } from './sanitize-surface';
import { textArgument } from './wire-fields';

const UNCARRIABLE_ARGUMENTS: CommandOutcome = {
  outcome: 'refused',
  reason: 'invalid-arguments',
  message:
    'Arguments must be an object of single values or lists of them; anything else cannot cross the ' +
    'sandbox boundary as the value it was.',
};

export interface FrameRpcDeps {
  readonly pluginId: string;
  readonly ctx: HostPluginContext;
  readonly origins: readonly string[] | undefined;
  readonly session: FrameSession;
  readonly install: PluginInstallService;
  readonly store: KeyValueStore;
  readonly sync: StateSyncService;
  readonly reportRefusal: (error: unknown) => void;
}

export function frameRpcMethods(deps: FrameRpcDeps): FrameRpc {
  const { pluginId, ctx, origins, session } = deps;
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
          group: frameSettingsGroup(deps.install, pluginId),
          store: deps.store,
          sync: deps.sync,
          notify: (sectionId, values) =>
            session.notify((remote) =>
              remote.settingsChanged(sectionId, values),
            ),
        });
        session.addCleanup(built.disposeSync);
        ctx.registerSettingsSection(built.section);
      },
      retitleSurface: (id, title) =>
        ctx.retitleSurface(
          textArgument(id, 'retitleSurface', 'id'),
          textArgument(title, 'retitleSurface', 'title'),
        ),
      updateSurfaceBadge: (id, badge) =>
        ctx.updateSurfaceBadge(
          textArgument(id, 'updateSurfaceBadge', 'id'),
          tabBadgeOf(badge) ?? null,
        ),
      setChildShown: (childSurfaceId, shown) =>
        ctx.setChildShown(
          textArgument(childSurfaceId, 'setChildShown', 'childSurfaceId'),
          shown === true,
        ),
      navigateContent: (path) =>
        ctx.navigateContent(textArgument(path, 'navigateContent', 'path')),
      openContentTab: (input) => {
        const sanitized = sanitizeRpcTabInput(input);
        ctx.openContentTab({
          ...sanitized,
          onClose: () =>
            session.notify((remote) => remote.contentTabClosed(sanitized.path)),
        });
      },
      keepContentTab: (path) =>
        ctx.keepContentTab(textArgument(path, 'keepContentTab', 'path')),
      pinContentTab: (path) =>
        ctx.pinContentTab(textArgument(path, 'pinContentTab', 'path')),
      unpinContentTab: (path) =>
        ctx.unpinContentTab(textArgument(path, 'unpinContentTab', 'path')),
      closeContentTab: (path) =>
        ctx.closeContentTab(textArgument(path, 'closeContentTab', 'path')),
      updateContentTab: (path, label) =>
        ctx.updateContentTab(
          textArgument(path, 'updateContentTab', 'path'),
          sanitizeRpcTabLabel(label),
        ),
      revealSurface: (id) =>
        ctx.revealSurface(textArgument(id, 'revealSurface', 'id')),
      invokeCommand: (id, args) =>
        invokeRpcCommand(ctx, textArgument(id, 'invokeCommand', 'id'), args),
      invocableCommands: () => ctx.invocableCommands(),
      toast: (input) => ctx.ui.toast(sanitizeRpcToastInput(input)),
      stateWatch: (key) =>
        session.watch(textArgument(key, 'stateWatch', 'key')),
      stateSet: (key, value) =>
        session.set(textArgument(key, 'stateSet', 'key'), value),
      stateClear: (key) =>
        session.clear(textArgument(key, 'stateClear', 'key')),
      stateUnwatch: (key) =>
        session.unwatch(textArgument(key, 'stateUnwatch', 'key')),
    },
    deps.reportRefusal,
  );
}

function invokeRpcCommand(
  ctx: Pick<HostPluginContext, 'invokeCommand'>,
  id: string,
  args: unknown,
): Promise<CommandOutcome> {
  const carried = args === undefined ? undefined : asCommandArguments(args);
  return carried === null
    ? Promise.resolve(UNCARRIABLE_ARGUMENTS)
    : ctx.invokeCommand(id, carried);
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
