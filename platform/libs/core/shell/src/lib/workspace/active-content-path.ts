import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { activeTab } from '../regions/pane/tree/pane-node';
import { findLeaf } from '../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';

export function activeContentPath(paneTree: PaneTreeService): string {
  const primary = findLeaf(
    paneTree.tree(CONTENT_DOCK),
    paneTree.primaryId(CONTENT_DOCK),
  );
  const path = primary ? activeTab(primary)?.path : undefined;
  return !path || path.startsWith(VIEW_PANE_PREFIX) ? '' : path;
}
