import { AccessRequirement, ContentRoute } from '@loomweaver/plugin-sdk';
import { PaneNode } from '../../pane/tree/pane-node';
import { collectTabs } from '../../pane/tree/pane-queries';
import { isViewPanePath } from '../../pane/tree/pane-address';
import { normalizePath, tabRootOf } from '../content-path';
import { routeTitle, toOpenTab } from './content-tab-projection';

/**
 * A navigable content target the command palette's Quick-Open mode lists:
 * a registered surface reachable by plain navigation (a parameterless, non-chromeless route), or a
 * currently **open** tab — across every workspace pane. `lastActive` is a session-only epoch stamp of
 * when the target was last the active tab — it is not persisted (a fresh window starts with no
 * times), and it floats recently visited targets up.
 */
export interface QuickOpenTarget {
  /** The tab root — stable identity and the `tabId` for the tab context menu. */
  readonly path: string;
  /** The full path to navigate to (open: root + remembered sub-route; else the route path). */
  readonly navPath: string;
  readonly title: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
  readonly pinned: boolean;
  /** A target that is not an open tab is not closable — the context menu hides Close/Split/Pin. */
  readonly closable: boolean;
  readonly lastActive?: number;
}

export function quickOpenTargetsOf(
  tree: PaneNode,
  routes: readonly ContentRoute[],
  lastActive: ReadonlyMap<string, number>,
  meets: (access: AccessRequirement | undefined) => boolean,
): QuickOpenTarget[] {
  const openRoots = new Set<string>();
  const open: QuickOpenTarget[] = [];
  for (const paneTab of collectTabs(tree)) {
    if (isViewPanePath(paneTab.path)) {
      continue;
    }
    const projected = toOpenTab(routes, paneTab, undefined);
    const root = tabRootOf(routes, projected.path);
    if (openRoots.has(root)) {
      continue;
    }
    openRoots.add(root);
    open.push({
      path: root,
      navPath: projected.path,
      title: projected.title,
      literalTitle: projected.literalTitle,
      icon: projected.icon,
      pinned: projected.pinned,
      closable: projected.closable,
      lastActive: lastActive.get(root),
    });
  }
  const statics = routes.flatMap<QuickOpenTarget>((route) => {
    const path = normalizePath(route.path);
    if (
      path === '' ||
      path.includes(':') ||
      route.chromeless === true ||
      !meets(route.access) ||
      openRoots.has(path)
    ) {
      return [];
    }
    return [
      {
        path,
        navPath: route.path,
        ...routeTitle(route, path),
        icon: route.icon,
        pinned: false,
        closable: false,
        lastActive: lastActive.get(path),
      },
    ];
  });
  return [...open, ...statics];
}
