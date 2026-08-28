import { PaneLeaf, PaneNode, PaneTab, leafWith } from './pane-node';
import { collapseLeaf, transformLeaf } from './pane-structure';

export function insertTab(
  node: PaneNode,
  paneId: string,
  tab: PaneTab,
  index?: number,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => {
    const existingIndex = leaf.tabs.findIndex(
      (existing) => existing.path === tab.path,
    );
    if (existingIndex >= 0) {
      const tabs = leaf.tabs.map((existing, i) =>
        i === existingIndex ? tab : existing,
      );
      return { ...leaf, tabs, active: tab.path };
    }
    const at =
      index === undefined
        ? leaf.tabs.length
        : Math.max(0, Math.min(index, leaf.tabs.length));
    const tabs = [...leaf.tabs.slice(0, at), tab, ...leaf.tabs.slice(at)];
    return { ...leaf, tabs, active: tab.path };
  });
}

export interface TabTitlePatch {
  readonly title?: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
}

export function refineTabTitles(
  node: PaneNode,
  skipLeaf: (leaf: PaneLeaf) => boolean,
  matches: (tabPath: string) => boolean,
  patch: TabTitlePatch,
): { node: PaneNode; found: boolean } {
  if (node.kind === 'leaf') {
    return refineLeafTitles(node, skipLeaf, matches, patch);
  }
  const first = refineTabTitles(node.first, skipLeaf, matches, patch);
  const second = refineTabTitles(node.second, skipLeaf, matches, patch);
  if (!first.found && !second.found) {
    return { node, found: false };
  }
  return {
    node: { ...node, first: first.node, second: second.node },
    found: true,
  };
}

function refineLeafTitles(
  leaf: PaneLeaf,
  skipLeaf: (leaf: PaneLeaf) => boolean,
  matches: (tabPath: string) => boolean,
  patch: TabTitlePatch,
): { node: PaneNode; found: boolean } {
  if (skipLeaf(leaf)) {
    return { node: leaf, found: false };
  }
  let found = false;
  const tabs = leaf.tabs.map((tab) => {
    if (!matches(tab.path)) {
      return tab;
    }
    found = true;
    return {
      ...tab,
      title: patch.title,
      literalTitle: patch.literalTitle,
      ...(patch.icon === undefined ? {} : { icon: patch.icon }),
    };
  });
  return found
    ? { node: { ...leaf, tabs }, found }
    : { node: leaf, found: false };
}

export function setActiveTab(
  node: PaneNode,
  paneId: string,
  tabPath: string,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) =>
    leaf.tabs.some((tab) => tab.path === tabPath)
      ? { ...leaf, active: tabPath }
      : leaf,
  );
}

export function setTabs(
  node: PaneNode,
  paneId: string,
  tabs: readonly PaneTab[],
): PaneNode {
  return transformLeaf(node, paneId, (leaf) =>
    leafWith(leaf.id, tabs, leaf.active, leaf.declared),
  );
}

export function clearTabInstance(
  node: PaneNode,
  paneId: string,
  tabPath: string,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => ({
    ...leaf,
    tabs: leaf.tabs.map((tab) =>
      tab.path === tabPath && tab.instance !== undefined
        ? tabWithout(tab, 'instance')
        : tab,
    ),
  }));
}

export function keepTab(
  node: PaneNode,
  paneId: string,
  tabPath: string,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => ({
    ...leaf,
    tabs: leaf.tabs.map((tab) =>
      tab.path === tabPath && tab.preview ? tabWithout(tab, 'preview') : tab,
    ),
  }));
}

export function reseatPinned<T extends { readonly pinned?: boolean }>(
  tabs: readonly T[],
  index: number,
  updated: T,
): T[] {
  const rest = [...tabs.slice(0, index), ...tabs.slice(index + 1)];
  const boundary = rest.findIndex((tab) => tab.pinned !== true);
  const at = boundary === -1 ? rest.length : boundary;
  return [...rest.slice(0, at), updated, ...rest.slice(at)];
}

export function pinTab(
  node: PaneNode,
  paneId: string,
  tabPath: string,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => {
    const index = leaf.tabs.findIndex((tab) => tab.path === tabPath);
    if (index < 0 || leaf.tabs[index].pinned === true) {
      return leaf;
    }
    const pinned: PaneTab = {
      ...tabWithout(leaf.tabs[index], 'preview'),
      pinned: true,
    };
    return { ...leaf, tabs: reseatPinned(leaf.tabs, index, pinned) };
  });
}

export function unpinTab(
  node: PaneNode,
  paneId: string,
  tabPath: string,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => {
    const index = leaf.tabs.findIndex(
      (tab) => tab.path === tabPath && tab.pinned,
    );
    if (index < 0) {
      return leaf;
    }
    const unpinned = tabWithout(leaf.tabs[index], 'pinned');
    return { ...leaf, tabs: reseatPinned(leaf.tabs, index, unpinned) };
  });
}

export function tabWithout(tab: PaneTab, key: keyof PaneTab): PaneTab {
  const copy: { -readonly [K in keyof PaneTab]?: PaneTab[K] } = { ...tab };
  delete copy[key];
  return copy as PaneTab;
}

export function removeTab(
  node: PaneNode,
  paneId: string,
  tabPath: string,
  primaryId: string,
): PaneNode | null {
  return collapseLeaf(node, paneId, (leaf) => {
    const tabs = leaf.tabs.filter((tab) => tab.path !== tabPath);
    if (tabs.length === 0 && leaf.id !== primaryId && !leaf.declared) {
      return null;
    }
    return leafWith(
      leaf.id,
      tabs,
      leaf.active === tabPath ? undefined : leaf.active,
      leaf.declared,
    );
  });
}
