export const PRIMARY_PANE = 'main';

export const VIEW_PANE_PREFIX = 'view:';

export const CONTENT_DOCK = 'content';

/**
 * Names one pane of the workbench: the dock it belongs to (`'content'` for the main area, a
 * sidebar region's id otherwise) and the pane's id within it. A tab's menu context carries both as
 * `group` and `paneId`, so a command can act on the pane the tab stands in.
 */
export interface PaneRef {
  readonly dock: string;
  readonly paneId: string;
}

export function isSamePane(a: PaneRef, b: PaneRef): boolean {
  return a.dock === b.dock && a.paneId === b.paneId;
}

export function viewIdOfPanePath(path: string): string | null {
  return path.startsWith(VIEW_PANE_PREFIX)
    ? path.slice(VIEW_PANE_PREFIX.length)
    : null;
}

export function viewForPanePath<T extends { readonly id: string }>(
  views: readonly T[],
  path: string,
): T | undefined {
  const id = viewIdOfPanePath(path);
  return id === null ? undefined : views.find((view) => view.id === id);
}

export function promotedContentPath(promoted: string): string {
  return promoted.startsWith(VIEW_PANE_PREFIX) ? '' : promoted;
}
