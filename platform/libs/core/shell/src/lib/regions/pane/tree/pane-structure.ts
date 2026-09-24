import {
  PRIMARY_LEAF,
  PaneLeaf,
  PaneNode,
  PaneTab,
  isDisposableLeaf,
  labelOf,
  leafOf,
  leafWith,
  newPaneId,
  withLabel,
} from './pane-node';
import { findLeaf, leavesOf } from './pane-queries';
import { DEFAULT_RATIO } from './pane-ratio';
import { isAtOrBelow } from '../../content/content-path';

export function transformLeaf(
  node: PaneNode,
  paneId: string,
  change: (leaf: PaneLeaf) => PaneLeaf,
): PaneNode {
  if (node.kind === 'leaf') {
    return node.id === paneId ? change(node) : node;
  }
  const first = transformLeaf(node.first, paneId, change);
  const second = transformLeaf(node.second, paneId, change);
  return first === node.first && second === node.second
    ? node
    : { ...node, first, second };
}

export function collapseLeaves(
  node: PaneNode,
  replace: (leaf: PaneLeaf) => PaneNode | null,
): PaneNode | null {
  if (node.kind === 'leaf') {
    return replace(node);
  }
  const first = collapseLeaves(node.first, replace);
  const second = collapseLeaves(node.second, replace);
  if (first === null) {
    return second;
  }
  if (second === null) {
    return first;
  }
  return first === node.first && second === node.second
    ? node
    : { ...node, first, second };
}

export function collapseLeaf(
  node: PaneNode,
  paneId: string,
  replace: (leaf: PaneLeaf) => PaneNode | null,
): PaneNode | null {
  return collapseLeaves(node, (leaf) =>
    leaf.id === paneId ? replace(leaf) : leaf,
  );
}

function duplicatedTab(
  node: PaneNode,
  paneId: string,
  path: string,
): PaneTab | undefined {
  const tabs = findLeaf(node, paneId)?.tabs ?? [];
  return (
    tabs.find((tab) => tab.path === path) ??
    tabs.find((tab) => isAtOrBelow(path, tab.path))
  );
}

function labelledLike(leaf: PaneLeaf, source: PaneTab): PaneLeaf {
  const label = labelOf(source);
  return { ...leaf, tabs: leaf.tabs.map((tab) => withLabel(tab, label)) };
}

export function splitLeaf(
  node: PaneNode,
  paneId: string,
  orientation: 'row' | 'column',
  path: string,
  position: 'before' | 'after' = 'after',
): PaneNode {
  const added = leafOf(newPaneId(), path);
  const source = duplicatedTab(node, paneId, path);
  return splitLeafWith(
    node,
    paneId,
    orientation,
    source ? labelledLike(added, source) : added,
    position,
  );
}

export function splitLeafWith(
  node: PaneNode,
  paneId: string,
  orientation: 'row' | 'column',
  added: PaneLeaf,
  position: 'before' | 'after',
): PaneNode {
  if (node.kind === 'leaf') {
    if (node.id !== paneId) {
      return node;
    }
    return {
      kind: 'split',
      id: newPaneId(),
      orientation,
      ratio: DEFAULT_RATIO,
      first: position === 'before' ? added : node,
      second: position === 'before' ? node : added,
    };
  }
  return {
    ...node,
    first: splitLeafWith(node.first, paneId, orientation, added, position),
    second: splitLeafWith(node.second, paneId, orientation, added, position),
  };
}

export function removeLeaf(node: PaneNode, paneId: string): PaneNode | null {
  return collapseLeaf(node, paneId, () => null);
}

interface DethronedContent {
  readonly shown: string | null;
  readonly carried: string | null;
}

export function dethroneLeaf(
  node: PaneNode,
  primaryId: string,
  previousContent: string | null,
): PaneNode {
  const shown =
    previousContent === null || previousContent === '' ? null : previousContent;
  const carried =
    shown === null || heldOutside(node, primaryId, shown) ? null : shown;
  return transformLeaf(node, primaryId, (leaf) =>
    settledDethroned(leaf, { shown, carried }),
  );
}

function heldOutside(node: PaneNode, primaryId: string, path: string): boolean {
  return leavesOf(node).some(
    (leaf) =>
      leaf.id !== primaryId &&
      leaf.tabs.some((tab) => isAtOrBelow(path, tab.path)),
  );
}

function settledDethroned(
  leaf: PaneLeaf,
  { shown, carried }: DethronedContent,
): PaneLeaf {
  const match =
    shown === null
      ? undefined
      : leaf.tabs.find((tab) => isAtOrBelow(shown, tab.path));
  if (match) {
    return { ...leaf, active: match.path };
  }
  if (carried !== null) {
    return {
      ...leaf,
      tabs: [...leaf.tabs, { path: carried }],
      active: carried,
    };
  }
  return leafWith(leaf.id, leaf.tabs, leaf.active, leaf.declared);
}

export function pruneEmptyLeaves(
  node: PaneNode,
  primaryId: string,
  spare?: string,
): PaneNode | null {
  return collapseLeaves(node, (leaf) =>
    isDisposableLeaf(leaf, [primaryId, spare]) ? null : leaf,
  );
}

export function withoutEmptyPrimary(
  node: PaneNode,
  primaryId: string,
): PaneNode {
  if (node.kind !== 'split') {
    return node;
  }
  const primary = findLeaf(node, primaryId);
  if (!primary || !isDisposableLeaf(primary, [])) {
    return node;
  }
  return removeLeaf(node, primaryId) ?? PRIMARY_LEAF;
}
