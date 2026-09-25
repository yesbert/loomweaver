import { inject } from '@angular/core';
import {
  ContributionRegistry,
  Disposable,
} from '../../contributions/contribution-registry';
import { BarItem } from '../../foundation/bar-item';
import { RailItem } from '../../foundation/rail-item';
import { SHELL_LAYOUT } from '../../layout/layout';
import { PluginContext, PluginHost, PluginSession, PluginUi } from '../plugin';
import {
  ActiveContent,
  Capability,
  CapabilityError,
  Command,
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
  MenuItem,
  ContentTabLabel,
  OpenTabInput,
  PluginState,
  StateHandle,
  Surface,
  TabBadge,
  ViewAction,
} from '@loomweaver/plugin-sdk';
import {
  entryToContentRoute,
  entryToView,
  isRoutableSurface,
  surfaceToEntry,
} from '../../contributions/surface-normalize';
import { LeftOutChildren } from '../../regions/pane/container/left-out-children';
import { normalizePath } from '../../regions/content/content-path';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { SettingsService } from '../../settings-dialog/settings.service';
import { SettingsSection } from '../../settings-dialog/settings-model';
import { IconRegistry } from '../../elements/icon/icon-registry';
import { ThemeRegistry } from '../../theme/theme-registry';
import { SurfaceRevealService } from '../../regions/reveal/surface-reveal.service';
import { PluginStateService } from '../plugin-state.service';
import { COMMAND_INVOKER } from '../../foundation/command-invoker';
import {
  warnUndescribedCallable,
  warnUnlessPanelRegion,
  warnUnlessRegionType,
  warnIgnoredRetention,
  warnUnusableContainerLayout,
} from './host-context-warnings';
import { addressIsUnder } from '../../addressing/address-is-under';
import { pathOwnedBy, surfaceOwnedBy } from './plugin-surface-ownership';
import { pluginHost, pluginSession, pluginUi } from './plugin-facades';
import { broadPrefixReason, followConflictMessage } from './surface-admission';

export class HostPluginContext implements PluginContext {
  private readonly registry = inject(ContributionRegistry);

  private readonly settings = inject(SettingsService);

  private readonly tabs = inject(ContentTabsService);

  private readonly regions = inject(SHELL_LAYOUT).regions;

  private readonly icons = inject(IconRegistry);

  private readonly themes = inject(ThemeRegistry);

  private readonly reveal = inject(SurfaceRevealService);

  private readonly invocation = inject(COMMAND_INVOKER);

  private readonly leftOut = inject(LeftOutChildren);

  private readonly hostFacts: PluginHost = pluginHost();

  private readonly sessionFacts: PluginSession = pluginSession();

  private readonly disposables: Disposable[] = [];

  readonly ui: PluginUi;

  readonly state: PluginState;

  constructor(
    private readonly pluginId: string,
    private readonly isGranted: (capability: Capability) => boolean,
  ) {
    this.ui = pluginUi(pluginId, () => this.require('ui'));
    const store = inject(PluginStateService).forPlugin(pluginId);
    this.state = {
      watch: <T>(key: string) => this.trackHandle(store.watch<T>(key)),
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

  isShowingUnder(path: string): boolean {
    this.require('navigation');
    return addressIsUnder(this.tabs.activeContent()?.path, path);
  }

  hasUnsavedWork(path: string): boolean {
    const owns = pathOwnedBy(this.registry, this.pluginId);
    return owns(normalizePath(path)) && this.tabs.hasUnsavedWork(path);
  }

  get invocableCommands(): () => readonly InvocableCommand[] {
    return () =>
      this.invocation.invocable(this.pluginId, this.isGranted('automation'));
  }

  invokeCommand(id: string, args?: CommandArguments): Promise<CommandOutcome> {
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

  updateSurfaceBadge(id: string, badge: TabBadge | null): void {
    this.require('contributions');
    this.registry.updateSurfaceBadge(id, badge, this.pluginId);
  }

  setChildShown(childSurfaceId: string, shown: boolean): void {
    this.require('contributions');
    this.leftOut.setShownBy(this.pluginId, childSurfaceId, shown);
  }

  retitleSurface(id: string, title: string): void {
    this.require('contributions');
    if (surfaceOwnedBy(this.registry, this.pluginId, id)) {
      this.registry.retitleSurface(id, title);
    }
  }

  updateSurfaceAction(id: string, action: ViewAction): void {
    this.require('contributions');
    if (surfaceOwnedBy(this.registry, this.pluginId, id)) {
      this.registry.updateSurfaceAction(id, action);
    }
  }

  registerSurface(surface: Surface): Disposable {
    this.require('contributions');
    const broad = broadPrefixReason(surface);
    if (broad !== undefined) {
      this.require('navigation', broad);
    }
    warnIgnoredRetention(this.pluginId, surface);
    warnUnusableContainerLayout(this.pluginId, surface);

    const entry = surfaceToEntry(surface);
    if (isRoutableSurface(surface)) {
      const collision = followConflictMessage(
        this.pluginId,
        surface,
        this.registry.contentRoutes(),
      );
      if (collision) {
        console.error(collision);
        return { dispose: () => undefined };
      }
      return this.trackWithBadge(
        surface,
        this.registry.addContentRoute(
          entryToContentRoute(entry),
          this.pluginId,
        ),
      );
    }
    const view = entryToView(entry);
    warnUnlessPanelRegion(this.pluginId, this.regions, view);
    return this.trackWithBadge(
      surface,
      this.registry.addView(view, this.pluginId),
    );
  }

  registerBarItem(item: BarItem): Disposable {
    this.require('contributions');
    warnUnlessRegionType(this.pluginId, this.regions, item.id, item.bar, 'bar');
    return this.track(this.registry.addBarItem(item));
  }

  registerRailItem(item: RailItem): Disposable {
    this.require('contributions');
    warnUnlessRegionType(
      this.pluginId,
      this.regions,
      item.id,
      item.rail,
      'rail',
    );
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

  updateContentTab(path: string, label: ContentTabLabel): void {
    this.require('contributions');
    this.tabs.update(path, label, this.pluginId);
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

  private trackWithBadge(surface: Surface, registered: Disposable): Disposable {
    this.registry.updateSurfaceBadge(
      surface.id,
      surface.badge ?? null,
      this.pluginId,
    );
    return this.track(registered);
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
