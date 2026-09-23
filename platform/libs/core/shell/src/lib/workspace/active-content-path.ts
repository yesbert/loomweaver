import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { contentPathIn } from '../regions/pane/tree/pane-queries';
import { DockEntry } from '../regions/pane/tree/pane-restore';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';

export function activeContentPath(paneTree: PaneTreeService): string {
  return contentPathIn(
    paneTree.tree(CONTENT_DOCK),
    paneTree.primaryId(CONTENT_DOCK),
  );
}

export function contentPathOf(entry: DockEntry | undefined): string {
  return entry === undefined ? '' : contentPathIn(entry.node, entry.primary);
}
