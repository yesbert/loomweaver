import { AccessRequirement, ContentRoute, ViewAction } from '@loomweaver/plugin-sdk';
import { View } from '../../../layout/view';
import { PaneTab } from '../../pane/tree/pane-node';
import { overlayTabTitle } from '../../pane/drag/pane-label';
import { matchRoute, tabRootOf } from '../content-path';

const DYNAMIC_TAB_ORDER_BASE = 1000;
const VIEW_TAB_ORDER_BASE = 2000;

export interface OpenTab {
  readonly path: string;
  readonly title: string;
  readonly icon?: string;
  readonly literalTitle: boolean;
  readonly onClose?: () => void;
  readonly preview: boolean;
  readonly pinned: boolean;
  readonly closable: boolean;
}

/** One rendered tab in the content strip (static or dynamic), as the content-area template consumes it. */
export interface ContentTabView {
  /** The tab **root** — stable identity (tracking, active compare, close). */
  readonly path: string;
  /** The full path to navigate to when the tab is selected (root + remembered sub-route). */
  readonly navPath: string;
  readonly title: string;
  /** When true the host shows `title` verbatim; otherwise it is a Transloco key (finding #8). */
  readonly literalTitle: boolean;
  readonly icon?: string;
  readonly order: number;
  /** Dynamic tabs show a close affordance; static (registered) tabs do not. */
  readonly closable: boolean;
  /** A preview tab renders its title in italics until promoted. */
  readonly preview: boolean;
  /** A pinned tab is sorted to the group's front and shows an unpin control instead of close. */
  readonly pinned: boolean;
  readonly actions?: readonly ViewAction[];
}

export function defaultTabTitle(
  route: ContentRoute | undefined,
  root: string,
): { readonly title: string; readonly literalTitle: boolean } {
  return {
    title: route?.title ?? root.split('/').pop() ?? root,
    literalTitle:
      route?.title === undefined ? true : (route.titleIsLiteral ?? false),
  };
}

export function withRefreshedPath(
  tabs: readonly OpenTab[],
  index: number,
  path: string,
): readonly OpenTab[] {
  return tabs[index].path === path
    ? tabs
    : tabs.map((tab, index_) => (index_ === index ? { ...tab, path } : tab));
}

export function autoOpenedTab(
  route: ContentRoute | undefined,
  root: string,
  path: string,
): OpenTab | null {
  if (
    !route ||
    route.chromeless === true ||
    route.follows === true ||
    root === ''
  ) {
    return null;
  }
  return {
    path,
    ...defaultTabTitle(route, root),
    icon: route.icon,
    preview: false,
    pinned: false,
    closable: route.closable !== false,
  };
}

export function toOpenTab(
  routes: readonly ContentRoute[],
  tab: PaneTab,
  onClose: (() => void) | undefined,
): OpenTab {
  const root = tabRootOf(routes, tab.path);
  const route = matchRoute(routes, tab.path);
  const effective = overlayTabTitle(tab, {
    ...defaultTabTitle(route, root),
    icon: route?.icon,
  });
  return {
    path: tab.path,
    title: effective.title,
    literalTitle: effective.literalTitle,
    icon: effective.icon,
    onClose,
    preview: tab.preview ?? false,
    pinned: tab.pinned ?? false,
    closable: tab.closable !== false && route?.closable !== false,
  };
}

export function toPaneTab(tab: OpenTab): PaneTab {
  return {
    path: tab.path,
    title: tab.title,
    ...(tab.literalTitle && { literalTitle: true }),
    ...(tab.icon !== undefined && { icon: tab.icon }),
    ...(tab.pinned && { pinned: true }),
    ...(tab.preview && { preview: true }),
    ...(!tab.closable && { closable: false }),
  };
}

export function facetTabViews(
  routes: readonly ContentRoute[],
  addressOf: (route: ContentRoute) => string | null = (route) => route.path,
): ContentTabView[] {
  return routes
    .filter((route) => route.follows === true)
    .map((route) => ({ route, address: addressOf(route) }))
    .filter(
      (entry): entry is typeof entry & { address: string } =>
        entry.address !== null,
    )
    .toSorted(
      (a, b) =>
        (a.route.order ?? 0) - (b.route.order ?? 0) ||
        a.route.path.localeCompare(b.route.path),
    )
    .map(({ route, address }, index) => ({
      path: route.path,
      navPath: address,
      title: route.title ?? route.path,
      literalTitle:
        route.title === undefined ? true : (route.titleIsLiteral ?? false),
      icon: route.icon,
      order: index,
      closable: false,
      preview: false,
      pinned: false,
    }));
}

export function dynamicTabViews(
  routes: readonly ContentRoute[],
  ordered: readonly OpenTab[],
): ContentTabView[] {
  return ordered.map((tab, index) => ({
    path: tabRootOf(routes, tab.path),
    navPath: tab.path,
    title: tab.title,
    literalTitle: tab.literalTitle,
    icon: tab.icon,
    order: DYNAMIC_TAB_ORDER_BASE + index,
    closable: tab.closable,
    preview: tab.preview,
    pinned: tab.pinned,
  }));
}

export function viewTabViews(
  paneTabs: readonly { readonly path: string }[],
  viewOf: (id: string) => View | undefined,
  meets: (access: AccessRequirement | undefined) => boolean,
  viewPanePrefix: string,
): ContentTabView[] {
  return paneTabs
    .filter((tab) => tab.path.startsWith(viewPanePrefix))
    .flatMap((tab, index) => {
      const view = viewOf(tab.path.slice(viewPanePrefix.length));
      if (!view || !meets(view.access)) {
        return [];
      }
      return [
        {
          path: tab.path,
          navPath: tab.path,
          title: view.title,
          literalTitle: false,
          icon: view.icon,
          order: VIEW_TAB_ORDER_BASE + index,
          closable: view.closable !== false,
          preview: false,
          pinned: false,
        },
      ];
    });
}
