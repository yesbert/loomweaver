import { ContentTabLabel, TabBadge } from '@loomweaver/plugin-sdk';
import { tabBadgeOf } from '../chrome/tab-badge';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from './pane-address';

export interface PaneTab {
  readonly path: string;
  readonly pinned?: boolean;
  readonly preview?: boolean;
  readonly closable?: boolean;
  readonly title?: string;
  readonly literalTitle?: boolean;
  readonly icon?: string;
  readonly badge?: TabBadge;
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

export function isDisposableLeaf(
  leaf: PaneLeaf,
  kept: readonly (string | undefined)[],
): boolean {
  return leaf.tabs.length === 0 && !leaf.declared && !kept.includes(leaf.id);
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
    ...(active !== undefined && { active }),
    ...(declared && { declared: true }),
  };
}

export function tabWithout(tab: PaneTab, key: keyof PaneTab): PaneTab {
  const copy: { -readonly [K in keyof PaneTab]?: PaneTab[K] } = { ...tab };
  delete copy[key];
  return copy as PaneTab;
}

export function labelOf(tab: PaneTab): ContentTabLabel {
  return {
    title: tab.title,
    titleIsLiteral: tab.literalTitle,
    icon: tab.icon,
    badge: tab.badge,
  };
}

export function withLabel(tab: PaneTab, label: ContentTabLabel): PaneTab {
  let next = tab;
  if (label.title !== undefined) {
    next =
      label.titleIsLiteral === true
        ? { ...next, title: label.title, literalTitle: true }
        : tabWithout({ ...next, title: label.title }, 'literalTitle');
  }
  if (label.icon !== undefined) {
    next = { ...next, icon: label.icon };
  }
  if (label.badge !== undefined) {
    const badge = label.badge === null ? undefined : tabBadgeOf(label.badge);
    next = badge === undefined ? tabWithout(next, 'badge') : { ...next, badge };
  }
  return next;
}

export function withoutLabel(tab: PaneTab): PaneTab {
  const { title, literalTitle, icon, ...rest } = tab;
  return rest;
}

export function labelledTabs(
  node: PaneNode,
  matches: (tab: PaneTab) => boolean,
  relabel: (tab: PaneTab) => PaneTab,
): PaneNode | null {
  if (node.kind === 'leaf') {
    if (node.tabs.every((tab) => !matches(tab))) {
      return null;
    }
    return {
      ...node,
      tabs: node.tabs.map((tab) => (matches(tab) ? relabel(tab) : tab)),
    };
  }
  const first = labelledTabs(node.first, matches, relabel);
  const second = labelledTabs(node.second, matches, relabel);
  if (first === null && second === null) {
    return null;
  }
  return { ...node, first: first ?? node.first, second: second ?? node.second };
}
