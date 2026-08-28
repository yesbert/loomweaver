import { PRIMARY_PANE, VIEW_PANE_PREFIX } from './pane-address';

export interface PaneTab {
  readonly path: string;
  readonly pinned?: boolean;
  readonly preview?: boolean;
  readonly closable?: boolean;
  readonly title?: string;
  readonly literalTitle?: boolean;
  readonly icon?: string;
  readonly instance?: string;
}

export interface PaneLeaf {
  readonly kind: 'leaf';
  readonly id: string;
  readonly tabs: readonly PaneTab[];
  readonly active?: string;
  readonly declared?: boolean;
}

export interface PaneSplit {
  readonly kind: 'split';
  readonly id: string;
  readonly orientation: 'row' | 'column';
  readonly ratio: number;
  readonly first: PaneNode;
  readonly second: PaneNode;
}

export type PaneNode = PaneLeaf | PaneSplit;

export const PRIMARY_LEAF: PaneLeaf = {
  kind: 'leaf',
  id: PRIMARY_PANE,
  tabs: [],
};

export function newPaneId(): string {
  return crypto.randomUUID();
}

export function leafOf(id: string, path: string): PaneLeaf {
  const tab: PaneTab = path.startsWith(VIEW_PANE_PREFIX)
    ? { path, instance: id }
    : { path };
  return { kind: 'leaf', id, tabs: [tab], active: path };
}

export function activeTab(leaf: PaneLeaf): PaneTab | undefined {
  return leaf.tabs.find((tab) => tab.path === leaf.active) ?? leaf.tabs[0];
}

export function leafPath(leaf: PaneLeaf): string | undefined {
  return activeTab(leaf)?.path;
}

export function leafWith(
  id: string,
  tabs: readonly PaneTab[],
  candidateActive: string | undefined,
  declared?: boolean,
): PaneLeaf {
  const active = tabs.some((tab) => tab.path === candidateActive)
    ? candidateActive
    : tabs[0]?.path;
  return {
    kind: 'leaf',
    id,
    tabs,
    ...(active === undefined ? {} : { active }),
    ...(declared ? { declared: true } : {}),
  };
}
