import { inject, Service, Signal } from '@angular/core';
import { ActiveContent, OpenTabInput } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../routing/content-reuse-strategy';
import { SHELL_FEATURES } from '../../../foundation/shell-features';
import { normalizePath, tabRootOf } from '../content-path';
import { ContentTabView, OpenTab } from './content-tab-projection';
import { TabCloseHooks } from './tab-close-hooks';
import { QuickOpenTarget } from './quick-open-target';
import { OpenTabsService } from './open-tabs.service';
import { TabClosingService } from './tab-closing.service';
import { refineTabTitles, reseatPinned } from '../../pane/tree/pane-tabs';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';

/**
 * The **URL pane's** tab state: the tabs to show (facet tabs of `follows`
 * surfaces + opened ones), and the active tab — all derived from the URL plus the open set. The open
 * set lives in the **pane tree's primary leaf**: the URL pane's tab group works like any
 * pane's, so its tabs persist and reload with the tree (R10); only the non-serialisable `onClose`
 * hooks stay session-local. A tab is identified by its **tab root**; sub-routes (`subRoutes`) live
 * under it, so switching sub-routes stays in one tab and is reflected in the URL. A **chromeless**
 * surface shows no strip.
 */
@Service()
export class ContentTabsService {
  private readonly state = inject(OpenTabsService);

  private readonly closing = inject(TabClosingService);

  private readonly registry = inject(ContributionRegistry);

  private readonly reuse = inject(ContentReuseStrategy);

  private readonly features = inject(SHELL_FEATURES).content;

  private readonly paneTree = inject(PaneTreeService);

  private readonly closeHooks = inject(TabCloseHooks);

  /**
   * The Quick-Open source for the command palette: every currently **open** tab across
   * **all content panes** (a split's secondary panes contribute theirs too), plus every registered
   * route the user could open — one that takes no route parameter and is not `chromeless`. A route
   * the user has visited carries its session `lastActive`; an open tab wins any path collision (it
   * keeps its pinned identity). View tabs are excluded — those are reached through their rail item.
   *
   * **Access:** an unopened route is offered only when the session meets its `access` requirement. An
   * already-open tab is listed as it is — matching the tab strip, which does not re-gate content tabs
   * either, which is a deliberate open point. Client-side gating is
   * presentation, not enforcement: opening the target still passes the router's `canMatch` twin, and an
   * off-router mount re-checks the session, so a target the session no longer qualifies for renders the
   * neutral placeholder rather than its content.
   */
  readonly quickOpenTargets: Signal<readonly QuickOpenTarget[]> = this.state.quickOpenTargets;

  /** The active `view:` tab of the URL group, or `null` when the router drives the area (R9). */
  readonly activeViewPath: Signal<string | null> = this.state.activeViewPath;

  readonly activeViewInstance: Signal<string | undefined> = this.state.activeViewInstance;

  /** Active content path (no leading slash, no query), including the sub-route, e.g. `doc/abc/preview`. */
  readonly activePath: Signal<string> = this.state.activePath;

  /** The active tab root — the leading segments the active route matched (e.g. `doc/abc`). */
  readonly activeTabRoot: Signal<string> = this.state.activeTabRoot;

  /** The active content read a plugin reaches through `ctx.activeContent` (finding #19). */
  readonly activeContent: Signal<ActiveContent | null> = this.state.activeContent;

  /**
   * Whether the tab strip renders: whenever the pane holds tabs — and never while a **chromeless**
   * surface (login, onboarding) is active. That is the whole rule since groups retired:
   * a pane shows a strip when it holds tabs; a chromeless surface shows none.
   */
  readonly showStrip: Signal<boolean> = this.state.showStrip;

  /**
   * Everything the strip holds: the permanent facet tabs (`follows` surfaces with a computed
   * address), then the open tabs, then the view tabs. Groups retired — every open tab
   * renders, in every workspace.
   */
  readonly tabs: Signal<readonly ContentTabView[]> = this.state.tabs;

  /**
   * Activates a `view:` tab of the URL group (O5/E7 — a view living as a tab beside the content tabs):
   * the content area host-mounts the view; the URL stays at its last route. No-op unless the group
   * actually holds that tab.
   */
  activateViewTab(path: string): void {
    this.state.activateViewTab(path);
  }

  /**
   * Applies a user drag/keyboard reorder of the strip's dynamic tabs. `ids` is the new full
   * order of dynamic tab roots (pinned then unpinned — the directive keeps moves within their band).
   *
   * The order is written to the pane that holds the tabs, exactly as a reorder in any other pane is.
   * It used to be kept beside the tree under one key for the whole content dock, which meant the URL
   * pane sorted its strip by that key while every other pane rendered the tabs in the order the tree
   * held them — so the same tabs changed order as the URL role moved between panes (TreeWeaver #41).
   */
  reorder(ids: string[]): void {
    const routes = this.registry.contentRoutes();
    const rank = new Map(ids.map((id, index) => [id, index]));
    const seat = (tab: OpenTab, fallback: number) =>
      rank.get(tabRootOf(routes, tab.path)) ?? fallback;
    this.state.updateOpen((tabs) =>
      tabs
        .map((tab, index) => ({ tab, index }))
        .sort((a, b) => seat(a.tab, a.index) - seat(b.tab, b.index))
        .map((entry) => entry.tab),
    );
  }

  /**
   * Moves the tab rooted at `path` to the front of the strip's unpinned band (MRU). The strip does not
   * scroll: tabs that no longer fit are clipped away, reachable via the overflow
   * dropdown or the Library. Reopening such a tab front-inserts it here so it becomes visible while the
   * least-recent tabs drop off the end. No-op for a pinned (anchored) or unknown tab. It moves the tab
   * in the pane's own tab list, exactly as a drag-reorder does, so every pane shows the one
   * order; the host calls it only when the active tab is actually clipped, so tabs that already fit
   * keep their order.
   */
  bringToFront(path: string): void {
    const { routes, root } = this.state.rootFor(path);
    this.state.updateOpen((tabs) => {
      const index = tabs.findIndex(
        (tab) => tabRootOf(routes, tab.path) === root,
      );
      return index < 0 || tabs[index].pinned
        ? tabs
        : reseatPinned(tabs, index, tabs[index]);
    });
  }

  /**
   * Navigates the content area to a path (a full-area screen, another tab, a specific sub-route).
   *
   * If another pane already holds that tab, **that pane becomes the URL pane** and the tab is activated
   * there instead of a second copy opening beside the current one: exactly one pane carries the
   * address, and the address follows the focused pane. Without this, a workspace that parks a surface
   * in its own pane would gain a duplicate of it the moment a rail item or command navigated there, because
   * every visit opens a tab.
   *
   * Ends any view-tab selection here and marks the navigation as ours, so the URL effect — which exists
   * to end the selection on **external** moves like back/forward or a deep link — leaves alone whatever
   * the caller selects once this settles.
   *
   * **A no-op in a pop-out window**, with a dev-mode warning. A pop-out shows exactly one surface and
   * has no tab strip; navigating it would take its address out of `/popout/…`, and the window would
   * quietly stop being a pop-out — chrome-less until the next reload, and the full app after it. Same
   * reasoning as a docked surface, whose `navigate` is a no-op for want of a content area.
   */
  navigate(path: string): Promise<boolean> {
    return this.state.navigate(path);
  }

  /**
   * Fire-and-forget navigation: like {@link navigate}, but owns the "navigation may fail"
   * semantics — a rejected router navigation is logged instead of surfacing as an unhandled
   * rejection. Call sites that do not await the outcome use this.
   */
  navigateTo(path: string): void {
    this.state.navigateTo(path);
  }

  /**
   * Reveals a content tab **where it already lives** (Quick-Open): a tab held by another pane is
   * activated there and that pane takes the address; anything else simply navigates. Either way the tab is
   * never duplicated into the URL pane. Since {@link navigate} carries that rule, this is the name the
   * Quick-Open call site reads by — the behaviour is the same for every way of reaching a tab.
   */
  revealContentTab(navPath: string): void {
    this.navigateTo(navPath);
  }

  /**
   * Opens a titled dynamic tab (idempotent per tab root; re-opening restores its sub-route) and activates
   * it. With `preview` (and preview enabled) a **new** tab uses the strip's **single reused preview slot**
   *: a preview open for a *different* path replaces that slot in place (the old instance is
   * evicted + its `onClose` runs). Re-opening an **existing** tab preserves its current preview state (a
   * mere title/sub-route refinement never promotes); promotion is explicit via {@link keep}.
   */
  open(input: OpenTabInput): void {
    const routes = this.registry.contentRoutes();
    const path = normalizePath(input.path);
    const root = tabRootOf(routes, path);
    const previewSlot = (input.preview ?? false) && this.features.preview;
    const existing = this.state.openTabRootedAt(routes, root);
    this.closeHooks.set(root, input.onClose);
    if (!existing && this.refineElsewhere(root, input)) {
      return;
    }
    const stored: OpenTab = {
      path: existing?.path ?? path,
      title: input.title,
      literalTitle: input.titleIsLiteral ?? false,
      icon: input.icon,
      onClose: input.onClose,
      preview: existing ? existing.preview : previewSlot,
      pinned: existing ? existing.pinned : false,
      closable: existing ? existing.closable : true,
    };
    if (previewSlot && !existing) {
      this.replacePreviewSlot(root, stored);
    } else {
      this.state.updateOpen((tabs) =>
        existing
          ? tabs.map((tab) =>
              tabRootOf(routes, tab.path) === root ? stored : tab,
            )
          : [...tabs, stored],
      );
    }
    this.navigateTo(stored.path);
  }

  /**
   * Promotes the preview tab rooted at `path` to a permanent tab — the programmatic
   * "Keep Open" (`ctx.keepContentTab`, a double-click, or an edit). No-op if it is already permanent.
   */
  keep(path: string): void {
    const { routes, root } = this.state.rootFor(path);
    this.state.updateOpen((tabs) =>
      tabs.map((tab) =>
        tabRootOf(routes, tab.path) === root && tab.preview
          ? { ...tab, preview: false }
          : tab,
      ),
    );
  }

  /**
   * Pins the tab rooted at `path`: it moves to the front of the strip — after the tabs
   * already pinned — and its close control becomes an unpin control (guarding against accidental
   * close). Pinning also promotes a preview tab (a pinned tab is never transient). No-op if the tab is
   * not open.
   */
  pin(path: string): void {
    this.repin(path, true);
  }

  /**
   * Unpins the tab rooted at `path` — it returns to a normal, closable tab and takes the
   * first seat after the tabs still pinned. No-op otherwise.
   */
  unpin(path: string): void {
    this.repin(path, false);
  }

  /** Closes every dynamic tab in the strip except the target — pinned and unclosable tabs are kept. */
  closeOthers(path: string): void {
    this.closing.closeOthers(path);
  }

  /** Closes every dynamic tab in the strip — pinned and unclosable tabs are kept. */
  closeAll(): void {
    this.closing.closeAll();
  }

  /** Closes the dynamic tabs that render after the target in the strip — pinned tabs are kept. */
  closeToRight(path: string): void {
    this.closing.closeToRight(path);
  }

  /**
   * Closes the **primary (URL) pane** of a split — the pane-toolbar "Close pane" on the URL pane: the
   * primary leaf collapses, a neighbour is promoted to URL pane and navigated to. Guarded like every
   * other user-initiated close: unsaved changes in any of the primary group's tabs run
   * the host's Save · Discard · Cancel dialog first.
   */
  closePrimaryPane(): void {
    this.closing.closePrimaryPane();
  }

  /**
   * Closes a dynamic tab (by any path under its root). If it was active, we navigate to a neighbour
   * **first**, then evict the stored instance (keyed by the tab root — see {@link ContentReuseStrategy});
   * a background tab is evicted immediately.
   */
  close(path: string): void {
    this.closing.close(path);
  }

  /**
   * Runs (and clears) the close hook of the tab rooted at `path` — for a close that happens **outside**
   * the URL group (a moved tab closed in another pane). No-op while the tab is still open
   * in the URL group (its own {@link close} will run the hook).
   */
  runCloseHook(path: string): void {
    this.closing.runCloseHook(path);
  }

  /**
   * The URL pane's neighbour of the tab rooted at `path` — where the URL goes when that tab **leaves**
   * the pane (moved away) or closes: the last remaining sibling, else home (`''` — the
   * "no file is open" default).
   */
  neighbourOf(path: string): string {
    return this.closing.neighbourOf(path);
  }

  private repin(path: string, pinned: boolean): void {
    const { routes, root } = this.state.rootFor(path);
    this.state.updateOpen((tabs) => {
      const index = tabs.findIndex(
        (tab) => tabRootOf(routes, tab.path) === root,
      );
      if (index < 0 || tabs[index].pinned === pinned) {
        return tabs;
      }
      const updated = pinned
        ? { ...tabs[index], pinned: true, preview: false }
        : { ...tabs[index], pinned: false };
      return reseatPinned(tabs, index, updated);
    });
  }

  private replacePreviewSlot(root: string, slot: OpenTab): void {
    const routes = this.registry.contentRoutes();
    const previous = this.state.openTabs().find((tab) => tab.preview);
    const previousRoot = previous
      ? tabRootOf(routes, previous.path)
      : undefined;
    this.state.updateOpen((tabs) =>
      previous
        ? tabs.map((tab) =>
            tabRootOf(routes, tab.path) === previousRoot ? slot : tab,
          )
        : [...tabs, slot],
    );
    if (previousRoot !== undefined && previousRoot !== root) {
      this.reuse.evict(previousRoot);
      this.closeHooks.runSafely(previous?.onClose);
      this.closeHooks.delete(previousRoot);
    }
  }

  private refineElsewhere(root: string, input: OpenTabInput): boolean {
    const routes = this.registry.contentRoutes();
    const urlPane = this.paneTree.primaryId(CONTENT_DOCK);
    let foundAnywhere = false;
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      const { node, found } = refineTabTitles(
        tree,
        (leaf) => dock === CONTENT_DOCK && leaf.id === urlPane,
        (tabPath) => tabRootOf(routes, tabPath) === root,
        {
          title: input.title,
          literalTitle: input.titleIsLiteral ?? false,
          icon: input.icon,
        },
      );
      if (found) {
        this.paneTree.commitTree(dock, node);
        foundAnywhere = true;
      }
    }
    return foundAnywhere;
  }
}
