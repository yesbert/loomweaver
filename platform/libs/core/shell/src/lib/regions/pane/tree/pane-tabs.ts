import { PaneNode, PaneTab, leafWith, tabWithout } from './pane-node';
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
    if (existingIndex !== -1) {
      const tabs = leaf.tabs.map((existing, index_) =>
        index_ === existingIndex ? tab : existing,
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

export function replacePreviewTab(
  node: PaneNode,
  paneId: string,
  tab: PaneTab,
): PaneNode {
  return transformLeaf(node, paneId, (leaf) => ({
    ...leaf,
    tabs: leaf.tabs.map((held) => (held.preview === true ? tab : held)),
    active: tab.path,
  }));
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
    if (index === -1 || leaf.tabs[index].pinned === true) {
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
    if (index === -1) {
      return leaf;
    }
    const unpinned = tabWithout(leaf.tabs[index], 'pinned');
    return { ...leaf, tabs: reseatPinned(leaf.tabs, index, unpinned) };
  });
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

export function sparedByBulkClose(tab: PaneTab): boolean {
  return tab.pinned === true || tab.closable === false;
}
