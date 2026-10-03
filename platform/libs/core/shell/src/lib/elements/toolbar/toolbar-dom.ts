import { MenuContext } from '@loomweaver/plugin-sdk';
import { LwToolbarEntry } from './toolbar-entry';

export const ENTRY_ATTRIBUTE = 'data-lw-entry';

export const FOLD_ATTRIBUTE = 'data-lw-fold';

export const CELL_ATTRIBUTE = 'data-lw-cell';

export const FOLDED_ATTRIBUTE = 'data-lw-folded';

export const CELL_ORDER_ATTRIBUTE = 'order';

export const TRAY_CLASS = 'lw-toolbar-tray';

export const SEPARATOR_CLASS = 'lw-toolbar-separator';

export const ENTRY_SELECTOR = `[${ENTRY_ATTRIBUTE}]`;

export const FOLD_SELECTOR = `[${FOLD_ATTRIBUTE}]`;

export const ENTRY_BUTTON_SELECTOR = `button${ENTRY_SELECTOR}`;

export const FOCUSABLE_SELECTOR = 'button, a[href], input, [tabindex]';

export interface RowItem {
  readonly id: string;
  readonly order: number;
  readonly node: HTMLElement;
  readonly group?: string;
}

let counter = 0;

export function nextToolbarId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function parseContext(raw: string | null): MenuContext {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as MenuContext)
      : {};
  } catch {
    return {};
  }
}

export function orderOf(cell: HTMLElement): number {
  const parsed = Number(cell.getAttribute(CELL_ORDER_ATTRIBUTE));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isCellNode(node: Node): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    !node.hasAttribute(ENTRY_ATTRIBUTE) &&
    !node.hasAttribute(FOLD_ATTRIBUTE) &&
    !node.classList.contains(TRAY_CLASS) &&
    !node.classList.contains(SEPARATOR_CLASS)
  );
}

export function cellIdOf(cell: HTMLElement): string {
  let id = cell.getAttribute(CELL_ATTRIBUTE);
  if (!id) {
    id = nextToolbarId('cell');
    cell.setAttribute(CELL_ATTRIBUTE, id);
  }
  return `cell:${id}`;
}

export function reflectExpanded(
  button: HTMLButtonElement,
  openKey: string | null,
): void {
  if (!button.hasAttribute('aria-haspopup')) {
    button.removeAttribute('aria-expanded');
    return;
  }
  button.setAttribute(
    'aria-expanded',
    String(button.getAttribute(ENTRY_ATTRIBUTE) === openKey),
  );
}

export function entryButton(
  entry: LwToolbarEntry,
  existing: HTMLButtonElement | undefined,
  openKey: string | null,
): HTMLButtonElement {
  const button = existing ?? document.createElement('button');
  button.type = 'button';
  button.setAttribute(ENTRY_ATTRIBUTE, entry.key);
  button.className = entry.icon
    ? 'lw-icon-btn lw-toolbar-entry'
    : 'lw-toolbar-entry lw-toolbar-entry--text';
  button.disabled = entry.disabled === true;
  button.setAttribute('aria-label', entry.label);
  if (entry.pressed === undefined) {
    button.removeAttribute('aria-pressed');
  } else {
    button.setAttribute('aria-pressed', String(entry.pressed));
  }
  if (entry.opensMenu) {
    button.setAttribute('aria-haspopup', 'menu');
  } else {
    button.removeAttribute('aria-haspopup');
  }
  reflectExpanded(button, openKey);
  button.replaceChildren(...entryContent(entry));
  return button;
}

function entryContent(entry: LwToolbarEntry): HTMLElement[] {
  if (entry.icon) {
    const icon = document.createElement('lw-icon');
    icon.setAttribute('name', entry.icon);
    icon.setAttribute('size', '1rem');
    const tooltip = document.createElement('lw-tooltip');
    tooltip.setAttribute(
      'text',
      entry.shortcut ? `${entry.label} (${entry.shortcut})` : entry.label,
    );
    tooltip.setAttribute('position', 'bottom');
    return [icon, tooltip];
  }
  const text = document.createElement('span');
  text.textContent = entry.label;
  if (!entry.shortcut) {
    return [text];
  }
  const shortcut = document.createElement('kbd');
  shortcut.className = 'lw-toolbar-shortcut';
  shortcut.setAttribute('aria-hidden', 'true');
  shortcut.textContent = entry.shortcut;
  return [text, shortcut];
}

export function separator(): HTMLElement {
  const element = document.createElement('span');
  element.className = SEPARATOR_CLASS;
  element.setAttribute('role', 'separator');
  element.setAttribute('aria-orientation', 'vertical');
  return element;
}

export function foldControl(label: string, anchorName: string): HTMLButtonElement {
  const control = document.createElement('button');
  control.type = 'button';
  control.setAttribute(FOLD_ATTRIBUTE, '');
  control.className = 'lw-icon-btn lw-toolbar-entry';
  control.setAttribute('aria-label', label);
  control.setAttribute('aria-haspopup', 'true');
  control.style.setProperty('anchor-name', anchorName);
  const icon = document.createElement('lw-icon');
  icon.setAttribute('name', 'more');
  icon.setAttribute('size', '1rem');
  control.append(icon);
  return control;
}

export function tray(label: string, anchorName: string): HTMLElement {
  const element = document.createElement('div');
  element.className = TRAY_CLASS;
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', label);
  element.style.setProperty('position-anchor', anchorName);
  element.hidden = true;
  return element;
}

export function focusStopsOf(children: HTMLCollection): HTMLElement[] {
  const stops: HTMLElement[] = [];
  for (const child of children) {
    if (child instanceof HTMLButtonElement) {
      if (!child.disabled) {
        stops.push(child);
      }
      continue;
    }
    if (!(child instanceof HTMLElement) || child.classList.contains(TRAY_CLASS)) {
      continue;
    }
    const inner = child.matches(FOCUSABLE_SELECTOR)
      ? child
      : child.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    if (inner) {
      stops.push(inner);
    }
  }
  return stops;
}
