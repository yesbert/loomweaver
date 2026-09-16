import { Command, MenuHeader } from '@loomweaver/plugin-sdk';

export const HEADING_KEY = '__heading';

export function drawMenuHeading(
  header: MenuHeader,
  menu: HTMLElement,
  translate: (key: string) => string,
  leadsTo?: Command,
): HTMLElement {
  const title = translate(header.title);
  const detail = header.detail ? translate(header.detail) : undefined;
  menu.setAttribute('aria-label', detail ? `${title}, ${detail}` : title);

  const element = document.createElement('div');
  element.className = 'lw-menu-header';
  if (leadsTo) {
    element.setAttribute('role', 'menuitem');
    element.setAttribute('command', HEADING_KEY);
    element.setAttribute('aria-label', translate(leadsTo.title));
    element.tabIndex = -1;
  } else {
    element.setAttribute('aria-hidden', 'true');
  }

  const mark = drawMark(header);
  if (mark) {
    element.append(mark);
  }
  element.append(drawLines(title, detail));
  return element;
}

function drawLines(title: string, detail: string | undefined): HTMLElement {
  const lines = document.createElement('span');
  lines.className = 'lw-menu-header-lines';
  const name = document.createElement('span');
  name.className = 'lw-menu-header-title';
  name.textContent = title;
  lines.append(name);
  if (detail) {
    const second = document.createElement('span');
    second.className = 'lw-menu-header-detail';
    second.textContent = detail;
    lines.append(second);
  }
  return lines;
}

function drawMark(header: MenuHeader): HTMLElement | undefined {
  if (!header.image && !header.initials && !header.icon) {
    return undefined;
  }
  const mark = document.createElement('span');
  mark.className = 'lw-menu-header-mark';
  mark.append(...markContent(header));
  if (header.image) {
    const picture = mark.firstElementChild as HTMLImageElement;
    picture.addEventListener('error', () =>
      mark.replaceChildren(...markContent({ ...header, image: undefined })),
    );
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
