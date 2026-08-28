import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';

export const POPOUT_PREFIX = 'popout';

const VIEW_SEGMENT = 'view/';

function withoutQuery(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

function bare(url: string): string {
  return withoutQuery(url).replace(/^\/+/, '').replace(/\/+$/, '');
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
    return VIEW_PANE_PREFIX + rest.slice(VIEW_SEGMENT.length);
  }
  return rest;
}

export function popoutUrlFor(paneTarget: string): string {
  if (paneTarget.startsWith(VIEW_PANE_PREFIX)) {
    const id = paneTarget.slice(VIEW_PANE_PREFIX.length);
    return `/${POPOUT_PREFIX}/${VIEW_SEGMENT}${id}`;
  }
  const path = paneTarget.replace(/^\/+/, '');
  return path === ''
    ? `/${POPOUT_PREFIX}`
    : `/${POPOUT_PREFIX}/${path}`;
}
