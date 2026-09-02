import {
  computed,
  effect,
  inject,
  isDevMode,
  Service,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { ActiveContent, ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AuthContext } from '../../../auth/auth-context';
import {
  isHomePath,
  matchRoute,
  normalizePath,
  routeParams,
  segmentsOf,
  suffixOf,
  tabRootOf,
} from '../content-path';
import {
  ContentTabView,
  OpenTab,
  dynamicTabViews,
  facetTabViews,
  toOpenTab,
  toPaneTab,
  viewTabViews,
} from './content-tab-projection';
import { TabCloseHooks } from './tab-close-hooks';
import { syncActiveTab } from './active-tab-sync';
import { QuickOpenTarget } from './quick-open-target';
import { TAB_ADDRESS_RESOLVER, computedTabAddress } from './tab-address';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../../pane/tree/pane-address';
import { collectTabs, findLeaf, findLeafWhere } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { isPopoutUrl } from '../../../popout/popout-path';
import { popoutNavigationRefusal } from '../../../popout/popout-refusal';

interface RootedPath {
  readonly routes: readonly ContentRoute[];
  readonly root: string;
}

@Service()
export class OpenTabsService {
  private readonly router = inject(Router);

  private readonly registry = inject(ContributionRegistry);

  private readonly auth = inject(AuthContext);

  private readonly paneTree = inject(PaneTreeService);

  private readonly tabAddress = inject(TAB_ADDRESS_RESOLVER, {
    optional: true,
  });

  private readonly closeHooks = inject(TabCloseHooks);

  private readonly inPopout = isPopoutUrl(inject(DOCUMENT).location.pathname);

  private readonly lastActive = signal<ReadonlyMap<string, number>>(new Map());

  readonly openTabs = computed<readonly OpenTab[]>(() => {
    const routes = this.registry.contentRoutes();
    return this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .filter((tab) => !tab.path.startsWith(VIEW_PANE_PREFIX))
      .map((tab) =>
        toOpenTab(
          routes,
          tab,
          this.closeHooks.get(tabRootOf(routes, tab.path)),
        ),
      );
  });

  readonly quickOpenTargets: Signal<readonly QuickOpenTarget[]> = computed(
    () => {
      const routes = this.registry.contentRoutes();
      const times = this.lastActive();
      const openRoots = new Set<string>();
      const open: QuickOpenTarget[] = [];
      for (const paneTab of collectTabs(this.paneTree.tree(CONTENT_DOCK))) {
        if (paneTab.path.startsWith(VIEW_PANE_PREFIX)) {
          continue;
        }
        const projected = toOpenTab(routes, paneTab, undefined);
        const root = tabRootOf(routes, projected.path);
        if (openRoots.has(root)) {
          continue;
        }
        openRoots.add(root);
        open.push({
          path: root,
          navPath: projected.path,
          title: projected.title,
          literalTitle: projected.literalTitle,
          icon: projected.icon,
          pinned: projected.pinned,
          closable: projected.closable,
          lastActive: times.get(root),
        });
      }
      const statics = routes.flatMap<QuickOpenTarget>((route) => {
        const path = normalizePath(route.path);
        if (
          path === '' ||
          path.includes(':') ||
          route.chromeless === true ||
          !this.auth.meets(route.access) ||
          openRoots.has(path)
        ) {
          return [];
        }
        return [
          {
            path,
            navPath: route.path,
            title: route.title ?? path,
            literalTitle:
              route.title === undefined
                ? true
                : (route.titleIsLiteral ?? false),
            icon: route.icon,
            pinned: false,
            closable: false,
            lastActive: times.get(path),
          },
        ];
      });
      return [...open, ...statics];
    },
  );

  private readonly viewTabSelection = signal<string | null>(null);

  readonly activeViewPath: Signal<string | null> = computed(() => {
    const path = this.viewTabSelection();
    return path !== null &&
      this.paneTree.primaryTabs(CONTENT_DOCK).some((tab) => tab.path === path)
      ? path
      : null;
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

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly activePath: Signal<string> = computed(() =>
    normalizePath(this.currentUrl()),
  );

  private readonly activeRoute = computed(() =>
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

  private readonly activeChromeless = computed(
    () => this.activeRoute()?.chromeless === true,
  );

  readonly showStrip: Signal<boolean> = computed(
    () => !this.activeChromeless() && this.tabs().length > 0,
  );

  readonly tabs: Signal<readonly ContentTabView[]> = computed(() => {
    const routes = this.registry.contentRoutes();
    const facets = facetTabViews(routes, (route) => this.addressOf(route));
    const open = this.openTabs().filter((tab) => this.strippable(routes, tab));
    const dynamics = dynamicTabViews(routes, open);
    return [...facets, ...dynamics, ...this.viewTabs()].toSorted(
      (a, b) => a.order - b.order,
    );
  });

  private readonly viewTabs = computed<readonly ContentTabView[]>(() =>
    viewTabViews(
      this.paneTree.primaryTabs(CONTENT_DOCK),
      (id) => this.registry.views().find((view) => view.id === id),
      (access) => this.auth.meets(access),
      VIEW_PANE_PREFIX,
    ),
  );

  private lastUrl = this.router.url;

  private ownNavigation: string | null = null;

  constructor() {
    effect(() => {
      const url = this.currentUrl();
      const path = this.activePath();
      const root = this.activeTabRoot();
      const route = this.activeRoute();
      this.paneTree.hydrated();
      untracked(() => {
        if (url !== this.lastUrl) {
          const previous = this.lastUrl;
          this.lastUrl = url;
          if (this.ownNavigation !== normalizePath(url)) {
            this.viewTabSelection.set(null);
            this.focusHolderOf(path, this.rootFor(previous).root);
          }
          this.ownNavigation = null;
        }
        syncActiveTab(
          {
            routes: this.registry.contentRoutes(),
            paneTree: this.paneTree,
            updateOpen: (change) => this.updateOpen(change),
          },
          route,
          root,
          path,
        );
        if (root) {
          this.stampActive(root);
        }
      });
    });
  }

  activateViewTab(path: string): void {
    if (
      this.paneTree.primaryTabs(CONTENT_DOCK).some((tab) => tab.path === path)
    ) {
      this.viewTabSelection.set(path);
    }
  }

  navigate(path: string): Promise<boolean> {
    if (this.inPopout) {
      if (isDevMode()) {
        console.warn(popoutNavigationRefusal(path));
      }
      return Promise.resolve(false);
    }
    const target = normalizePath(path);
    this.focusHolderOf(target, this.activeTabRoot());
    this.ownNavigation = target;
    this.viewTabSelection.set(null);
    return this.router.navigateByUrl('/' + target + suffixOf(path));
  }

  navigateTo(path: string): void {
    this.navigate(path).catch((error: unknown) =>
      console.error('Content navigation failed', error),
    );
  }

  updateOpen(
    function_: (tabs: readonly OpenTab[]) => readonly OpenTab[],
  ): void {
    const current = this.openTabs();
    const next = function_(current);
    if (next === current) {
      return;
    }
    const viewTabs = this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .filter((tab) => tab.path.startsWith(VIEW_PANE_PREFIX));
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

  private addressOf(route: ContentRoute): string | null {
    if (route.follows !== true) {
      return route.path;
    }
    const active = this.activeRoute();
    const params = active ? routeParams(active, this.activePath()) : {};
    const override = this.tabAddress?.({
      surfaceId: route.id,
      pattern: route.path,
      params,
      activePath: this.activePath(),
    });
    if (override) {
      return override;
    }
    const computed = computedTabAddress(route.path, params);
    return this.somewhereToGo(computed) ? computed : null;
  }

  private somewhereToGo(address: string): boolean {
    const routes = this.registry.contentRoutes();
    const owner = matchRoute(routes, address);
    if (!owner) {
      return false;
    }
    return (
      owner.rest === true ||
      segmentsOf(owner.path).length === segmentsOf(address).length
    );
  }

  private focusHolderOf(target: string, previousContent: string): void {
    const routes = this.registry.contentRoutes();
    const root = tabRootOf(routes, target);
    if (root === '') {
      return;
    }
    const rooted = (path: string) =>
      !path.startsWith(VIEW_PANE_PREFIX) && tabRootOf(routes, path) === root;
    const tree = this.paneTree.tree(CONTENT_DOCK);
    const primary = this.paneTree.primaryId(CONTENT_DOCK);
    if (findLeaf(tree, primary)?.tabs.some((tab) => rooted(tab.path))) {
      return;
    }
    const holder = findLeafWhere(
      tree,
      (leaf) =>
        leaf.id !== primary && leaf.tabs.some((tab) => rooted(tab.path)),
    );
    const held = holder?.tabs.find((tab) => rooted(tab.path));
    if (!holder || !held) {
      return;
    }
    this.paneTree.setActiveTab(CONTENT_DOCK, holder.id, held.path);
    this.paneTree.focusPane(CONTENT_DOCK, holder.id, previousContent);
  }

  private stampActive(root: string): void {
    const next = new Map(this.lastActive());
    next.set(root, Date.now());
    this.lastActive.set(next);
  }


  private strippable(routes: readonly ContentRoute[], tab: OpenTab): boolean {
    if (isHomePath(tab.path)) {
      return false;
    }
    const route = matchRoute(routes, tab.path);
    return (
      route !== undefined &&
      route.chromeless !== true &&
      route.follows !== true &&
      (normalizePath(route.path) !== '' || normalizePath(tab.path) === '')
    );
  }
}
