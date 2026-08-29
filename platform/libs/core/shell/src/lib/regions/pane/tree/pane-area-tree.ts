import { PaneArea, PaneAreaBase, PaneTabArea } from '@loomweaver/plugin-sdk';
import { PRIMARY_PANE } from './pane-address';
import { PaneNode, PaneTab } from './pane-node';

export interface PaneAreaOptions<T> {
  readonly bake: (entry: T, problems: string[]) => BakedTab | null;
  readonly idPrefix: string;
  readonly context: string;
  readonly allowEmpty?: boolean;
}

export interface BakedTab {
  readonly tab: PaneTab;
  readonly active: boolean;
}

export interface PaneAreaTree {
  readonly node: PaneNode | null;
  readonly tabs: readonly PaneTab[];
}

const MAX_DEPTH = 8;

export function paneAreaTree<T>(
  area: PaneArea<T>,
  options: PaneAreaOptions<T>,
  problems: string[],
): PaneAreaTree {
  const clean = cleanArea(area, options, problems, 1);
  if (clean === null) {
    return { node: null, tabs: [] };
  }
  return {
    node: buildNode(clean, options.idPrefix, { primaryUsed: false }, '0'),
    tabs: collectTabs(clean),
  };
}

interface CleanTabs {
  readonly kind: 'tabs';
  readonly size?: number;
  readonly tabs: readonly PaneTab[];
  readonly active: string;
  readonly empty?: boolean;
}

interface CleanSplit {
  readonly kind: 'rows' | 'columns';
  readonly size?: number;
  readonly children: readonly CleanArea[];
}

type CleanArea = CleanTabs | CleanSplit;

function cleanArea<T>(
  area: PaneArea<T>,
  options: PaneAreaOptions<T>,
  problems: string[],
  depth: number,
): CleanArea | null {
  if (depth > MAX_DEPTH) {
    problems.push(
      `${options.context}: the arrangement nests deeper than ${MAX_DEPTH} levels — the deeper areas are dropped.`,
    );
    return null;
  }
  const kinds = ['tabs', 'rows', 'columns'].filter((key) =>
    Object.hasOwn(area, key),
  );
  if (kinds.length !== 1) {
    problems.push(
      `${options.context}: a pane area must be exactly one of tabs, rows or columns.`,
    );
    return null;
  }
  const size = cleanSize(area, options, problems);
  if ('tabs' in area) {
    return cleanTabsArea(area, size, options, problems);
  }
  const declared = 'rows' in area ? area.rows : area.columns;
  const children = (Array.isArray(declared) ? declared : [])
    .map((child) => cleanArea(child, options, problems, depth + 1))
    .filter((child): child is CleanArea => child !== null);
  if (children.length === 0) {
    problems.push(
      `${options.context}: a rows/columns area has no usable child area.`,
    );
    return null;
  }
  if (children.length === 1) {
    return children[0];
  }
  return { kind: 'rows' in area ? 'rows' : 'columns', size, children };
}

function cleanSize<T>(
  area: PaneAreaBase,
  options: PaneAreaOptions<T>,
  problems: string[],
): number | undefined {
  if (area.size === undefined) {
    return undefined;
  }
  if (!Number.isFinite(area.size) || area.size <= 0) {
    problems.push(
      `${options.context}: a size must be a positive percentage — the size is ignored and siblings share the remainder.`,
    );
    return undefined;
  }
  return area.size;
}

function cleanTabsArea<T>(
  area: PaneTabArea<T>,
  size: number | undefined,
  options: PaneAreaOptions<T>,
  problems: string[],
): CleanTabs | null {
  const tabs: PaneTab[] = [];
  let active: string | undefined;
  for (const entry of Array.isArray(area.tabs) ? area.tabs : []) {
    const baked = options.bake(entry, problems);
    if (baked === null) {
      continue;
    }
    if (tabs.some((existing) => existing.path === baked.tab.path)) {
      problems.push(
        `${options.context}: tab "${baked.tab.path}" is declared twice in one area — the duplicate is dropped.`,
      );
      continue;
    }
    tabs.push(baked.tab);
    if (!baked.active) {
      continue;
    }
    if (active === undefined) {
      active = baked.tab.path;
    } else {
      problems.push(
        `${options.context}: more than one tab of an area is marked active — the first wins.`,
      );
    }
  }
  if (tabs.length === 0) {
    if (
      options.allowEmpty &&
      Array.isArray(area.tabs) &&
      area.tabs.length === 0
    ) {
      return { kind: 'tabs', size, tabs, active: '', empty: true };
    }
    problems.push(`${options.context}: a tabs area has no tabs.`);
    return null;
  }
  return { kind: 'tabs', size, tabs, active: active ?? tabs[0].path };
}

function collectTabs(area: CleanArea): PaneTab[] {
  return area.kind === 'tabs'
    ? [...area.tabs]
    : area.children.flatMap(collectTabs);
}

function buildNode(
  area: CleanArea,
  idPrefix: string,
  ctx: { primaryUsed: boolean },
  indexPath: string,
): PaneNode {
  if (area.kind === 'tabs') {
    const primary = !ctx.primaryUsed;
    ctx.primaryUsed = true;
    const id = primary ? PRIMARY_PANE : `${idPrefix}:${indexPath}`;
    return area.empty
      ? { kind: 'leaf', id, tabs: [], declared: true }
      : { kind: 'leaf', id, tabs: area.tabs, active: area.active };
  }
  const orientation = area.kind === 'columns' ? 'row' : 'column';
  const fractions = fractionsOf(area.children);
  const chain = (offset: number, remaining: number): PaneNode => {
    const first = buildNode(
      area.children[offset],
      idPrefix,
      ctx,
      `${indexPath}.${offset}`,
    );
    if (offset === area.children.length - 1) {
      return first;
    }
    return {
      kind: 'split',
      id: `${idPrefix}:${indexPath}.s${offset}`,
      orientation,
      ratio: fractions[offset] / remaining,
      first,
      second: chain(offset + 1, remaining - fractions[offset]),
    };
  };
  return chain(0, 1);
}

function evenShareOf(
  remainder: number,
  declaredSum: number,
  children: number,
  unspecified: number,
): number {
  if (unspecified === 0) {
    return 0;
  }
  return remainder > 0 ? remainder / unspecified : declaredSum / children;
}

function fractionsOf(children: readonly CleanArea[]): number[] {
  const declared = children
    .map((child) => child.size)
    .filter((size): size is number => size !== undefined);
  const declaredSum = declared.reduce((sum, size) => sum + size, 0);
  const unspecified = children.length - declared.length;
  const remainder = Math.max(0, 100 - declaredSum);
  const evenShare = evenShareOf(
    remainder,
    declaredSum,
    children.length,
    unspecified,
  );
  const weights = children.map((child) => child.size ?? evenShare);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}
