import {
  PaneLeaf,
  PaneNode,
  PaneTab,
  leafOf,
  leafWith,
  newPaneId,
} from './pane-node';
import { findLeaf } from './pane-queries';
import { DEFAULT_RATIO } from './pane-ratio';

export function transformLeaf(
  node: PaneNode,
  paneId: string,
  function_: (leaf: PaneLeaf) => PaneLeaf,
): PaneNode {
  if (node.kind === 'leaf') {
    return node.id === paneId ? function_(node) : node;
  }
  const first = transformLeaf(node.first, paneId, function_);
  const second = transformLeaf(node.second, paneId, function_);
  return first === node.first && second === node.second
    ? node
    : { ...node, first, second };
}

export function collapseLeaf(
  node: PaneNode,
  paneId: string,
  function_: (leaf: PaneLeaf) => PaneNode | null,
): PaneNode | null {
  if (node.kind === 'leaf') {
    return node.id === paneId ? function_(node) : node;
  }
  const first = collapseLeaf(node.first, paneId, function_);
  const second = collapseLeaf(node.second, paneId, function_);
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

function rootedAt(tabPath: string, root: string): boolean {
  return tabPath === root || tabPath.startsWith(`${root}/`);
}

function duplicatedTab(
  node: PaneNode,
  paneId: string,
  path: string,
): PaneTab | undefined {
  const tabs = findLeaf(node, paneId)?.tabs ?? [];
  return (
    tabs.find((tab) => tab.path === path) ??
    tabs.find((tab) => rootedAt(tab.path, path))
  );
}

function labelledLike(leaf: PaneLeaf, source: PaneTab): PaneLeaf {
  if (source.title === undefined && source.icon === undefined) {
    return leaf;
  }
  return {
    ...leaf,
    tabs: leaf.tabs.map((tab) => ({
      ...tab,
      title: source.title,
      literalTitle: source.literalTitle,
      icon: source.icon,
    })),
  };
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
  if (node.kind === 'leaf') {
    return (
      node.id !== primaryId &&
      node.tabs.some(
        (tab) => tab.path === path || tab.path.startsWith(path + '/'),
      )
    );
  }
  return (
    heldOutside(node.first, primaryId, path) ||
    heldOutside(node.second, primaryId, path)
  );
}

function settledDethroned(
  leaf: PaneLeaf,
  { shown, carried }: DethronedContent,
): PaneLeaf {
  const match =
    shown === null
      ? undefined
      : leaf.tabs.find(
          (tab) => tab.path === shown || tab.path.startsWith(shown + '/'),
        );
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
  if (node.kind === 'leaf') {
    return node.tabs.length === 0 &&
      node.id !== primaryId &&
      node.id !== spare &&
      !node.declared
      ? null
      : node;
  }
  const first = pruneEmptyLeaves(node.first, primaryId, spare);
  const second = pruneEmptyLeaves(node.second, primaryId, spare);
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
