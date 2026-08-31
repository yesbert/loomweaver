import { ContributionRegistry, Disposable } from './contribution-registry';
import { BarItem } from '../foundation/bar-item';
import { RailItem } from '../foundation/rail-item';
import { LayoutRegion } from '../layout/layout';
import { PluginContext, PluginHost, PluginSession, PluginUi } from './plugin';
import {
  ActiveContent,
  Capability,
  CapabilityError,
  Command,
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
  MenuItem,
  OpenTabInput,
  PluginState,
  StateHandle,
  Surface,
} from '@loomweaver/plugin-sdk';
import {
  entryToContentRoute,
  entryToView,
  isRoutableSurface,
  surfaceToEntry,
} from './surface-normalize';
import { AuthContext } from '../auth/auth-context';
import { segmentsOf } from '../regions/content/content-path';
import { collidingParam } from '../regions/content/tabs/tab-address';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { DialogService } from '../dialog/dialog.service';
import { NotificationService } from '../notifications/notification.service';
import { MenuService } from '../menu/menu.service';
import { SettingsService } from '../settings/settings.service';
import { SettingsSection } from '../settings/settings-model';
import { VersionService } from '../version/version.service';
import { UpdateService } from '../update/update.service';
import { IconRegistry } from '../elements/icon/icon-registry';
import { ThemeRegistry } from '../theme/theme-registry';
import { SurfaceRevealService } from '../views/surface-reveal.service';
import { PluginStateService } from './plugin-state.service';
import { CommandInvoker } from '../foundation/command-invoker';
import {
  warnUndescribedCallable,
  warnUnlessPanelRegion,
  warnUnlessRegionType,
  warnUnsupportedRetain,
  warnUnusableContainerLayout,
} from './host-context-warnings';

export class HostPluginContext implements PluginContext {
  private readonly disposables: Disposable[] = [];

  readonly ui: PluginUi;

  readonly state: PluginState;

  private readonly hostFacts: PluginHost;
  private readonly sessionFacts: PluginSession;

  constructor(
    private readonly pluginId: string,
    private readonly isGranted: (capability: Capability) => boolean,
    private readonly registry: ContributionRegistry,
    dialogs: DialogService,
    notifications: NotificationService,
    private readonly settings: SettingsService,
    version: VersionService,
    update: UpdateService,
    private readonly tabs: ContentTabsService,

    private readonly regions: readonly LayoutRegion[],
    private readonly icons: IconRegistry,
    auth: AuthContext,
    menu: MenuService,
    private readonly themes: ThemeRegistry,
    private readonly reveal: SurfaceRevealService,
    pluginState: PluginStateService,
    private readonly invocation: CommandInvoker,
  ) {
    this.ui = {
      confirm: (options) => {
        this.require('ui');
        return dialogs.confirm(options);
      },
      alert: (options) => {
        this.require('ui');
        return dialogs.alert(options);
      },
      prompt: (options) => {
        this.require('ui');
        return dialogs.prompt(options);
      },
      open: (component, options) => {
        this.require('ui');
        return dialogs.open(component, options);
      },
      progress: (options) => {
        this.require('ui');
        return dialogs.progress(options);
      },
      withProgress: (options, work) => {
        this.require('ui');
        return dialogs.withProgress(options, work);
      },
      toast: (input) => {
        this.require('ui');

        const id =
          input.id === undefined ? undefined : `${this.pluginId}.${input.id}`;
        return notifications.show({ ...input, id });
      },
      openSettings: () => {
        this.require('ui');
        return settings.open();
      },
      openMenu: (items, at) => {
        this.require('ui');

        const entries = items.map((item, index) => ({
          key: String(index),
          label: item.label,
          icon: item.icon,
        }));
        menu.openList(entries, at, (key) => items[Number(key)]?.run());
      },
    };
    this.hostFacts = {
      version: version.version,
      isPreview: version.isPreview,
      updateAvailable: update.updateAvailable,
      updatesEnabled: update.enabled,
      checkForUpdate: () => update.checkForUpdate(),
      activateUpdate: () => update.activateUpdate(),
    };

    const store = pluginState.facade(this.pluginId);
    this.state = {
      watch: <T>(key: string) => this.trackHandle(store.watch<T>(key)),
    };

    this.sessionFacts = {
      authenticated: auth.authenticated,
      roles: auth.roles,
      hasRole: (role) => auth.hasRole(role),
    };
  }

  get host(): PluginHost {
    this.require('host');
    return this.hostFacts;
  }

  get session(): PluginSession {
    this.require('session');
    return this.sessionFacts;
  }

  get activeContent(): () => ActiveContent | null {
    this.require('navigation');
    return this.tabs.activeContent;
  }

  get invocableCommands(): () => readonly InvocableCommand[] {
    return () =>
      this.invocation.invocable(this.pluginId, this.isGranted('automation'));
  }

  invokeCommand(
    id: string,
    args?: CommandArguments,
  ): Promise<CommandOutcome> {
    return this.invocation.invoke(
      this.pluginId,
      this.isGranted('automation'),
      id,
      args,
    );
  }

  registerCommand(command: Command): Disposable {
    this.require('contributions');
    warnUndescribedCallable(this.pluginId, command);
    return this.track(this.registry.addCommand(command, this.pluginId));
  }

  registerSurface(surface: Surface): Disposable {
    this.require('contributions');
    this.requireNavigationForBroadPrefix(surface);
    warnUnsupportedRetain(this.pluginId, surface);
    warnUnusableContainerLayout(this.pluginId, surface);

    const entry = surfaceToEntry(surface);
    if (isRoutableSurface(surface)) {
      const collision = this.followCollision(surface);
      if (collision) {
        console.error(collision);
        return { dispose: () => undefined };
      }
      return this.track(
        this.registry.addContentRoute(
          entryToContentRoute(entry),
          this.pluginId,
        ),
      );
    }
    const view = entryToView(entry);
    warnUnlessPanelRegion(this.pluginId, this.regions, view);
    return this.track(this.registry.addView(view, this.pluginId));
  }

  registerBarItem(item: BarItem): Disposable {
    this.require('contributions');
    warnUnlessRegionType(this.pluginId, this.regions, item.id, item.bar, 'bar');
    return this.track(this.registry.addBarItem(item));
  }

  registerRailItem(item: RailItem): Disposable {
    this.require('contributions');
    warnUnlessRegionType(this.pluginId, this.regions, item.id, item.rail, 'rail');
    return this.track(this.registry.addRailItem(item));
  }

  registerSettingsSection(section: SettingsSection): Disposable {
    this.require('contributions');
    return this.track(this.settings.register(section));
  }

  registerMenuItem(item: MenuItem): Disposable {
    this.require('contributions');
    return this.track(this.registry.addMenuItem(item));
  }

  contributeIcons(icons: Readonly<Record<string, string>>): Disposable {
    this.require('contributions');
    return this.track(this.icons.register(this.pluginId, icons));
  }

  contributeTheme(
    tokens: Readonly<Record<string, string>>,
    dark?: Readonly<Record<string, string>>,
  ): Disposable {
    this.require('theme');
    return this.track(this.themes.register(this.pluginId, tokens, dark));
  }

  navigateContent(path: string): void {
    this.require('navigation');
    this.tabs.navigate(path);
  }

  openContentTab(input: OpenTabInput): void {
    this.require('navigation');
    this.tabs.open(input);
  }

  keepContentTab(path: string): void {
    this.require('navigation');
    this.tabs.keep(path);
  }

  pinContentTab(path: string): void {
    this.require('navigation');
    this.tabs.pin(path);
  }

  unpinContentTab(path: string): void {
    this.require('navigation');
    this.tabs.unpin(path);
  }

  closeContentTab(path: string): void {
    this.require('navigation');
    this.tabs.close(path);
  }

  revealSurface(id: string): void {
    this.require('navigation');
    this.reveal.reveal(id);
  }

  disposeAll(): void {
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  private followCollision(surface: Surface): string | null {
    const routable = surface.routable;
    if (routable?.follows !== true) {
      return null;
    }
    for (const other of this.registry.contentRoutes()) {
      if (other.follows !== true || other.path === routable.path) {
        continue;
      }
      const name = collidingParam(routable.path, other.path);
      if (name !== undefined) {
        return (
          `Plugin "${this.pluginId}": surface "${surface.id}" was refused. Its pattern ` +
          `"${routable.path}" and the following surface "${other.path}" both use ":${name}" but differ ` +
          `before it, so the name means two different things and substituting it by name would fill ` +
          `one surface's address with the other's value. Rename the parameter or align the patterns.`
        );
      }
    }
    return null;
  }

  private requireNavigationForBroadPrefix(surface: Surface): void {
    const routable = surface.routable;
    if (routable?.rest !== true || segmentsOf(routable.path).length >= 2) {
      return;
    }
    this.require(
      'navigation',
      `The surface "${surface.id}" claims "${routable.path}" with rest: true, which owns most of ` +
        `the address space — the surface channel's confinement to its own tab root no longer ` +
        `constrains it, so the grant is required.`,
    );
  }

  private require(capability: Capability, reason?: string): void {
    if (!this.isGranted(capability)) {
      throw new CapabilityError(capability, this.pluginId, reason);
    }
  }

  private trackHandle<T>(handle: StateHandle<T>): StateHandle<T> {
    this.track({ dispose: () => handle.dispose() });
    return handle;
  }

  private track(disposable: Disposable): Disposable {
    this.disposables.push(disposable);
    return disposable;
  }
}
