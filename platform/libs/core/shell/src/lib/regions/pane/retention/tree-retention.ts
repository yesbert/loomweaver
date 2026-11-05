import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { PaneNode } from '../tree/pane-node';
import { collectLeafIds, leavesOf } from '../tree/pane-queries';
import { RetainedViewStash } from './retained-view-stash';
import {
  isKeyOfPane,
  paneRetentionScope,
  pathOfRetentionKey,
  retainedAddressesOf,
  scopeOfRetentionKey,
} from './retention-keys';

export type DockTrees = Readonly<Record<string, PaneNode>>;

export interface TabDeparture {
  readonly path: string;
  readonly from: string;
  readonly to: string | null;
}

@Service()
export class TreeRetention {
  private readonly stash = inject(RetainedViewStash);
  private readonly registry = inject(ContributionRegistry);

  evacuateRemovedPanes(
    dock: string,
    current: PaneNode | undefined,
    next: PaneNode,
  ): void {
    if (!current) {
      return;
    }
    const surviving = new Set(collectLeafIds(next));
    for (const id of collectLeafIds(current)) {
      if (!surviving.has(id)) {
        this.stash.evacuate((key) => isKeyOfPane(key, dock, id));
      }
    }
  }

  carryMovedTabs(before: DockTrees, after: DockTrees): void {
    const routes = this.registry.contentRoutes();
    const moves = tabDepartures(before, after)
      .filter((tab) => tab.to !== null)
      .map((move) => ({
        ...move,
        addresses: retainedAddressesOf(routes, move.path),
      }));
    if (moves.length === 0) {
      return;
    }
    this.stash.rekey((key) => {
      const scope = scopeOfRetentionKey(key);
      const path = pathOfRetentionKey(key);
      const move = moves.find(
        (candidate) =>
          candidate.from === scope && candidate.addresses.includes(path),
      );
      return move ? move.to + key.slice(scope.length) : key;
    });
  }
}

export function openPathsByScope(trees: DockTrees): Map<string, Set<string>> {
  const open = new Map<string, Set<string>>();
  for (const [dock, tree] of Object.entries(trees)) {
    for (const leaf of leavesOf(tree)) {
      const scope = paneRetentionScope(dock, leaf.id);
      const paths = open.get(scope) ?? new Set<string>();
      for (const tab of leaf.tabs) {
        paths.add(tab.path);
      }
      open.set(scope, paths);
    }
  }
  return open;
}

export function tabDepartures(
  before: DockTrees,
  after: DockTrees,
): TabDeparture[] {
  const held = openPathsByScope(before);
  const holding = openPathsByScope(after);
  const arrivals = new Map<string, string[]>();
  for (const [scope, paths] of holding) {
    for (const path of paths) {
      if (!held.get(scope)?.has(path)) {
        arrivals.set(path, [...(arrivals.get(path) ?? []), scope]);
      }
    }
  }
  const departures: TabDeparture[] = [];
  for (const [from, paths] of held) {
    for (const path of paths) {
      if (!holding.get(from)?.has(path)) {
        departures.push({
          path,
          from,
          to: arrivals.get(path)?.shift() ?? null,
        });
      }
    }
  }
  return departures;
}
