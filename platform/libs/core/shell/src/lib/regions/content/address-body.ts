import {
  Service,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { PaneLeaf, activeTab, leafPath } from '../pane/tree/pane-node';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContentTabsService } from './tabs/content-tabs.service';
import { CurrentAddress } from './current-address';
import { matchRoute, tabRootOf } from './content-path';

function untabbed(
  routes: readonly ContentRoute[],
  path: string,
  root: string,
): boolean {
  const route = matchRoute(routes, path);
  return (
    route === undefined ||
    route.chromeless === true ||
    route.follows === true ||
    root === ''
  );
}

@Service()
export class AddressBody {
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly tabs = inject(ContentTabsService);
  private readonly address = inject(CurrentAddress);

  private readonly settling = signal(false);
  private lastPrimary = untracked(() => this.paneTree.primaryId(CONTENT_DOCK));
  private lastPath = untracked(() => this.address.snapshot().path);

  readonly showsSurface = computed(
    () => this.settling() || this.address.showsContent(),
  );

  constructor() {
    effect(() => {
      const primary = this.paneTree.primaryId(CONTENT_DOCK);
      const path = this.address.snapshot().path;
      untracked(() => {
        if (path !== this.lastPath) {
          this.settling.set(false);
        } else if (primary !== this.lastPrimary) {
          this.settling.set(true);
        }
        this.lastPrimary = primary;
        this.lastPath = path;
      });
    });
  }

  pathFor(leaf: PaneLeaf): string {
    const view = this.tabs.activeViewPath();
    if (view !== null) {
      return view;
    }
    const routes = this.registry.contentRoutes();
    const url = this.address.snapshot().path;
    const root = tabRootOf(routes, url);
    const held = leaf.tabs.some(
      (tab) =>
        !tab.path.startsWith(VIEW_PANE_PREFIX) &&
        tabRootOf(routes, tab.path) === root,
    );
    if (held || (!this.settling() && untabbed(routes, url, root))) {
      return url;
    }
    return leafPath(leaf) ?? '';
  }

  instanceFor(leaf: PaneLeaf): string | undefined {
    return this.tabs.activeViewPath() === null
      ? activeTab(leaf)?.instance
      : this.tabs.activeViewInstance();
  }
}
