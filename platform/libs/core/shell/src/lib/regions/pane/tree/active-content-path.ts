import { CONTENT_DOCK, promotedContentPath } from './pane-address';
import { leafPath } from './pane-node';
import { findLeaf } from './pane-queries';
import { PaneTreeService } from './pane-tree.service';

export function activeContentPath(paneTree: PaneTreeService): string {
  const primary = findLeaf(
    paneTree.tree(CONTENT_DOCK),
    paneTree.primaryId(CONTENT_DOCK),
  );
  const path = primary ? leafPath(primary) : undefined;
  return path ? promotedContentPath(path) : '';
}
