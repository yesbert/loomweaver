import { computed, inject, Service, Signal } from '@angular/core';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { PaneActions, leavesOf } from './pane-actions.service';
import { PaneHandle, paneHandle } from './pane-handle';
import { CONTENT_DOCK } from './tree/pane-address';
import { leafPath } from './tree/pane-node';
import { findLeaf } from './tree/pane-queries';
import { PaneTreeService } from './tree/pane-tree.service';

/** What the workbench knows about one pane of the content area, as facts rather than as the tree. */
export interface PaneFacts {
  /** Names the pane; stable while it exists. */
  readonly handle: PaneHandle;
  /** The path of the item the pane is showing, or `null` for an empty pane. */
  readonly showing: string | null;
  /** How many items the pane holds. */
  readonly itemCount: number;
  /** Whether this is the pane whose content the address bar reflects. */
  readonly carriesAddress: boolean;
  /** Whether the pane currently fills the whole content area. */
  readonly maximized: boolean;
  /** Whether the pane is collapsed into its strip. */
  readonly minimized: boolean;
}

/**
 * The arrangement side of the content area for a distribution: what the pane controls do, reachable
 * from your own code, plus the arrangement as facts. Content stays with `ContentTabsService` (open,
 * navigate, pin, close a tab); this service is about the panes those tabs sit in.
 *
 * ```ts
 * const panes = inject(PaneService);
 * panes.isSplit();                 // Signal<boolean>
 * panes.panes();                   // PaneFacts[] in layout order
 * panes.splitRight();              // duplicates what the address pane shows, like the toolbar
 * panes.closePane(handle);         // asks about unsaved work exactly as the × would
 * ```
 *
 * Every action is the same code the control runs, with the same guards. Without a handle an action
 * means the pane that carries the address. A handle of a pane that is gone does nothing. The
 * capability switches do not reach this service: what a distribution switched off for its users it
 * can still do from here.
 */
@Service()
export class PaneService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly chrome = inject(PaneChromeService);
  private readonly actions = inject(PaneActions);

  /** Every pane of the content area, in layout order. */
  readonly panes: Signal<readonly PaneFacts[]> = computed(() => {
    const primary = this.paneTree.primaryId(CONTENT_DOCK);
    return leavesOf(this.paneTree.tree(CONTENT_DOCK)).map((leaf) => ({
      handle: paneHandle(leaf.id),
      showing: leafPath(leaf) ?? null,
      itemCount: leaf.tabs.length,
      carriesAddress: leaf.id === primary,
      maximized: this.chrome.isMaximized(CONTENT_DOCK, leaf.id),
      minimized: this.chrome.isMinimized(CONTENT_DOCK, leaf.id),
    }));
  });

  /** The pane that carries the address; the default target of every action. */
  readonly activePane: Signal<PaneHandle> = computed(() =>
    paneHandle(this.paneTree.primaryId(CONTENT_DOCK)),
  );

  /** Whether the content area holds more than one pane. */
  readonly isSplit: Signal<boolean> = computed(() =>
    this.paneTree.isSplit(CONTENT_DOCK),
  );

  /** The pane that fills the area, or `null` when none does. */
  readonly maximized: Signal<PaneHandle | null> = computed(() => {
    const paneId = this.chrome.maximizedPaneIn(CONTENT_DOCK);
    return paneId === null ? null : paneHandle(paneId);
  });

  /** The panes collapsed into their strip. */
  readonly minimized: Signal<readonly PaneHandle[]> = computed(() =>
    this.panes()
      .filter((pane) => pane.minimized)
      .map((pane) => pane.handle),
  );

  /** Splits the pane to the right, duplicating what it shows. Nothing to duplicate, nothing happens. */
  splitRight(pane: PaneHandle = this.activePane()): void {
    this.actions.split(CONTENT_DOCK, pane, 'row');
  }

  /** Splits the pane downwards, duplicating what it shows. Nothing to duplicate, nothing happens. */
  splitDown(pane: PaneHandle = this.activePane()): void {
    this.actions.split(CONTENT_DOCK, pane, 'column');
  }

  /**
   * Closes the pane, asking about unsaved work first. Closing the pane that carries the address
   * promotes a neighbour; closing the only pane is a no-op.
   */
  closePane(pane: PaneHandle = this.activePane()): void {
    this.actions.close(CONTENT_DOCK, pane);
  }

  /** Collapses the area back to the address pane, asking first if another pane holds unsaved work. */
  unsplit(): void {
    this.actions.unsplit(CONTENT_DOCK);
  }

  /** Makes the pane fill the content area. */
  maximize(pane: PaneHandle = this.activePane()): void {
    this.actions.maximize(CONTENT_DOCK, pane);
  }

  /** Collapses the pane into its strip. */
  minimize(pane: PaneHandle = this.activePane()): void {
    this.actions.minimize(CONTENT_DOCK, pane);
  }

  /** Without a handle: ends the maximised state. With one: brings that pane back from either state. */
  restore(pane?: PaneHandle): void {
    this.actions.restore(CONTENT_DOCK, pane);
  }

  /** Moves the address to the pane, showing what that pane shows. */
  focus(pane: PaneHandle): void {
    this.actions.focus(CONTENT_DOCK, pane);
  }

  /** Moves an open item into the pane, as dropping it on the pane's strip would. */
  moveTab(path: string, pane: PaneHandle): void {
    this.actions.moveTab(path, CONTENT_DOCK, pane);
  }

  /** Whether the handle still names a pane. */
  exists(pane: PaneHandle): boolean {
    return findLeaf(this.paneTree.tree(CONTENT_DOCK), pane) !== null;
  }
}
