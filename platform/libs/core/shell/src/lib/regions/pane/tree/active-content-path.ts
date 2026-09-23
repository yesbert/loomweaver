import { CONTENT_DOCK } from './pane-address';
import { contentPathIn } from './pane-queries';
import { PaneTreeService } from './pane-tree.service';

export function activeContentPath(paneTree: PaneTreeService): string {
  return contentPathIn(
    paneTree.tree(CONTENT_DOCK),
    paneTree.primaryId(CONTENT_DOCK),
  );
}
