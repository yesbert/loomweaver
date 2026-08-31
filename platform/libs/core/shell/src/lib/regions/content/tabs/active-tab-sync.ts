import { ContentRoute } from '@loomweaver/plugin-sdk';
import { tabRootOf } from '../content-path';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import {
  autoOpenedTab,
  OpenTab,
  withRefreshedPath,
} from './content-tab-projection';

export interface ActiveTabSync {
  readonly routes: readonly ContentRoute[];
  readonly paneTree: PaneTreeService;
  readonly updateOpen: (
    change: (tabs: readonly OpenTab[]) => readonly OpenTab[],
  ) => void;
}

export function syncActiveTab(
  sync: ActiveTabSync,
  route: ContentRoute | undefined,
  root: string,
  path: string,
): void {
  const { routes, paneTree } = sync;
  sync.updateOpen((tabs) => {
    const index = tabs.findIndex((tab) => tabRootOf(routes, tab.path) === root);
    if (index !== -1) {
      return withRefreshedPath(tabs, index, path);
    }
    const opened = autoOpenedTab(route, root, path);
    return opened ? [...tabs, opened] : tabs;
  });
  const held = paneTree
    .primaryTabs(CONTENT_DOCK)
    .find((tab) => tabRootOf(routes, tab.path) === root);
  if (held) {
    paneTree.setActiveTab(
      CONTENT_DOCK,
      paneTree.primaryId(CONTENT_DOCK),
      held.path,
    );
  }
}
