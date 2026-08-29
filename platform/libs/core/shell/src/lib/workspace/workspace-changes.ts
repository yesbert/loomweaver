import { PaneNode, PaneTab } from '../regions/pane/tree/pane-node';
import { tabWithout } from '../regions/pane/tree/pane-tabs';
import { normalizeDockEntry } from '../regions/pane/tree/pane-restore';
import {
  PRIMARY_PANE,
  VIEW_PANE_PREFIX,
} from '../regions/pane/tree/pane-address';
import { parseHiddenViews } from '../regions/panel/hidden-views.service';

export type ReadState = (key: string) => string | undefined;

export interface ChangeShape {
  readonly keys: readonly string[];
  readonly hiddenViewsKey: string;
  readonly paneTreesKey: string;
  readonly declaredPaths: (dock: string) => readonly string[];
}

export function stateDiffers(
  stored: ReadState,
  baseline: ReadState,
  shape: ChangeShape,
): boolean {
  if (shape.keys.every((key) => stored(key) == null)) {
    return false;
  }
  return canonicalState(stored, shape) !== canonicalState(baseline, shape);
}

function canonicalState(read: ReadState, shape: ChangeShape): string {
  const hidden = parseHiddenViews(read(shape.hiddenViewsKey));
  return JSON.stringify(
    shape.keys.map((key) => canonicalValue(key, read(key), hidden, shape)),
  );
}

function canonicalValue(
  key: string,
  raw: string | undefined,
  hidden: ReadonlySet<string>,
  shape: ChangeShape,
): string {
  if (key === shape.hiddenViewsKey) {
    return JSON.stringify([...hidden].toSorted((a, b) => a.localeCompare(b)));
  }
  if (key === shape.paneTreesKey) {
    return canonicalTrees(raw, hidden, shape);
  }
  return raw ?? '{}';
}

function canonicalTrees(
  raw: string | undefined,
  hidden: ReadonlySet<string>,
  shape: ChangeShape,
): string {
  if (!raw) {
    return '{}';
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const dock of Object.keys(parsed ?? {}).toSorted((a, b) =>
      a.localeCompare(b),
    )) {
      const entry = normalizeDockEntry(parsed[dock]);
      if (entry === null) {
        continue;
      }
      const comparable = comparableNode(entry.node);
      if (!isSeededLeaf(comparable, seededShape(dock, hidden, shape))) {
        out[dock] = { tree: comparable, primary: entry.primary };
      }
    }
    return JSON.stringify(out);
  } catch {
    return '{}';
  }
}

function seededShape(
  dock: string,
  hidden: ReadonlySet<string>,
  shape: ChangeShape,
): string[] {
  return shape
    .declaredPaths(dock)
    .filter((path) => !hidden.has(path.slice(VIEW_PANE_PREFIX.length)));
}

function isSeededLeaf(node: unknown, seededPaths: readonly string[]): boolean {
  if (seededPaths.length === 0) {
    return false;
  }
  const leaf = node as {
    kind?: unknown;
    id?: unknown;
    tabs?: unknown;
    active?: unknown;
  };
  if (
    leaf?.kind !== 'leaf' ||
    leaf.id !== PRIMARY_PANE ||
    !Array.isArray(leaf.tabs) ||
    leaf.tabs.length !== seededPaths.length ||
    leaf.active !== seededPaths[0]
  ) {
    return false;
  }
  return leaf.tabs.every((tab, index) => {
    const entry = tab as Record<string, unknown>;
    return (
      entry?.['path'] === seededPaths[index] && Object.keys(entry).length === 1
    );
  });
}

function comparableTab(tab: PaneTab): PaneTab {
  let comparable = tab;
  for (const key of ['title', 'literalTitle', 'icon'] as const) {
    if (comparable[key] !== undefined) {
      comparable = tabWithout(comparable, key);
    }
  }
  return comparable;
}

function comparableNode(node: PaneNode): PaneNode {
  if (node.kind === 'leaf') {
    return { ...node, tabs: node.tabs.map(comparableTab) };
  }
  return {
    ...node,
    first: comparableNode(node.first),
    second: comparableNode(node.second),
  };
}
