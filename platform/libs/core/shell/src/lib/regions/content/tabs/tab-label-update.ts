import { isDevMode } from '@angular/core';
import { ContentTabLabel } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../plugin/surface-normalize';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { labelledTabs, PaneNode, withLabel } from '../../pane/tree/pane-node';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { matchRoute, normalizePath, tabRootOf } from '../content-path';

export function relabelled(
  node: PaneNode,
  matches: (path: string) => boolean,
  label: ContentTabLabel,
): PaneNode | null {
  return labelledTabs(
    node,
    (tab) => matches(tab.path),
    (tab) => withLabel(tab, label),
  );
}

export function updateTabLabel(
  paneTree: PaneTreeService,
  routes: readonly RegisteredContentRoute[],
  change: { path: string; label: ContentTabLabel; pluginId?: string },
): void {
  const root = tabRootOf(routes, normalizePath(change.path));
  const owner = matchRoute(routes, root)?.pluginId;
  if (change.pluginId !== undefined && owner !== change.pluginId) {
    if (owner !== undefined && isDevMode()) {
      console.warn(
        `Plugin "${change.pluginId}": updateContentTab("${change.path}") changed nothing, because another plugin registered that content.`,
      );
    }
    return;
  }
  const next = relabelled(
    paneTree.tree(CONTENT_DOCK),
    (tabPath) => tabRootOf(routes, tabPath) === root,
    change.label,
  );
  if (next !== null) {
    paneTree.commitTree(CONTENT_DOCK, next);
  }
}
