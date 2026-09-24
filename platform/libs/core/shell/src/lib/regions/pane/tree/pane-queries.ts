import { PaneLeaf, PaneNode, PaneTab, leafPath } from './pane-node';

export function findLeaf(node: PaneNode, paneId: string): PaneLeaf | null {
  if (node.kind === 'leaf') {
    return node.id === paneId ? node : null;
  }
  return findLeaf(node.first, paneId) ?? findLeaf(node.second, paneId);
}

export function collectLeafIds(node: PaneNode): string[] {
  if (node.kind === 'leaf') {
    return [node.id];
  }
  return [...collectLeafIds(node.first), ...collectLeafIds(node.second)];
}

export function findLeafWhere(
  node: PaneNode,
  predicate: (leaf: PaneLeaf) => boolean,
): PaneLeaf | null {
  if (node.kind === 'leaf') {
    return predicate(node) ? node : null;
  }
  return (
    findLeafWhere(node.first, predicate) ??
    findLeafWhere(node.second, predicate)
  );
}

export function findLeafWithTab(
  node: PaneNode,
  tabPath: string,
): PaneLeaf | null {
  return findLeafWhere(node, (leaf) =>
    leaf.tabs.some((tab) => tab.path === tabPath),
  );
}

export function collectTabPaths(node: PaneNode): string[] {
  if (node.kind === 'leaf') {
    return node.tabs.map((tab) => tab.path);
  }
  return [...collectTabPaths(node.first), ...collectTabPaths(node.second)];
}

export function collectTabs(node: PaneNode): PaneTab[] {
  if (node.kind === 'leaf') {
    return [...node.tabs];
  }
  return [...collectTabs(node.first), ...collectTabs(node.second)];
}

export function tabHolderOf(node: PaneNode, tabPath: string): string | null {
  if (node.kind === 'leaf') {
    return node.tabs.some((tab) => tab.path === tabPath) ? node.id : null;
  }
  return tabHolderOf(node.first, tabPath) ?? tabHolderOf(node.second, tabPath);
}

export interface PaneSegment {
  readonly id: string;
  readonly path?: string;
}

export function paneSegments(node: PaneNode): PaneSegment[] {
  if (node.kind === 'leaf') {
    return [{ id: node.id, path: leafPath(node) }];
  }
  return [...paneSegments(node.first), ...paneSegments(node.second)];
}
