import { computed, inject, Service, signal, Signal } from '@angular/core';
import { ActiveContent, ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AuthContext } from '../../../auth/auth-context';
import {
  matchRoute,
  normalizePath,
  routeParams,
  tabRootOf,
} from '../content-path';
import { CurrentAddress } from '../current-address';
import {
  ContentTabView,
  OpenTab,
  dynamicTabViews,
  facetTabViews,
  isStrippable,
  toOpenTab,
  toPaneTab,
  viewTabViews,
} from './content-tab-projection';
import { TabCloseHooks } from './tab-close-hooks';
import { QuickOpenTarget, quickOpenTargetsOf } from './quick-open-target';
import { TAB_ADDRESS_RESOLVER, followingTabAddress } from './tab-address';
import { CONTENT_DOCK, isViewPanePath } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { reseatPinned } from '../../pane/tree/pane-tabs';
import { surfaceBadge } from '../../pane/chrome/tab-label';

export interface RootedPath {
  readonly routes: readonly ContentRoute[];
  readonly root: string;
}

@Service()
export class ContentTabState {
  private readonly registry = inject(ContributionRegistry);

  private readonly auth = inject(AuthContext);

  private readonly paneTree = inject(PaneTreeService);

  private readonly address = inject(CurrentAddress);

  private readonly tabAddress = inject(TAB_ADDRESS_RESOLVER, {
    optional: true,
  });

  private readonly closeHooks = inject(TabCloseHooks);

  private readonly lastActive = signal<ReadonlyMap<string, number>>(new Map());

  private readonly viewTabSelection = signal<string | null>(null);

  readonly openTabs = computed<readonly OpenTab[]>(() => {
    const routes = this.registry.contentRoutes();
    return this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .filter((tab) => !isViewPanePath(tab.path))
      .map((tab) =>
        toOpenTab(
          routes,
          tab,
          this.closeHooks.get(tabRootOf(routes, tab.path)),
        ),
      );
  });

  readonly quickOpenTargets: Signal<readonly QuickOpenTarget[]> = computed(() =>
    quickOpenTargetsOf(
      this.paneTree.tree(CONTENT_DOCK),
      this.registry.contentRoutes(),
      this.lastActive(),
      (access) => this.auth.meets(access),
    ),
  );

  readonly activeViewPath: Signal<string | null> = computed(() => {
    const path = this.viewTabSelection();
    return path !== null && this.holdsInAddressPane(path) ? path : null;
  });

  readonly activeViewInstance: Signal<string | undefined> = computed(() => {
    const path = this.activeViewPath();
    if (path === null) {
      return;
    }
    return this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .find((tab) => tab.path === path)?.instance;
  });

  readonly activePath: Signal<string> = computed(() =>
    normalizePath(this.address.url()),
  );

  readonly activeRoute: Signal<ContentRoute | undefined> = computed(() =>
    matchRoute(this.registry.contentRoutes(), this.activePath()),
  );

  readonly activeTabRoot: Signal<string> = computed(() =>
    tabRootOf(this.registry.contentRoutes(), this.activePath()),
  );

  readonly activeContent: Signal<ActiveContent | null> = computed(() => {
    const route = this.activeRoute();
    if (!route) {
      return null;
    }
    const path = this.activePath();
    return {
      surfaceId: route.id ?? null,
      path,
      params: routeParams(route, path),
    };
  });

  readonly showStrip: Signal<boolean> = computed(
    () => this.activeRoute()?.chromeless !== true && this.tabs().length > 0,
  );

  readonly tabs: Signal<readonly ContentTabView[]> = computed(() => {
    const routes = this.registry.contentRoutes();
    const facets = facetTabViews(routes, (route) =>
      this.followingAddress(routes, route),
    );
    const open = this.openTabs().filter((tab) => isStrippable(routes, tab));
    const dynamics = dynamicTabViews(routes, open);
    return [...facets, ...dynamics, ...this.viewTabs()]
      .map((tab) => ({
        ...tab,
        badge: tab.badge ?? surfaceBadge(this.registry, tab.path),
      }))
      .toSorted((a, b) => a.order - b.order);
  });

  private readonly viewTabs = computed<readonly ContentTabView[]>(() =>
    viewTabViews(
      this.paneTree.primaryTabs(CONTENT_DOCK),
      (id) => this.registry.views().find((view) => view.id === id),
      (access) => this.auth.meets(access),
    ),
  );

  activateViewTab(path: string): void {
    if (this.holdsInAddressPane(path)) {
      this.viewTabSelection.set(path);
    }
  }

  clearViewTabSelection(): void {
    this.viewTabSelection.set(null);
  }

  markActive(root: string): void {
    const next = new Map(this.lastActive());
    next.set(root, Date.now());
    this.lastActive.set(next);
  }

  updateOpen(change: (tabs: readonly OpenTab[]) => readonly OpenTab[]): void {
    const current = this.openTabs();
    const next = change(current);
    if (next === current) {
      return;
    }
    const viewTabs = this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .filter((tab) => isViewPanePath(tab.path));
    this.paneTree.setPrimaryTabs(CONTENT_DOCK, [
      ...next.map((tab) => toPaneTab(tab)),
      ...viewTabs,
    ]);
  }

  rootFor(path: string): RootedPath {
    const routes = this.registry.contentRoutes();
    return { routes, root: tabRootOf(routes, normalizePath(path)) };
  }

  openTabRootedAt(
    routes: readonly ContentRoute[],
    root: string,
  ): OpenTab | undefined {
    return this.openTabs().find((tab) => tabRootOf(routes, tab.path) === root);
  }

  reorder(roots: readonly string[]): void {
    const routes = this.registry.contentRoutes();
    const rank = new Map(roots.map((root, position) => [root, position]));
    const seat = (tab: OpenTab, fallback: number) =>
      rank.get(tabRootOf(routes, tab.path)) ?? fallback;
    this.updateOpen((tabs) =>
      tabs
        .map((tab, position) => ({ tab, position }))
        .toSorted((a, b) => seat(a.tab, a.position) - seat(b.tab, b.position))
        .map((entry) => entry.tab),
    );
  }

  bringToFront(path: string): void {
    const { routes, root } = this.rootFor(path);
    this.updateOpen((tabs) => {
      const position = tabs.findIndex(
        (tab) => tabRootOf(routes, tab.path) === root,
      );
      return position === -1 || tabs[position].pinned
        ? tabs
        : reseatPinned(tabs, position, tabs[position]);
    });
  }

  setPinned(path: string, pinned: boolean): void {
    const { routes, root } = this.rootFor(path);
    this.updateOpen((tabs) => {
      const position = tabs.findIndex(
        (tab) => tabRootOf(routes, tab.path) === root,
      );
      if (position === -1 || tabs[position].pinned === pinned) {
        return tabs;
      }
      const updated = pinned
        ? { ...tabs[position], pinned: true, preview: false }
        : { ...tabs[position], pinned: false };
      return reseatPinned(tabs, position, updated);
    });
  }

  private holdsInAddressPane(path: string): boolean {
    return this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .some((tab) => tab.path === path);
  }

  private followingAddress(
    routes: readonly ContentRoute[],
    route: ContentRoute,
  ): string | null {
    const active = this.activeRoute();
    const activePath = this.activePath();
    return followingTabAddress(route, {
      routes,
      params: active ? routeParams(active, activePath) : {},
      activePath,
      resolver: this.tabAddress,
    });
  }
}
