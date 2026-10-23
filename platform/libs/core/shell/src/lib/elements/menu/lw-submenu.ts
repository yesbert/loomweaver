import type { MenuAnchorRect } from './lw-menu.element';

export const SUBMENU_PAUSE_MS = 150;

export const SUBMENU_GAP = 2;

const NESTED_MENU = ':scope > lw-menu';

export function nestedMenu(item: Element): HTMLElement | null {
  const holder = item.classList.contains('lw-menu-item-row') ? item.parentElement : item;
  return holder?.querySelector<HTMLElement>(NESTED_MENU) ?? null;
}

export function isNested(menu: HTMLElement): boolean {
  return menu.parentElement?.matches('lw-menu-item') ?? false;
}

export function submenuAnchor(
  menu: HTMLElement,
  item: HTMLElement,
  submenu: HTMLElement,
): MenuAnchorRect {
  const outer = menu.getBoundingClientRect();
  const row = item.getBoundingClientRect();
  const inset = Number.parseFloat(getComputedStyle(submenu).paddingTop) || 0;
  return {
    left: outer.left,
    right: outer.right,
    top: row.top - inset,
    bottom: row.bottom + inset,
  };
}

export function submenuMark(): HTMLSpanElement {
  const mark = document.createElement('span');
  mark.className = 'lw-menu-item-submenu';
  mark.setAttribute('aria-hidden', 'true');
  const icon = document.createElement('lw-icon');
  icon.setAttribute('name', 'chevronDown');
  icon.setAttribute('size', '0.875rem');
  mark.append(icon);
  return mark;
}

export function markOpener(item: HTMLElement, opens: boolean): void {
  if (!opens) {
    item.removeAttribute('aria-haspopup');
    item.removeAttribute('aria-expanded');
    return;
  }
  item.setAttribute('aria-haspopup', 'menu');
  if (!item.hasAttribute('aria-expanded')) {
    item.setAttribute('aria-expanded', 'false');
  }
}

export class SubmenuPause {
  private timer?: ReturnType<typeof setTimeout>;

  after(run: () => void): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      run();
    }, SUBMENU_PAUSE_MS);
  }

  cancel(): void {
    if (this.timer === undefined) {
      return;
    }
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
