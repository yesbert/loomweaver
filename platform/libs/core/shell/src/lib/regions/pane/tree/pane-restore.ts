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
    ...(tab['pinned'] === true ? { pinned: true } : {}),
    ...(tab['preview'] === true ? { preview: true } : {}),
    ...(tab['closable'] === false ? { closable: false } : {}),
    ...(typeof tab['title'] === 'string' ? { title: tab['title'] } : {}),
    ...(tab['literalTitle'] === true ? { literalTitle: true } : {}),
    ...(typeof tab['icon'] === 'string' ? { icon: tab['icon'] } : {}),
    ...(typeof tab['instance'] === 'string'
      ? { instance: tab['instance'] }
      : {}),
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
    ? rawTabs.map(normalizeTab).filter((tab): tab is PaneTab => tab !== null)
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
