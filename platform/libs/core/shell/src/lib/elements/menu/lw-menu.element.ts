import { focusAndReveal, rovingStep, rovingTabIndex } from '../roving-focus';
import { clampIntoViewport, fitsInViewport } from '../viewport-fit';
import { defineElementOnce } from '../custom-elements';
import {
  entryOf,
  holderOf,
  isNested,
  nestedMenu,
  SUBMENU_GAP,
  submenuAnchor,
  SubmenuPause,
} from './lw-submenu';
import { LW_MENU_ITEM_TAG, LwMenuItemElement } from './lw-menu-item.element';

export { LW_MENU_ITEM_TAG, LwMenuItemElement } from './lw-menu-item.element';

export const LW_MENU_TAG = 'lw-menu';

export const MENU_ANCHOR_GAP = 4;

export const LW_MENU_SELECT = 'lw-menu-select';

export const LW_MENU_DISMISS = 'lw-menu-dismiss';

export type MenuSide = 'top' | 'right' | 'bottom' | 'left';

export interface MenuAnchorRect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

function beside(
  preferred: number,
  opposite: number,
  size: number,
  limit: number,
): number {
  if (fitsInViewport(preferred, size, limit)) {
    return preferred;
  }
  return fitsInViewport(opposite, size, limit) ? opposite : clampIntoViewport(preferred, size, limit);
}

function aligned(
  near: number,
  far: number,
  size: number,
  limit: number,
): number {
  return fitsInViewport(near, size, limit) ? near : clampIntoViewport(far - size, size, limit);
}

export class LwMenuElement extends HTMLElement {
  private active = -1;

  private opener?: HTMLElement;

  private readonly pause = new SubmenuPause();

  connectedCallback(): void {
    this.setAttribute('role', 'menu');
    this.tabIndex = -1;
    this.addEventListener('keydown', this.onKeydown);
    this.addEventListener('click', this.onClick);
    this.addEventListener('pointerover', this.onPointerOver);
    if (isNested(this)) {
      this.hidden = true;
      return;
    }

    queueMicrotask(() => {
      if (this.isConnected) {
        this.focus();
      }
    });
  }

  disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeydown);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('pointerover', this.onPointerOver);
    this.pause.cancel();
  }

  openAt(x: number, y: number): void {
    const { width, height } = this.measured();
    this.place(
      clampIntoViewport(x, width, window.innerWidth),
      clampIntoViewport(y, height, window.innerHeight),
    );
  }

  openBeside(rect: MenuAnchorRect, side: MenuSide): void {
    const { width, height } = this.measured();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const after = { x: rect.right + MENU_ANCHOR_GAP, y: rect.bottom + MENU_ANCHOR_GAP };
    const before = {
      x: rect.left - MENU_ANCHOR_GAP - width,
      y: rect.top - MENU_ANCHOR_GAP - height,
    };
    if (side === 'left' || side === 'right') {
      const preferred = side === 'right' ? after.x : before.x;
      const opposite = side === 'right' ? before.x : after.x;
      this.place(
        beside(preferred, opposite, width, viewportWidth),
        aligned(rect.top, rect.bottom, height, viewportHeight),
      );
      return;
    }
    const preferred = side === 'bottom' ? after.y : before.y;
    const opposite = side === 'bottom' ? before.y : after.y;
    this.place(
      aligned(rect.left, rect.right, width, viewportWidth),
      beside(preferred, opposite, height, viewportHeight),
    );
  }

  private readonly onKeydown = (event: KeyboardEvent) =>
    this.handleKeydown(event);

  private readonly onClick = (event: MouseEvent) => {
    const item = this.ownItemAt(event.target);
    if (!item || this.isDisabled(item)) {
      return;
    }
    if (nestedMenu(item)) {
      this.openSubmenu(item, false);
    } else {
      this.select(item);
    }
  };

  private readonly onPointerOver = (event: Event) => {
    const target = event.target as Node;
    if (this.opener && holderOf(this.opener)?.contains(target)) {
      this.pause.cancel();
      return;
    }
    const item = this.ownItemAt(event.target);
    if (!item) {
      return;
    }
    if (nestedMenu(item) && !this.isDisabled(item)) {
      this.pause.after(() => this.openSubmenu(item, false));
    } else if (this.opener) {
      this.pause.after(() => this.closeSubmenu(false));
    } else {
      this.pause.cancel();
    }
  };

  private owns(target: EventTarget | null): boolean {
    return (target as Element | null)?.closest?.(LW_MENU_TAG) === this;
  }

  private ownItemAt(target: EventTarget | null): HTMLElement | null {
    if (!this.owns(target)) {
      return null;
    }
    return (target as Element).closest<HTMLElement>('[role^="menuitem"]');
  }

  private openSubmenu(item: HTMLElement, focusFirst: boolean): void {
    const submenu = nestedMenu(item) as LwMenuElement | null;
    if (!submenu) {
      return;
    }
    this.pause.cancel();
    if (this.opener !== item) {
      this.closeSubmenu(false);
    }
    this.opener = item;
    this.active = this.items().indexOf(item);
    submenu.hidden = false;
    item.setAttribute('aria-expanded', 'true');
    submenu.unfoldBeside(submenuAnchor(this, item, submenu));
    if (focusFirst) {
      submenu.setActive(0);
    }
  }

  private unfoldBeside(rect: MenuAnchorRect): void {
    const { width, height } = this.measured();
    this.place(
      beside(
        rect.right + SUBMENU_GAP,
        rect.left - SUBMENU_GAP - width,
        width,
        window.innerWidth,
      ),
      clampIntoViewport(rect.top, height, window.innerHeight),
    );
  }

  private closeSubmenu(focusOpener: boolean): void {
    const item = this.opener;
    if (!item) {
      return;
    }
    this.opener = undefined;
    this.pause.cancel();
    const submenu = nestedMenu(item) as LwMenuElement | null;
    if (submenu) {
      submenu.closeSubmenu(false);
      submenu.active = -1;
      submenu.hidden = true;
    }
    item.setAttribute('aria-expanded', 'false');
    if (focusOpener) {
      item.focus();
    }
  }

  private closeFromInside(): void {
    const owner = this.parentElement?.closest<LwMenuElement>(LW_MENU_TAG);
    owner?.closeSubmenu(true);
  }

  private measured(): DOMRect {
    this.place(0, 0);
    return this.getBoundingClientRect();
  }

  private place(left: number, top: number): void {
    this.style.left = `${left}px`;
    this.style.top = `${top}px`;
  }

  private items(): HTMLElement[] {
    return [...this.children]
      .map((child) => entryOf(child))
      .filter(
        (item): item is HTMLElement =>
          item !== null && item.matches('[role^="menuitem"]') && !this.isDisabled(item),
      );
  }

  private isDisabled(item: HTMLElement): boolean {
    return (
      item.getAttribute('aria-disabled') === 'true' ||
      item.hasAttribute('disabled')
    );
  }

  private setActive(index: number): void {
    const items = this.items();
    if (items.length === 0) {
      return;
    }
    this.active = (index + items.length) % items.length;
    if (this.opener && this.opener !== items[this.active]) {
      this.closeSubmenu(false);
    }
    rovingTabIndex(items, this.active);
    focusAndReveal(items[this.active]);
  }

  private select(item: HTMLElement): void {
    this.dispatchEvent(
      new CustomEvent(LW_MENU_SELECT, {
        detail: { command: item.getAttribute('command') },
        bubbles: true,
      }),
    );
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.owns(event.target)) {
      return;
    }
    const step = rovingStep(event.key, this.active, this.items().length, 'vertical');
    if (step !== undefined) {
      this.setActive(step);
      event.preventDefault();
      return;
    }
    const item = this.active >= 0 ? this.items()[this.active] : undefined;
    switch (event.key) {
      case 'ArrowRight': {
        if (item && nestedMenu(item)) {
          this.openSubmenu(item, true);
        }
        break;
      }
      case 'ArrowLeft': {
        if (isNested(this)) {
          this.closeFromInside();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        if (item && nestedMenu(item)) {
          this.openSubmenu(item, true);
        } else if (item) {
          this.select(item);
        }
        break;
      }
      case 'Escape': {
        if (isNested(this)) {
          this.closeFromInside();
        } else {
          this.dispatchEvent(new CustomEvent(LW_MENU_DISMISS, { bubbles: true }));
        }
        break;
      }
      case 'Tab': {
        this.dispatchEvent(new CustomEvent(LW_MENU_DISMISS, { bubbles: true }));
        return;
      }
      default: {
        return;
      }
    }
    event.preventDefault();
  }
}

/** Registers `<lw-menu>` and its items once (idempotent), called from {@link provideShell} at bootstrap. */
export function defineLwMenu(): void {
  defineElementOnce(LW_MENU_ITEM_TAG, LwMenuItemElement);
  defineElementOnce(LW_MENU_TAG, LwMenuElement);
}
