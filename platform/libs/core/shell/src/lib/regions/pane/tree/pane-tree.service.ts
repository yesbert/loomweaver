import { inject, Service, signal } from '@angular/core';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { paneRetentionScope } from '../retention/retention-policy';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from './pane-address';
import { PRIMARY_LEAF, PaneNode, PaneTab, activeTab } from './pane-node';
import {
  collectLeafIds,
  findLeaf,
  findLeafWhere,
  paneSegments,
  tabHolderOf,
} from './pane-queries';
import { clampRatio, withRatio } from './pane-ratio';
import { DockEntry, healedPrimary } from './pane-restore';
import { PaneTreeStorage, isDefault } from './pane-tree-storage';
import {
  dethroneLeaf,
  pruneEmptyLeaves,
  removeLeaf,
  splitLeaf,
} from './pane-structure';
import {
  clearTabInstance,
  insertTab,
  keepTab,
  pinTab,
  removeTab,
  setActiveTab,
  setTabs,
  unpinTab,
} from './pane-tabs';
import { isContainerDock } from '../container/container-children';

@Service()
export class PaneTreeService {
  private readonly storage = inject(PaneTreeStorage);
  private readonly stash = inject(RetainedViewStash);

  private readonly docks = signal<Record<string, DockEntry>>(
    this.storage.peek(),
  );
  private readonly hydratedTree = signal(false);
  readonly hydrated = this.hydratedTree.asReadonly();

  constructor() {
    this.storage.hydrate(
      (raw) => this.applyHydratedTrees(raw),
      () => this.hydratedTree.set(true),
    );
  }

  tree(dock: string): PaneNode {
    return this.docks()[dock]?.node ?? PRIMARY_LEAF;
  }

  primaryId(dock: string): string {
    return this.docks()[dock]?.primary ?? PRIMARY_PANE;
  }

  dockTrees(): Record<string, PaneNode> {
    const out: Record<string, PaneNode> = {};
    for (const [dock, entry] of Object.entries(this.docks())) {
      out[dock] = entry.node;
    }
    return out;
  }

  isSplit(dock: string): boolean {
    return this.tree(dock).kind === 'split';
  }

  unsplit(dock: string): void {
    this.commit(
      dock,
      findLeaf(this.tree(dock), this.primaryId(dock)) ?? PRIMARY_LEAF,
    );
  }

  splitPane(
    dock: string,
    paneId: string,
    orientation: 'row' | 'column',
    path: string,
    position: 'before' | 'after' = 'after',
  ): void {
    this.commit(
      dock,
      splitLeaf(this.tree(dock), paneId, orientation, path, position),
    );
  }

  stackView(dock: string, viewId: string): void {
    const segments = paneSegments(this.tree(dock));
    const last = segments[segments.length - 1];
    if (last) {
      this.splitPane(dock, last.id, 'column', VIEW_PANE_PREFIX + viewId);
    }
  }

  closePane(dock: string, paneId: string): void {
    if (paneId === this.primaryId(dock)) {
      return;
    }
    this.commit(dock, removeLeaf(this.tree(dock), paneId) ?? PRIMARY_LEAF);
  }

  insertTab(dock: string, paneId: string, path: string): void {
    this.commit(dock, insertTab(this.tree(dock), paneId, { path }));
  }

  pointAt(dock: string, paneId: string): void {
    const tree = this.tree(dock);
    if (this.primaryId(dock) === paneId || !findLeaf(tree, paneId)) {
      return;
    }
    this.commit(dock, tree, paneId);
  }

  primaryTabs(dock: string): readonly PaneTab[] {
    return findLeaf(this.tree(dock), this.primaryId(dock))?.tabs ?? [];
  }

  setPrimaryTabs(dock: string, tabs: readonly PaneTab[]): void {
    this.commit(dock, setTabs(this.tree(dock), this.primaryId(dock), tabs));
  }

  reorderPaneTabs(
    dock: string,
    paneId: string,
    order: readonly string[],
  ): void {
    const leaf = findLeaf(this.tree(dock), paneId);
    if (!leaf) {
      return;
    }
    const rank = new Map(order.map((path, index) => [path, index]));
    const tabs = [...leaf.tabs].toSorted(
      (a, b) =>
        (rank.get(a.path) ?? leaf.tabs.indexOf(a)) -
        (rank.get(b.path) ?? leaf.tabs.indexOf(b)),
    );
    this.commit(dock, setTabs(this.tree(dock), paneId, tabs));
  }

  commitTree(dock: string, node: PaneNode): void {
    this.commit(dock, node);
  }
  commit(dock: string, next: PaneNode, primary?: string): void {
    this.update(dock, next, primary);
    this.persist();
  }

  setActiveTab(dock: string, paneId: string, tabPath: string): void {
    if (findLeaf(this.tree(dock), paneId)?.active === tabPath) {
      return;
    }
    this.commit(dock, setActiveTab(this.tree(dock), paneId, tabPath));
  }

  clearTabInstance(dock: string, paneId: string, tabPath: string): void {
    this.commit(dock, clearTabInstance(this.tree(dock), paneId, tabPath));
  }

  hasTab(path: string): boolean {
    return this.sourceOf(path) !== null;
  }

  sourceOf(path: string): { dock: string; paneId: string } | null {
    for (const [dock, entry] of Object.entries(this.docks())) {
      const paneId = tabHolderOf(entry.node, path);
      if (paneId !== null) {
        return { dock, paneId };
      }
    }
    return null;
  }

  seedPrimaryTabs(
    dock: string,
    paths: readonly string[],
    order: readonly string[] = paths,
  ): void {
    if (paths.length === 0) {
      return;
    }
    const tree = this.tree(dock);
    const primary = this.primaryId(dock);
    const existing = findLeaf(tree, primary)?.tabs ?? [];
    const rank = new Map(order.map((path, index) => [path, index]));
    const tabs = [...existing];
    for (const path of paths) {
      const target = rank.get(path) ?? Number.MAX_SAFE_INTEGER;
      const before = tabs.findIndex(
        (tab) => (rank.get(tab.path) ?? -1) > target,
      );
      tabs.splice(before === -1 ? tabs.length : before, 0, { path });
    }
    this.commit(dock, setTabs(tree, primary, tabs));
  }

  removeTab(dock: string, paneId: string, tabPath: string): void {
    const tree = this.tree(dock);
    const primary = this.primaryId(dock);
    const leaf = paneId === primary ? findLeaf(tree, primary) : undefined;
    if (leaf && leaf.tabs.every((tab) => tab.path !== tabPath)) {
      return;
    }
    if (leaf && !leaf.declared && leaf.tabs.length <= 1) {
      if (tree.kind === 'split') {
        this.commit(dock, removeLeaf(tree, primary) ?? PRIMARY_LEAF);
      }
      return;
    }
    this.commit(
      dock,
      removeTab(tree, paneId, tabPath, primary) ?? PRIMARY_LEAF,
    );
  }

  unpinTab(dock: string, paneId: string, tabPath: string): void {
    this.commit(dock, unpinTab(this.tree(dock), paneId, tabPath));
  }

  keepTab(dock: string, paneId: string, tabPath: string): void {
    this.commit(dock, keepTab(this.tree(dock), paneId, tabPath));
  }

  pinTab(dock: string, paneId: string, tabPath: string): void {
    this.commit(dock, pinTab(this.tree(dock), paneId, tabPath));
  }

  collapsePrimary(dock: string): string | null {
    const collapsed = removeLeaf(this.tree(dock), this.primaryId(dock));
    if (collapsed === null) {
      return null;
    }
    this.commit(dock, collapsed);
    const promoted = findLeaf(collapsed, this.primaryId(dock));
    return promoted ? (activeTab(promoted)?.path ?? '') : '';
  }

  focusPane(
    dock: string,
    paneId: string,
    previousContent: string | null,
  ): string | null {
    const leaf = paneSegments(this.tree(dock)).find(
      (segment) => segment.id === paneId,
    );
    const path = leaf?.path;
    const primary = this.primaryId(dock);
    if (
      paneId === primary ||
      path === undefined ||
      path === '' ||
      path.startsWith(VIEW_PANE_PREFIX)
    ) {
      return null;
    }
    const dethroned = dethroneLeaf(this.tree(dock), primary, previousContent);
    const spare = previousContent === null ? undefined : primary;
    const next = pruneEmptyLeaves(dethroned, paneId, spare) ?? PRIMARY_LEAF;
    this.commit(dock, next, paneId);
    return path;
  }

  resizeStream(dock: string, splitId: string, ratio: number): void {
    this.update(dock, withRatio(this.tree(dock), splitId, clampRatio(ratio)));
  }

  resizeCommit(): void {
    this.persist();
  }

  hasDock(dock: string): boolean {
    return this.docks()[dock] !== undefined;
  }

  dropDock(dock: string): void {
    if (!this.docks()[dock]) {
      return;
    }
    this.docks.update((docks) => {
      const next = { ...docks };
      delete next[dock];
      return next;
    });
    this.persist();
  }

  hydrate(raw: string | undefined): void {
    const next = this.storage.parsed(raw);
    for (const dock of Object.keys(this.docks())) {
      this.stash.evacuate(`${dock}:`);
      this.evacuateRemovedPanes(dock, next[dock]?.node ?? PRIMARY_LEAF);
    }
    this.docks.set(next);
    this.persist();
  }

  serialize(): string {
    return this.storage.serialize(this.docks());
  }

  landingPane(dock: string): string {
    return (
      findLeafWhere(this.tree(dock), (leaf) => leaf.declared === true)?.id ??
      this.primaryId(dock)
    );
  }

  private applyHydratedTrees(raw: string | undefined): void {
    const persisted = this.storage.parsed(raw);
    this.docks.update((current) => {
      const merged = { ...persisted };
      for (const [dock, entry] of Object.entries(current)) {
        if (isContainerDock(dock) && !(dock in persisted)) {
          merged[dock] = entry;
        }
      }
      return merged;
    });
  }

  private update(dock: string, next: PaneNode, primary?: string): void {
    this.evacuateRemovedPanes(dock, next);
    this.docks.update((docks) => {
      const updated = { ...docks };
      const entry: DockEntry = {
        node: next,
        primary: healedPrimary(next, primary ?? docks[dock]?.primary),
      };
      if (isDefault(entry)) {
        delete updated[dock];
      } else {
        updated[dock] = entry;
      }
      return updated;
    });
  }

  private evacuateRemovedPanes(dock: string, next: PaneNode): void {
    const current = this.docks()[dock]?.node;
    if (!current) {
      return;
    }
    const surviving = new Set(collectLeafIds(next));
    for (const id of collectLeafIds(current)) {
      if (!surviving.has(id)) {
        this.stash.evacuate(`${paneRetentionScope(dock, id)}|`);
      }
    }
  }

  private persist(): void {
    if (!this.hydratedTree()) {
      return;
    }
    this.storage.save(this.docks());
  }
}
