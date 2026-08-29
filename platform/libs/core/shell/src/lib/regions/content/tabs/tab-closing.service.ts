import { inject, Service } from '@angular/core';
import { ChildrenOutletContexts } from '@angular/router';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../routing/content-reuse-strategy';
import { normalizePath, tabRootOf } from '../content-path';
import { TabCloseHooks } from './tab-close-hooks';
import { OpenTabsService } from './open-tabs.service';
import { CONTENT_DOCK, VIEW_PANE_PREFIX, promotedContentPath } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { RetainedViewStash } from '../../pane/retention/retained-view-stash';
import {
  containerChildInstances,
  paneRetentionScope,
} from '../../pane/retention/retention-policy';
import { SurfaceCloseGuard } from '../../pane/close/surface-close-guard';

@Service()
export class TabClosingService {
  private readonly state = inject(OpenTabsService);

  private readonly registry = inject(ContributionRegistry);

  private readonly reuse = inject(ContentReuseStrategy);

  private readonly paneTree = inject(PaneTreeService);

  private readonly stash = inject(RetainedViewStash);

  private readonly closeGuard = inject(SurfaceCloseGuard);

  private readonly outletContexts = inject(ChildrenOutletContexts);

  private readonly closeHooks = inject(TabCloseHooks);

  closeOthers(path: string): void {
    const { routes, root: keep } = this.state.rootFor(path);
    const target = this.state.openTabRootedAt(routes, keep);
    const roots = new Set(
      this.state.openTabs()
        .filter(
          (tab) =>
            !tab.pinned && tab.closable && tabRootOf(routes, tab.path) !== keep,
        )
        .map((tab) => tabRootOf(routes, tab.path)),
    );
    this.closeGuard.guarded(this.closeSetCandidates(roots), () =>
      this.closeSet(roots, target?.path ?? keep),
    );
  }

  closeAll(): void {
    const routes = this.registry.contentRoutes();
    const roots = new Set(
      this.state.openTabs()
        .filter((tab) => !tab.pinned && tab.closable)
        .map((tab) => tabRootOf(routes, tab.path)),
    );
    const survivor = this.state.openTabs().find((tab) => tab.pinned || !tab.closable);
    this.closeGuard.guarded(this.closeSetCandidates(roots), () =>
      this.closeSet(roots, survivor?.path ?? ''),
    );
  }

  closeToRight(path: string): void {
    const { routes, root: keep } = this.state.rootFor(path);
    const rendered = this.state.tabs();
    const index = rendered.findIndex((tab) => tab.path === keep);
    const roots = new Set(
      rendered
        .slice(index + 1)
        .filter((tab) => tab.closable && !tab.pinned)
        .map((tab) => tab.path),
    );
    const target = this.state.openTabRootedAt(routes, keep);
    this.closeGuard.guarded(this.closeSetCandidates(roots), () =>
      this.closeSet(roots, target?.path ?? keep),
    );
  }

  closePrimaryPane(): void {
    const routes = this.registry.contentRoutes();
    const candidates = this.paneTree
      .primaryTabs(CONTENT_DOCK)
      .flatMap((tab) =>
        tab.path.startsWith(VIEW_PANE_PREFIX)
          ? this.urlPaneViewCandidates(tab.path)
          : this.urlPaneCandidates(tabRootOf(routes, tab.path)),
      );
    this.closeGuard.guarded(candidates, () => {
      const promoted = this.paneTree.collapsePrimary(CONTENT_DOCK);
      if (promoted !== null) {
        void this.navigateAfterClose(promoted);
      }
    });
  }

  close(path: string): void {
    const normalized = normalizePath(path);
    if (normalized.startsWith(VIEW_PANE_PREFIX)) {
      this.closeGuard.guarded(this.urlPaneViewCandidates(normalized), () =>
        this.closeViewTab(normalized),
      );
      return;
    }
    const { root } = this.state.rootFor(normalized);
    this.closeGuard.guarded(this.urlPaneCandidates(root), () =>
      this.closeNow(normalized),
    );
  }

  runCloseHook(path: string): void {
    const { routes, root } = this.state.rootFor(path);
    if (this.state.openTabs().some((tab) => tabRootOf(routes, tab.path) === root)) {
      return;
    }
    this.closeHooks.runSafely(this.closeHooks.take(root));
  }

  neighbourOf(path: string): string {
    const { root } = this.state.rootFor(path);
    return this.neighbourPath(root);
  }

  private closeNow(normalized: string): void {
    const { routes, root } = this.state.rootFor(normalized);
    const closing = this.state.openTabRootedAt(routes, root);
    const wasActive = this.state.activeTabRoot() === root;
    this.state.updateOpen((tabs) =>
      tabs.filter((tab) => tabRootOf(routes, tab.path) !== root),
    );
    this.closeHooks.runSafely(closing?.onClose);
    this.closeHooks.delete(root);
    if (wasActive) {
      void this.navigateAfterClose(this.collapseOrNeighbour(root)).finally(() =>
        this.reuse.evict(root),
      );
    } else {
      this.reuse.evict(root);
    }
  }

  private closeViewTab(path: string): void {
    this.paneTree.setPrimaryTabs(
      CONTENT_DOCK,
      this.paneTree
        .primaryTabs(CONTENT_DOCK)
        .filter((tab) => tab.path !== path),
    );
  }

  private urlPaneViewCandidates(path: string): unknown[] {
    return this.stash.instancesFor(
      paneRetentionScope(CONTENT_DOCK, this.paneTree.primaryId(CONTENT_DOCK)),
      path,
    );
  }

  private urlPaneCandidates(root: string): unknown[] {
    const candidates: unknown[] = [...this.urlPaneViewCandidates(root)];
    if (this.state.activeTabRoot() === root) {
      const outlet = this.outletContexts.getContext('primary')?.outlet;
      if (outlet?.isActivated) {
        candidates.push(outlet.component);
      }
    }
    const parked = this.reuse
      .parkedHandles()
      .find((handle) => handle.key === root);
    if (parked?.instance !== undefined) {
      candidates.push(parked.instance);
    }
    candidates.push(
      ...containerChildInstances(this.stash.keyedInstances(), root),
    );
    return candidates;
  }

  private closeSetCandidates(roots: ReadonlySet<string>): unknown[] {
    return [...roots].flatMap((root) => this.urlPaneCandidates(root));
  }

  private closeSet(roots: ReadonlySet<string>, fallbackPath: string): void {
    if (roots.size === 0) {
      return;
    }
    const routes = this.registry.contentRoutes();
    const closing = this.state.openTabs().filter((tab) =>
      roots.has(tabRootOf(routes, tab.path)),
    );
    const activeWentAway = roots.has(this.state.activeTabRoot());
    this.state.updateOpen((tabs) =>
      tabs.filter((tab) => !roots.has(tabRootOf(routes, tab.path))),
    );
    closing.forEach((tab) => this.closeHooks.runSafely(tab.onClose));
    roots.forEach((root) => this.closeHooks.delete(root));
    const evictAll = () => roots.forEach((root) => this.reuse.evict(root));
    if (activeWentAway) {
      void this.state.navigate(fallbackPath)
        .catch((error: unknown) =>
          console.error('Content navigation failed', error),
        )
        .finally(evictAll);
    } else {
      evictAll();
    }
  }

  private navigateAfterClose(target: string): Promise<void> {
    return this.state.navigate(promotedContentPath(target))
      .then(() => {
        if (target.startsWith(VIEW_PANE_PREFIX)) {
          this.state.activateViewTab(target);
        }
      })
      .catch((error: unknown) =>
        console.error('Content navigation failed', error),
      );
  }

  private collapseOrNeighbour(root: string): string {
    if (
      this.paneTree.primaryTabs(CONTENT_DOCK).length === 0 &&
      this.paneTree.isSplit(CONTENT_DOCK)
    ) {
      const promoted = this.paneTree.collapsePrimary(CONTENT_DOCK);
      if (promoted !== null) {
        return promoted;
      }
    }
    return this.neighbourPath(root);
  }

  private neighbourPath(root: string): string {
    const routes = this.registry.contentRoutes();
    const siblings = this.state.openTabs().filter(
      (tab) => tabRootOf(routes, tab.path) !== root,
    );
    return siblings.at(-1)?.path ?? '';
  }
}
