import { Command, MenuHeader } from '@loomweaver/plugin-sdk';
import { nameShowing } from '../foundation/name-showing';

export const HEADING_KEY = '__heading';

export type HeadingTarget = Pick<Command, 'title'>;

const purposes = new WeakMap<HTMLElement, string>();

export function drawMenuHeading(
  header: MenuHeader,
  leadsTo?: HeadingTarget,
): HTMLElement {
  const element = document.createElement('div');
  element.className = 'lw-menu-header';
  if (leadsTo) {
    element.setAttribute('role', 'menuitem');
    element.setAttribute('command', HEADING_KEY);
    element.tabIndex = -1;
  } else {
    element.setAttribute('aria-hidden', 'true');
  }

  const mark = drawMark(header, () => nameHeading(element));
  if (mark) {
    element.append(mark, ' ');
  }
  element.append(drawLines(header));
  return element;
}

export function wordMenuHeading(
  element: HTMLElement,
  header: MenuHeader,
  translate: (key: string) => string,
  leadsTo?: HeadingTarget,
): string {
  const title = translate(header.title);
  const detail = header.detail ? translate(header.detail) : undefined;
  const name = element.querySelector('.lw-menu-header-title');
  if (name) {
    name.textContent = title;
  }
  const second = element.querySelector<HTMLElement>('.lw-menu-header-detail');
  if (second) {
    second.textContent = detail ?? '';
    second.hidden = !detail;
  }
  if (leadsTo) {
    purposes.set(element, translate(leadsTo.title));
    nameHeading(element);
  }
  return detail ? `${title}, ${detail}` : title;
}

function nameHeading(element: HTMLElement): void {
  const purpose = purposes.get(element);
  if (purpose === undefined) {
    return;
  }
  const mark = element.querySelector('.lw-menu-header-mark');
  const shown = [
    mark?.querySelector('lw-icon') ? undefined : mark?.textContent,
    element.querySelector('.lw-menu-header-title')?.textContent,
    element.querySelector('.lw-menu-header-detail:not([hidden])')?.textContent,
  ].map((text) => text ?? undefined);
  element.setAttribute('aria-label', nameShowing(shown, purpose));
}

function drawLines(header: MenuHeader): HTMLElement {
  const lines = document.createElement('span');
  lines.className = 'lw-menu-header-lines';
  const name = document.createElement('span');
  name.className = 'lw-menu-header-title';
  lines.append(name);
  if (header.detail) {
    const second = document.createElement('span');
    second.className = 'lw-menu-header-detail';
    lines.append(' ', second);
  }
  return lines;
}

function drawMark(
  header: MenuHeader,
  onChange: () => void,
): HTMLElement | undefined {
  if (!header.image && !header.initials && !header.icon) {
    return undefined;
  }
  const mark = document.createElement('span');
  mark.className = 'lw-menu-header-mark';
  mark.append(...markContent(header));
  if (header.image) {
    const picture = mark.firstElementChild as HTMLImageElement;
    picture.addEventListener('error', () => {
      mark.replaceChildren(...markContent({ ...header, image: undefined }));
      onChange();
    });
  }
  return mark;
}

function markContent(header: MenuHeader): Node[] {
  if (header.image) {
    const picture = document.createElement('img');
    picture.src = header.image;
    picture.alt = '';
    picture.className = 'lw-menu-header-picture';
    return [picture];
  }
  if (header.initials) {
    return [document.createTextNode(header.initials)];
  }
  if (header.icon) {
    const icon = document.createElement('lw-icon');
    icon.setAttribute('name', header.icon);
    icon.setAttribute('size', '1rem');
    return [icon];
  }
  return [];
}
