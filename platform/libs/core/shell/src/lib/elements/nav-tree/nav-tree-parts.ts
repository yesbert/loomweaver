import { LW_ICON_TAG } from '../icon/lw-icon.element';

export const MANAGED = 'data-lw-nav-part';

export function managedPart(
  host: HTMLElement,
  part: string,
  tag: string,
): HTMLElement {
  const existing = [...host.children].find(
    (child) => child.getAttribute(MANAGED) === part,
  );
  if (existing instanceof HTMLElement && existing.localName === tag) {
    return existing;
  }
  existing?.remove();
  const created = document.createElement(tag);
  created.setAttribute(MANAGED, part);
  return created;
}

export function dropManagedPart(host: HTMLElement, part: string): void {
  managedPartIn(host, part)?.remove();
}

export function managedPartIn(
  host: HTMLElement,
  part: string,
): Element | undefined {
  return [...host.children].find((child) => child.getAttribute(MANAGED) === part);
}

export function setGlyph(host: HTMLElement, part: string, icon: string): void {
  const glyph = managedPart(host, part, LW_ICON_TAG);
  glyph.setAttribute('name', icon);
  glyph.setAttribute('size', '1rem');
  glyph.classList.add('lw-nav-glyph');
  if (glyph.parentElement !== host) {
    host.prepend(glyph);
  }
}

export function longestMatch(
  candidates: readonly string[],
  matches: (candidate: string) => boolean,
): string | null {
  let best: string | null = null;
  for (const candidate of candidates) {
    if (matches(candidate) && (best === null || candidate.length > best.length)) {
      best = candidate;
    }
  }
  return best;
}

export function pathOf(item: Element): string {
  return item.getAttribute('path') ?? '';
}
