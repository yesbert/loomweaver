import { PRIMARY_PANE } from './pane-address';
import { PaneNode, PaneTab, leafOf, leafWith } from './pane-node';
import { collectLeafIds, findLeaf } from './pane-queries';
import { DEFAULT_RATIO, sanitizeRatio } from './pane-ratio';

function normalizeTab(value: unknown): PaneTab | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const tab = value as Record<string, unknown>;
  if (typeof tab['path'] !== 'string') {
    return null;
  }
  return {
    path: tab['path'],
    ...(tab['pinned'] === true && { pinned: true }),
    ...(tab['preview'] === true && { preview: true }),
    ...(tab['closable'] === false && { closable: false }),
    ...(typeof tab['title'] === 'string' && { title: tab['title'] }),
    ...(tab['literalTitle'] === true && { literalTitle: true }),
    ...(typeof tab['icon'] === 'string' && { icon: tab['icon'] }),
    ...(typeof tab['instance'] === 'string' && { instance: tab['instance'] }),
  };
}

function normalizeLeafNode(
  id: string,
  node: Record<string, unknown>,
): PaneNode {
  const legacyPath = node['path'];
  if (typeof legacyPath === 'string') {
    return leafOf(id, legacyPath);
  }
  const rawTabs = node['tabs'];
  const tabs = Array.isArray(rawTabs)
    ? rawTabs.map((value) => normalizeTab(value)).filter((tab): tab is PaneTab => tab !== null)
    : [];
  const rawActive = node['active'];
  return leafWith(
    id,
    tabs,
    typeof rawActive === 'string' ? rawActive : undefined,
    node['declared'] === true,
  );
}

function normalizeSplitNode(
  id: string,
  orientation: 'row' | 'column',
  node: Record<string, unknown>,
): PaneNode | null {
  const first = normalizeNode(node['first']);
  const second = normalizeNode(node['second']);
  if (!first || !second) {
    return null;
  }
  const rawRatio = node['ratio'];
  const ratio =
    typeof rawRatio === 'number' && Number.isFinite(rawRatio)
      ? sanitizeRatio(rawRatio)
      : DEFAULT_RATIO;
  return { kind: 'split', id, orientation, ratio, first, second };
}

export function normalizeNode(value: unknown): PaneNode | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const node = value as Record<string, unknown>;
  const id = node['id'];
  if (typeof id !== 'string') {
    return null;
  }
  if (node['kind'] === 'leaf') {
    return normalizeLeafNode(id, node);
  }
  const orientation = node['orientation'];
  if (
    node['kind'] === 'split' &&
    (orientation === 'row' || orientation === 'column')
  ) {
    return normalizeSplitNode(id, orientation, node);
  }
  return null;
}

export interface DockEntry {
  readonly node: PaneNode;
  readonly primary: string;
}

export function normalizeDockEntry(value: unknown): DockEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const wrapped = 'tree' in record && !('kind' in record);
  const node = normalizeNode(wrapped ? record['tree'] : value);
  if (node === null) {
    return null;
  }
  const declared =
    wrapped && typeof record['primary'] === 'string'
      ? record['primary']
      : PRIMARY_PANE;
  return { node, primary: healedPrimary(node, declared) };
}

export function healedPrimary(
  node: PaneNode,
  candidate: string | undefined,
): string {
  return candidate !== undefined && findLeaf(node, candidate) !== null
    ? candidate
    : collectLeafIds(node)[0];
}

export function withoutTabs(
  node: PaneNode,
  drop: (path: string) => boolean,
): { node: PaneNode; dropped: readonly string[] } {
  if (node.kind === 'leaf') {
    const kept = node.tabs.filter((tab) => !drop(tab.path));
    if (kept.length === node.tabs.length) {
      return { node, dropped: [] };
    }
    const dropped = node.tabs
      .filter((tab) => drop(tab.path))
      .map((tab) => tab.path);
    const active =
      node.active !== undefined && dropped.includes(node.active)
        ? kept[0]?.path
        : node.active;
    return { node: { ...node, tabs: kept, active }, dropped };
  }
  const first = withoutTabs(node.first, drop);
  const second = withoutTabs(node.second, drop);
  if (first.dropped.length === 0 && second.dropped.length === 0) {
    return { node, dropped: [] };
  }
  return {
    node: { ...node, first: first.node, second: second.node },
    dropped: [...first.dropped, ...second.dropped],
  };
}

export function withoutBorrowedLabels(
  node: PaneNode,
  borrowed: (tab: PaneTab) => boolean,
): { node: PaneNode; stripped: readonly string[] } {
  if (node.kind === 'leaf') {
    const stripped = node.tabs.filter((tab) => borrowed(tab)).map((tab) => tab.path);
    if (stripped.length === 0) {
      return { node, stripped: [] };
    }
    const tabs = node.tabs.map((tab) => {
      if (!borrowed(tab)) {
        return tab;
      }
      const { title, literalTitle, icon, ...rest } = tab;
      return rest;
    });
    return { node: { ...node, tabs }, stripped };
  }
  const first = withoutBorrowedLabels(node.first, borrowed);
  const second = withoutBorrowedLabels(node.second, borrowed);
  if (first.stripped.length === 0 && second.stripped.length === 0) {
    return { node, stripped: [] };
  }
  return {
    node: { ...node, first: first.node, second: second.node },
    stripped: [...first.stripped, ...second.stripped],
  };
}
