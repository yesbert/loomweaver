import { isDevMode } from '@angular/core';
import { ContentTabLabel } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../plugin/surface-normalize';
import { tabBadgeOf } from '../../pane/chrome/tab-badge';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneNode, PaneTab } from '../../pane/tree/pane-node';
import { tabWithout } from '../../pane/tree/pane-tabs';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { matchRoute, normalizePath, tabRootOf } from '../content-path';

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

export function relabelled(
  node: PaneNode,
  matches: (path: string) => boolean,
  label: ContentTabLabel,
): PaneNode | null {
  if (node.kind === 'leaf') {
    if (!node.tabs.some((tab) => matches(tab.path))) {
      return null;
    }
    const tabs = node.tabs.map((tab) =>
      matches(tab.path) ? withLabel(tab, label) : tab,
    );
    return { ...node, tabs };
  }
  const first = relabelled(node.first, matches, label);
  const second = relabelled(node.second, matches, label);
  if (first === null && second === null) {
    return null;
  }
  return { ...node, first: first ?? node.first, second: second ?? node.second };
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
