import { PaneLeaf, PaneNode, PaneTab } from './pane-node';
import { collectLeafIds, findLeaf } from './pane-queries';
import { removeLeaf, transformLeaf } from './pane-structure';
import { sparedByBulkClose } from './pane-tabs';

export type TabKeep = (tab: PaneTab) => boolean;

export const keepsNothing: TabKeep = () => false;

export function keepsOnPaneClose(
  contentSide: boolean,
  closingOffered: boolean,
): TabKeep {
  return contentSide && !closingOffered ? () => true : sparedByBulkClose;
}

export function closedWithHandover(
  node: PaneNode,
  paneId: string,
  keeps: TabKeep,
): PaneNode | null {
  return handedOverAndRemoved(
    node,
    paneId,
    adjacentLeafOf(node, paneId),
    keeps,
  );
}

export function collapsedWithHandover(
  node: PaneNode,
  primaryId: string,
  keeps: TabKeep,
): PaneNode | null {
  return handedOverAndRemoved(
    node,
    primaryId,
    promotedLeafOf(node, primaryId),
    keeps,
  );
}

export function unsplitWithHandover(
  node: PaneNode,
  primaryId: string,
  keeps: TabKeep,
): PaneLeaf | null {
  const primary = findLeaf(node, primaryId);
  if (primary === null) {
    return null;
  }
  const kept = collectLeafIds(node)
    .filter((id) => id !== primaryId)
    .flatMap(
      (id) => findLeaf(node, id)?.tabs.filter((tab) => keeps(tab)) ?? [],
    );
  return withTabsAppended(primary, kept);
}

function adjacentLeafOf(node: PaneNode, paneId: string): string | null {
  if (node.kind === 'leaf') {
    return null;
  }
  if (node.first.kind === 'leaf' && node.first.id === paneId) {
    return collectLeafIds(node.second)[0] ?? null;
  }
  if (node.second.kind === 'leaf' && node.second.id === paneId) {
    return collectLeafIds(node.first).at(-1) ?? null;
  }
  return (
    adjacentLeafOf(node.first, paneId) ?? adjacentLeafOf(node.second, paneId)
  );
}

function promotedLeafOf(node: PaneNode, primaryId: string): string | null {
  const collapsed = removeLeaf(node, primaryId);
  return collapsed === null ? null : (collectLeafIds(collapsed)[0] ?? null);
}

function handedOverAndRemoved(
  node: PaneNode,
  paneId: string,
  receiverId: string | null,
  keeps: TabKeep,
): PaneNode | null {
  const closing = findLeaf(node, paneId);
  const handed =
    closing === null || receiverId === null
      ? node
      : transformLeaf(node, receiverId, (leaf) =>
          withTabsAppended(
            leaf,
            closing.tabs.filter((tab) => keeps(tab)),
          ),
        );
  return removeLeaf(handed, paneId);
}

function withTabsAppended(leaf: PaneLeaf, tabs: readonly PaneTab[]): PaneLeaf {
  const held = new Set(leaf.tabs.map((tab) => tab.path));
  const added = tabs.filter((tab) => !held.has(tab.path));
  if (added.length === 0) {
    return leaf;
  }
  return {
    ...leaf,
    tabs: [...leaf.tabs, ...added],
    active: leaf.tabs.length === 0 ? added[0].path : leaf.active,
  };
}
