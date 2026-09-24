import { MenuContext, TabBadge, ViewAction } from '@loomweaver/plugin-sdk';
import { CONTENT_DOCK, viewIdOfPanePath } from '../tree/pane-address';

export const VIEW_CONTEXT_MENU = 'panel/view/context';

export interface StripTab {
  readonly path: string;
  readonly title: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
  readonly badge?: TabBadge;
  readonly navPath?: string;
  readonly closable: boolean;
  readonly movable: boolean;
  readonly preview: boolean;
  readonly pinned: boolean;
  readonly instance?: string;
  readonly actions?: readonly ViewAction[];
}

export type TabAcceptance = boolean | ((path: string) => boolean);

export interface TabMenuPlace {
  readonly group: string;
  readonly paneId: string;
  readonly primary: boolean;
  readonly sole: boolean;
}

export function tabMenuContext(
  tab: StripTab,
  place: TabMenuPlace,
): MenuContext {
  const viewId = viewIdOfPanePath(tab.path);
  if (viewId !== null) {
    return {
      targetKind: 'view-tab',
      viewId,
      region: place.group,
      inContent: place.group === CONTENT_DOCK,
      sole: place.sole,
      ...(tab.instance && { instance: tab.instance }),
    };
  }
  return {
    targetKind: 'content-tab',
    tabId: tab.path,
    group: place.group,
    paneId: place.paneId,
    primary: place.primary,
    pinned: tab.pinned,
    closable: tab.closable,
    sole: place.sole,
  };
}
