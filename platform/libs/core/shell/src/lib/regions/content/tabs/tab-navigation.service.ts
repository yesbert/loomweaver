import {
  computed,
  effect,
  inject,
  isDevMode,
  Service,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { normalizePath, suffixOf, tabRootOf } from '../content-path';
import { CurrentAddress } from '../current-address';
import {
  NavigationOptions,
  autoOpenedTab,
  withRefreshedPath,
} from './content-tab-projection';
import { ContentTabState } from './content-tab-state';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../../pane/tree/pane-address';
import { findLeaf, findLeafWhere } from '../../pane/tree/pane-queries';
import { activeContentPath } from '../../pane/tree/active-content-path';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PopoutWindow } from '../../../popout/popout-window';
import { popoutNavigationRefusal } from '../../../popout/popout-refusal';

interface AddressFacts {
  readonly url: string;
  readonly path: string;
  readonly root: string;
  readonly route: ContentRoute | undefined;
  readonly restored: boolean;
}

@Service()
export class TabNavigationService {
  private readonly router = inject(Router);

  private readonly registry = inject(ContributionRegistry);

  private readonly paneTree = inject(PaneTreeService);

  private readonly state = inject(ContentTabState);

  private readonly address = inject(CurrentAddress);

  private readonly inPopout = inject(PopoutWindow).active;

  private readonly keptAddress = signal<string | null>(null);

  private readonly navigating = computed(
    () => this.router.currentNavigation() !== null,
  );

  private lastUrl = this.router.url;

  private followed: AddressFacts | null = null;

  private ownNavigation: string | null = null;

  constructor() {
    effect(() => {
      if (this.navigating()) {
        return;
      }
      const now = this.currentFacts();
      const kept = this.keptAddress();
      untracked(() => this.follow(now, kept));
    });
  }

  keepAddress(address: string): void {
    this.keptAddress.set(normalizePath(address));
  }

  navigate(path: string, options: NavigationOptions = {}): Promise<boolean> {
    if (this.inPopout) {
      if (isDevMode()) {
        console.warn(popoutNavigationRefusal(path));
      }
      return Promise.resolve(false);
    }
    const target = normalizePath(path);
    this.revealHolderOf(target, this.state.activeTabRoot());
    this.ownNavigation = target;
    this.state.clearViewTabSelection();
    return this.router.navigateByUrl('/' + target + suffixOf(path), {
      replaceUrl: options.replace === true,
    });
  }

  navigateTo(path: string, options: NavigationOptions = {}): void {
    this.navigate(path, options).catch((error: unknown) =>
      console.error('Content navigation failed', error),
    );
  }

  private currentFacts(): AddressFacts {
    return {
      url: this.address.url(),
      path: this.state.activePath(),
      root: this.state.activeTabRoot(),
      route: this.state.activeRoute(),
      restored: this.paneTree.hydrated(),
    };
  }

  private follow(now: AddressFacts, kept: string | null): void {
    const keptHere = kept === now.path;
    if (kept !== null) {
      this.keptAddress.set(null);
    }
    const moved = now.url !== this.lastUrl;
    if (!moved && !keptHere && this.unchangedSinceFollowed(now)) {
      return;
    }
    const cameFromOutside =
      moved && this.ownNavigation !== normalizePath(now.url);
    if (keptHere || cameFromOutside) {
      this.state.clearViewTabSelection();
      const shown = keptHere ? activeContentPath(this.paneTree) : this.lastUrl;
      this.revealHolderOf(now.path, this.state.rootFor(shown).root);
    }
    if (moved) {
      this.lastUrl = now.url;
      this.ownNavigation = null;
    }
    this.followed = now;
    this.syncActiveTab(now);
  }

  private unchangedSinceFollowed(now: AddressFacts): boolean {
    const followed = this.followed;
    return (
      followed !== null &&
      now.restored === followed.restored &&
      now.route === followed.route &&
      now.root === followed.root
    );
  }

  private revealHolderOf(target: string, previousContent: string): void {
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

  private syncActiveTab({ path, root, route }: AddressFacts): void {
    const routes = this.registry.contentRoutes();
    this.state.updateOpen((tabs) => {
      const position = tabs.findIndex(
        (tab) => tabRootOf(routes, tab.path) === root,
      );
      if (position !== -1) {
        return withRefreshedPath(tabs, position, path);
      }
      const opened = autoOpenedTab(route, root, path);
      return opened ? [...tabs, opened] : tabs;
    });
    const held = this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .find((tab) => tabRootOf(routes, tab.path) === root);
    if (held) {
      this.paneTree.setActiveTab(
        CONTENT_DOCK,
        this.paneTree.primaryId(CONTENT_DOCK),
        held.path,
      );
    }
    if (root) {
      this.state.markActive(root);
    }
  }
}
