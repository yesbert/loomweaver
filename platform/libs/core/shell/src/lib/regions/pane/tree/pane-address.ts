export const PRIMARY_PANE = 'main';

export const VIEW_PANE_PREFIX = 'view:';

export const CONTENT_DOCK = 'content';

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
