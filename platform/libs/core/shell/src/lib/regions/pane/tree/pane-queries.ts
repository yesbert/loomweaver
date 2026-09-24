import { PaneLeaf, PaneNode, PaneTab, leafPath } from './pane-node';

export function leavesOf(node: PaneNode): PaneLeaf[] {
  return node.kind === 'leaf'
    ? [node]
    : [...leavesOf(node.first), ...leavesOf(node.second)];
}

export function findLeafWhere(
  node: PaneNode,
  predicate: (leaf: PaneLeaf) => boolean,
): PaneLeaf | null {
  return leavesOf(node).find((leaf) => predicate(leaf)) ?? null;
}

export function findLeaf(node: PaneNode, paneId: string): PaneLeaf | null {
  return findLeafWhere(node, (leaf) => leaf.id === paneId);
}

export function findLeafWithTab(
  node: PaneNode,
  tabPath: string,
): PaneLeaf | null {
  return findLeafWhere(node, (leaf) =>
    leaf.tabs.some((tab) => tab.path === tabPath),
  );
}

export function collectLeafIds(node: PaneNode): string[] {
  return leavesOf(node).map((leaf) => leaf.id);
}

export function collectTabs(node: PaneNode): PaneTab[] {
  return leavesOf(node).flatMap((leaf) => leaf.tabs);
}

export function collectTabPaths(node: PaneNode): string[] {
  return collectTabs(node).map((tab) => tab.path);
}

export function tabPathsWhere(
  node: PaneNode,
  match: (path: string) => boolean,
): string[] {
  return collectTabPaths(node).filter((path) => match(path));
}

export function tabHolderOf(node: PaneNode, tabPath: string): string | null {
  return findLeafWithTab(node, tabPath)?.id ?? null;
}

export interface PaneSegment {
  readonly id: string;
  readonly path?: string;
}

export function paneSegments(node: PaneNode): PaneSegment[] {
  return leavesOf(node).map((leaf) => ({ id: leaf.id, path: leafPath(leaf) }));
}
