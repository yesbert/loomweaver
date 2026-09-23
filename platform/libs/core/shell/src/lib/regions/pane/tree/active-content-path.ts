import { CONTENT_DOCK } from './pane-address';
import { contentPathIn } from './pane-queries';
import { DockEntry } from './pane-restore';
import { PaneTreeService } from './pane-tree.service';

export function activeContentPath(paneTree: PaneTreeService): string {
  return contentPathIn(
    paneTree.tree(CONTENT_DOCK),
    paneTree.primaryId(CONTENT_DOCK),
  );
}

export function contentPathOf(entry: DockEntry | undefined): string {
  return entry === undefined ? '' : contentPathIn(entry.node, entry.primary);
}
