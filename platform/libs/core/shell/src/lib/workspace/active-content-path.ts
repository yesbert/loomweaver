import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { activeTab, PaneNode } from '../regions/pane/tree/pane-node';
import { findLeaf } from '../regions/pane/tree/pane-queries';
import { DockEntry } from '../regions/pane/tree/pane-restore';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';

function pathIn(node: PaneNode, primaryId: string): string {
  const primary = findLeaf(node, primaryId);
  const path = primary ? activeTab(primary)?.path : undefined;
  return !path || path.startsWith(VIEW_PANE_PREFIX) ? '' : path;
}

export function activeContentPath(paneTree: PaneTreeService): string {
  return pathIn(paneTree.tree(CONTENT_DOCK), paneTree.primaryId(CONTENT_DOCK));
}

export function contentPathOf(entry: DockEntry | undefined): string {
  return entry === undefined ? '' : pathIn(entry.node, entry.primary);
}
