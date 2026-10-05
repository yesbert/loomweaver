import { withoutTrailingSlashes } from '../foundation/wire/path-text';
import { normalizePath } from '../regions/content/content-path';
import { viewIdOfPanePath, viewPanePath } from '../regions/pane/tree/pane-address';

export const POPOUT_PREFIX = 'popout';

const VIEW_SEGMENT = 'view/';

function bare(url: string): string {
  return withoutTrailingSlashes(normalizePath(url));
}

export function isPopoutUrl(url: string): boolean {
  const path = bare(url);
  return path === POPOUT_PREFIX || path.startsWith(`${POPOUT_PREFIX}/`);
}

export function popoutTargetFromUrl(url: string): string | null {
  if (!isPopoutUrl(url)) {
    return null;
  }
  const rest = bare(url).slice(POPOUT_PREFIX.length).replace(/^\/+/, '');
  if (rest.startsWith(VIEW_SEGMENT)) {
    return viewPanePath(rest.slice(VIEW_SEGMENT.length));
  }
  return rest;
}

export function popoutUrlFor(paneTarget: string): string {
  const viewId = viewIdOfPanePath(paneTarget);
  if (viewId !== null) {
    return `/${POPOUT_PREFIX}/${VIEW_SEGMENT}${viewId}`;
  }
  const path = paneTarget.replace(/^\/+/, '');
  return path === ''
    ? `/${POPOUT_PREFIX}`
    : `/${POPOUT_PREFIX}/${path}`;
}
