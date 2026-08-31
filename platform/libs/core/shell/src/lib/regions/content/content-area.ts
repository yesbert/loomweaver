import { Component, CUSTOM_ELEMENTS_SCHEMA, EnvironmentInjector, Injector, Type, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViewAction } from '@loomweaver/plugin-sdk';
import { CommandService } from '../../commands/command.service';
import { ContentTabsService } from './tabs/content-tabs.service';
import { ContentSecondaryPane } from './content-secondary-pane';
import { PaneTargetPicker } from './pane-target-picker.service';
import { TAB_CONTEXT_MENU } from './tabs/tab-context-menu';
import { SHELL_FEATURES } from '../../foundation/shell-features';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';
import { matchRoute } from './content-path';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { TabDragSource } from '../pane/drag/pane-drag.service';
import { PaneTabStrip } from '../pane/chrome/pane-tab-strip';
import { StripTab } from '../pane/chrome/strip-tab';
import { PaneToolbar } from '../pane/chrome/pane-toolbar';
import { RetainedComponent } from '../pane/retention/retained-component';
import {
  effectivePadding,
  SURFACE_PADDING,
} from '../../foundation/surface-padding';
import {
  paneRetentionScope,
  retainSurfacePath,
  routeRetains,
  SURFACE_RETENTION,
  surfaceRetentionKey,
} from '../pane/retention/retention-policy';
import { ComponentLoader } from '../../views/component-loader.service';
import { IframeSurface } from './iframe-surface';
import { surfaceInjectorFactory } from './routing/surface-injector';

@Component({
  selector: 'lw-content-area',
  imports: [
    RouterOutlet,
    PaneTabStrip,
    PaneToolbar,
    ContentSecondaryPane,
    RetainedComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './content-area.html',
})
export class ContentArea {
  private readonly commands = inject(CommandService);
  private readonly picker = inject(PaneTargetPicker);
  protected readonly tabs = inject(ContentTabsService);
  protected readonly tabContextMenu = TAB_CONTEXT_MENU;
  private readonly chrome = inject(PaneChromeService);
  private readonly layout = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  protected readonly features = inject(SHELL_FEATURES).content;
  private readonly retention = inject(SURFACE_RETENTION);
  private readonly padding = inject(SURFACE_PADDING);

  private readonly componentLoader = inject(ComponentLoader);

  private readonly surfaceInjectorFor = surfaceInjectorFactory(
    inject(Injector),
    inject(EnvironmentInjector),
    { urlDriven: true },
  );

  private readonly urlPaneId = computed(() =>
    this.layout.primaryId(CONTENT_DOCK),
  );

  protected readonly urlGroup = computed<TabDragSource>(() => ({
    dock: CONTENT_DOCK,
    paneId: this.urlPaneId(),
  }));

  protected readonly urlGroupScope = computed(() =>
    paneRetentionScope(CONTENT_DOCK, this.urlPaneId()),
  );

  protected readonly iframeSurface = computed<{
    component: Type<unknown>;
    injector: Injector;
  } | null>(() => {
    if (this.tabs.activeViewPath() !== null) {
      return null;
    }
    const path = this.tabs.activeTabRoot();
    const route = matchRoute(this.registry.contentRoutes(), path);
    if (route?.iframe === undefined || !this.auth.meets(route.access)) {
      return null;
    }
    return {
      component: IframeSurface,
      injector: this.surfaceInjectorFor(route, path, this.surfaceKey()),
    };
  });

  protected readonly retainedSurface = computed<{
    component: Type<unknown>;
    injector: Injector;
  } | null>(() => {
    if (this.tabs.activeViewPath() !== null) {
      return null;
    }
    const path = this.tabs.activeTabRoot();
    const route = matchRoute(this.registry.contentRoutes(), path);
    if (
      route === undefined ||
      route.iframe !== undefined ||
      route.container !== undefined ||
      !routeRetains(route, this.retention) ||
      !this.auth.meets(route.access)
    ) {
      return null;
    }
    const component = this.componentLoader.resolve(route);
    if (component === null) {
      return null;
    }
    return {
      component,
      injector: this.surfaceInjectorFor(route, path, this.surfaceKey()),
    };
  });

  protected readonly surfaceKey = computed(() =>
    surfaceRetentionKey(this.urlGroupScope(), this.tabs.activeTabRoot()),
  );

  protected readonly iframeRetain = computed(() =>
    retainSurfacePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      this.tabs.activeTabRoot(),
      this.retention,
    ),
  );

  protected readonly canAddTab = computed(() => this.features.newTab);
  protected readonly canMaximize = computed(() => this.features.maximize);
  protected readonly maximized = computed(() =>
    this.chrome.isMaximized(CONTENT_DOCK, this.urlPaneId()),
  );

  private readonly isSplit = computed(() => this.layout.isSplit(CONTENT_DOCK));
  private readonly activeSplitPath = computed(
    () => this.tabs.activeViewPath() ?? this.tabs.activeTabRoot(),
  );
  private readonly splittable = computed(() => {
    if (this.tabs.activeViewPath() !== null) {
      return true;
    }
    const route = matchRoute(
      this.registry.contentRoutes(),
      this.tabs.activeTabRoot(),
    );
    return route !== undefined && this.auth.meets(route.access);
  });

  protected readonly canSplitRight = computed(
    () => this.features.splitRight && this.splittable(),
  );
  protected readonly canSplitDown = computed(
    () => this.features.splitDown && this.splittable(),
  );

  protected readonly activeIsContainer = computed(() => {
    const route = matchRoute(
      this.registry.contentRoutes(),
      this.tabs.activeTabRoot(),
    );
    return route?.container !== undefined;
  });

  protected readonly activeIsPadded = computed(() => {
    if (this.activeIsContainer()) {
      return false;
    }
    const route = matchRoute(
      this.registry.contentRoutes(),
      this.tabs.activeTabRoot(),
    );
    return effectivePadding(route?.padded, this.padding);
  });

  protected readonly canMinimize = computed(
    () => this.features.minimize && this.isSplit() && !this.maximized(),
  );
  protected readonly canClose = computed(
    () => this.isSplit() && !this.maximized(),
  );

  protected readonly canNewTabFloating = computed(
    () => this.features.newTab && !this.maximized(),
  );
  protected readonly canSplitRightFloating = computed(
    () => this.canSplitRight() && !this.maximized(),
  );
  protected readonly canSplitDownFloating = computed(
    () => this.canSplitDown() && !this.maximized(),
  );
  protected readonly showFloating = computed(
    () =>
      !this.tabs.showStrip() &&
      (this.canNewTabFloating() ||
        this.canSplitRightFloating() ||
        this.canSplitDownFloating() ||
        this.canMinimize() ||
        this.canMaximize() ||
        this.canClose()),
  );

  protected readonly tabsReorderable = this.features.reorderTabs;

  protected readonly tabsDraggable =
    this.features.reorderTabs ||
    this.features.moveTabs ||
    this.features.splitRight ||
    this.features.splitDown;

  protected readonly stripTabs = computed<StripTab[]>(() =>
    this.tabs.tabs().map((tab) => ({
      ...tab,
      closable: tab.closable && this.features.close,
    })),
  );

  protected readonly activeId = computed(
    () => this.tabs.activeViewPath() ?? this.tabs.activeTabRoot(),
  );

  protected select(tab: StripTab): void {
    if (tab.path.startsWith(VIEW_PANE_PREFIX)) {
      this.tabs.activateViewTab(tab.path);
      return;
    }
    this.tabs.navigateTo(tab.navPath ?? tab.path);
  }

  protected escalate(tab: StripTab): void {
    if (!this.features.escalate || tab.path.startsWith(VIEW_PANE_PREFIX)) {
      return;
    }
    if (tab.preview) {
      this.tabs.keep(tab.path);
    } else if (!this.features.pin) {
      return;
    } else if (tab.pinned) {
      this.tabs.unpin(tab.path);
    } else if (tab.closable) {
      this.tabs.pin(tab.path);
    }
  }

  protected runAction(action: ViewAction): void {
    this.commands.trigger(action);
  }

  protected onReorder(ids: string[]): void {
    this.tabs.reorder(ids);
  }

  protected toggleMaximize(): void {
    this.chrome.toggleMaximize(CONTENT_DOCK, this.urlPaneId());
  }

  protected minimize(): void {
    this.chrome.toggleMinimize(CONTENT_DOCK, this.urlPaneId());
  }

  protected closePrimary(): void {
    this.tabs.closePrimaryPane();
  }

  protected split(orientation: 'row' | 'column'): void {
    this.layout.splitPane(
      CONTENT_DOCK,
      this.urlPaneId(),
      orientation,
      this.activeSplitPath(),
    );
  }

  protected newTab(event: Event): void {
    this.picker.openForNavigation(event.currentTarget as HTMLElement, (path) =>
      this.tabs.navigateTo(path),
    );
  }
}
