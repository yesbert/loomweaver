import { inject, Service, Signal } from '@angular/core';
import {
  ActiveContent,
  ContentTabLabel,
  OpenTabInput,
} from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import { ContentTabView } from './content-tab-projection';
import { ContentTabState } from './content-tab-state';
import { TabNavigationService } from './tab-navigation.service';
import { TabOpeningService } from './tab-opening.service';
import { TabClosingService } from './tab-closing.service';
import { QuickOpenTarget } from './quick-open-target';
import { updateTabLabel } from './tab-label-update';
import { PaneRef } from '../../pane/tree/pane-address';
import { keepsEverything } from '../../pane/tree/pane-handover';
import { sparedByBulkClose } from '../../pane/tree/pane-tabs';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { UnsavedWork } from '../../pane/unsaved-work/unsaved-work';

/**
 * The tabs of the pane that carries the address: what its strip shows, which tab is active, and
 * the ways to open, move, pin and close them. The open tabs live in that pane of the pane tree, so
 * they persist and reload with the arrangement; only the `onClose` hooks stay in the session. A tab
 * is identified by its tab root, and moving between the sub-routes below a root stays in one tab.
 * A chromeless surface shows no strip. The close methods take an optional {@link PaneRef}: naming a
 * pane that does not carry the address acts on that pane's tabs instead, asking about unsaved work
 * there first.
 */
@Service()
export class ContentTabsService {
  private readonly state = inject(ContentTabState);

  private readonly navigation = inject(TabNavigationService);

  private readonly opening = inject(TabOpeningService);

  private readonly closing = inject(TabClosingService);

  private readonly registry = inject(ContributionRegistry);

  private readonly features = inject(FeatureSwitches).content;

  private readonly paneTree = inject(PaneTreeService);

  private readonly unsavedWork = inject(UnsavedWork);

  /**
   * What the command palette's Quick Open lists: every open tab of every content pane, and every
   * registered route the user could open that takes no route parameter and is not chromeless. A
   * route the user has visited carries when it was last active in this session, and an open tab wins
   * over a route with the same path. View tabs are not listed; they are reached through their rail
   * item.
   *
   * A route that is not open is listed only when the session meets its `access` requirement; an open
   * tab is listed as the strip shows it. This is presentation, not enforcement: opening a target
   * still passes the route's access check, and content the session no longer qualifies for renders
   * the neutral placeholder.
   */
  readonly quickOpenTargets: Signal<readonly QuickOpenTarget[]> =
    this.state.quickOpenTargets;

  /** The active view tab of the pane that carries the address, or `null` while the address decides. */
  readonly activeViewPath: Signal<string | null> = this.state.activeViewPath;

  readonly activeViewInstance: Signal<string | undefined> =
    this.state.activeViewInstance;

  /** Active content path (no leading slash, no query), including the sub-route, e.g. `doc/abc/preview`. */
  readonly activePath: Signal<string> = this.state.activePath;

  /** The active tab root: the leading segments the active route matched, e.g. `doc/abc`. */
  readonly activeTabRoot: Signal<string> = this.state.activeTabRoot;

  /** The active content, as a plugin reads it through `ctx.activeContent`. */
  readonly activeContent: Signal<ActiveContent | null> =
    this.state.activeContent;

  /** Whether the strip is drawn: whenever the pane holds tabs, and never while a chromeless surface is active. */
  readonly showStrip: Signal<boolean> = this.state.showStrip;

  /**
   * Everything the strip holds, in order: the facet tabs of surfaces that follow the address, then
   * the open tabs, then the view tabs.
   */
  readonly tabs: Signal<readonly ContentTabView[]> = this.state.tabs;

  /**
   * Activates a view held as a tab beside the content tabs: the pane shows the view and the address
   * stays where it was. Does nothing unless the pane holds that tab.
   */
  activateViewTab(path: string): void {
    this.state.activateViewTab(path);
  }

  /**
   * Applies a reorder of the strip's movable tabs. `ids` is the new full order of their roots, pinned
   * first. A facet tab is left out, because the pane does not hold it. The order is written to the
   * pane that holds the tabs, as a reorder in any other pane is.
   */
  reorder(ids: string[]): void {
    this.state.reorder(ids);
  }

  /**
   * Moves the tab rooted at `path` to the front of the unpinned tabs, so a tab the strip had clipped
   * becomes visible again. Does nothing for a pinned or unknown tab.
   */
  bringToFront(path: string): void {
    this.state.bringToFront(path);
  }

  /**
   * Navigates the content area to a path: a full-area screen, another tab, or a sub-route.
   *
   * When another pane already holds that tab, that pane takes the address and the tab is activated
   * there, instead of a second copy opening beside the current one. Navigating ends a view tab's
   * selection.
   *
   * Does nothing in a pop-out window, with a warning in development: a pop-out shows exactly one
   * surface, and navigating it would take it out of its pop-out address.
   */
  navigate(path: string): Promise<boolean> {
    return this.navigation.navigate(path);
  }

  /** Like {@link navigate}, for a caller that does not wait: a failed navigation is logged. */
  navigateTo(path: string): void {
    this.navigation.navigateTo(path);
  }

  /**
   * Reveals a content tab where it already lives: a tab held by another pane is activated there and
   * that pane takes the address; anything else is navigated to. The tab is never duplicated.
   */
  revealContentTab(navPath: string): void {
    this.navigateTo(navPath);
  }

  /**
   * Opens a titled tab for `path` and activates it; opening the same root again restores its sub-route.
   * With `preview`, and preview enabled, a new tab takes the strip's single preview slot and replaces
   * the preview tab that was there, whose `onClose` runs. Opening a tab that is already open keeps
   * its preview state; {@link keep} promotes it.
   */
  open(input: OpenTabInput): void {
    this.opening.open(input);
  }

  /**
   * Changes the title, icon or badge of the open tab rooted at `path` where it stands, without bringing
   * it forward; what `label` leaves out stays, `badge: null` removes the tab's own badge. No-op when no
   * tab is open for `path`; with a `pluginId`, only content that plugin registered changes.
   */
  update(path: string, label: ContentTabLabel, pluginId?: string): void {
    updateTabLabel(this.paneTree, this.registry.contentRoutes(), {
      path,
      label,
      pluginId,
    });
  }

  /** Promotes the preview tab rooted at `path` to a permanent tab. Does nothing if it is permanent already. */
  keep(path: string): void {
    this.opening.keep(path);
  }

  /**
   * Pins the tab rooted at `path`: it moves behind the tabs already pinned, its close control becomes
   * an unpin control, and a preview tab is promoted. Does nothing if the tab is not open.
   */
  pin(path: string): void {
    this.state.setPinned(path, true);
  }

  /** Unpins the tab rooted at `path`; it takes the first place after the tabs still pinned. */
  unpin(path: string): void {
    this.state.setPinned(path, false);
  }

  /** Closes every tab in the strip except the target; pinned tabs and tabs that cannot close stay. */
  closeOthers(path: string, pane?: PaneRef): void {
    this.closing.closeOthers(path, pane);
  }

  /** Closes every tab in the strip; pinned tabs and tabs that cannot close stay. */
  closeAll(pane?: PaneRef): void {
    this.closing.closeAll(pane);
  }

  /** Closes the tabs after the target in the strip; pinned tabs stay. */
  closeToRight(path: string, pane?: PaneRef): void {
    this.closing.closeToRight(path, pane);
  }

  /**
   * Closes the pane that carries the address, in a split: a neighbour takes the address, is navigated
   * to, and receives the pinned tabs and those that cannot close (every tab while closing is switched
   * off). Unsaved work in the tabs that really close is asked about first.
   */
  closePrimaryPane(): void {
    this.closing.closePrimaryPane(
      this.features.close() ? sparedByBulkClose : keepsEverything,
    );
  }

  /**
   * Closes a tab, by any path below its root. If it was active, a neighbour is navigated to first.
   * The pane that showed it lets its surface go once the tab is no longer open anywhere.
   */
  close(path: string, pane?: PaneRef): void {
    this.closing.close(path, pane);
  }

  /**
   * Runs and clears the close hook of the tab rooted at `path`, for a close outside the pane that
   * carries the address. Does nothing while the tab is still open there, since closing it there runs
   * the hook.
   */
  runCloseHook(path: string): void {
    this.closing.runCloseHook(path);
  }

  /**
   * Whether the surface at `path` holds **unsaved work** — the fact behind the mark the workbench
   * draws on a tab, readable so that a distribution can draw its own: a badge in the status bar, a
   * count beside a module, a mark on a row in a list. An arrangement answers for what is inside it,
   * so a document whose panel is dirty reads `true` at the document's own address, and the answer
   * covers every pane the address is open in.
   *
   * It is a **reactive read**: call it inside a `computed` or a template and the reader follows the
   * work being saved without further wiring. `false` for an address with nothing open, because a
   * surface holding unsaved work is never destroyed while it does.
   */
  hasUnsavedWork(path: string): boolean {
    return this.unsavedWork.anywhere(path);
  }

  /**
   * Where the address goes when the tab rooted at `path` leaves the pane or closes: the last remaining
   * tab, else home (`''`).
   */
  neighbourOf(path: string): string {
    return this.closing.neighbourOf(path);
  }
}
