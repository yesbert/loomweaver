import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

export const LW_MENU_TAG = 'lw-menu';
export const LW_MENU_ITEM_TAG = 'lw-menu-item';

const VIEWPORT_MARGIN = 4;

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

function fits(start: number, size: number, limit: number): boolean {
  return start >= VIEWPORT_MARGIN && start + size <= limit - VIEWPORT_MARGIN;
}

function clamp(start: number, size: number, limit: number): number {
  return Math.max(
    VIEWPORT_MARGIN,
    Math.min(start, limit - size - VIEWPORT_MARGIN),
  );
}

function beside(
  preferred: number,
  opposite: number,
  size: number,
  limit: number,
): number {
  if (fits(preferred, size, limit)) {
    return preferred;
  }
  return fits(opposite, size, limit) ? opposite : clamp(preferred, size, limit);
}

function aligned(
  near: number,
  far: number,
  size: number,
  limit: number,
): number {
  return fits(near, size, limit) ? near : clamp(far - size, size, limit);
}

export class LwMenuItemElement extends HTMLElement {
  static readonly observedAttributes = [
    'label',
    'command',
    'disabled',
    'icon',
    'shortcut',
    'checkbox',
    'checked',
  ];

  get label(): string | null {
    return this.getAttribute('label');
  }
  set label(value: string | null) {
    reflectAttribute(this, 'label', value);
  }
  get command(): string | null {
    return this.getAttribute('command');
  }
  set command(value: string | null) {
    reflectAttribute(this, 'command', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'label');
    upgradeElementProperty(this, 'command');
    this.tabIndex = -1;
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    const checkbox = this.hasAttribute('checkbox');
    const checked = this.hasAttribute('checked');
    this.setAttribute('role', checkbox ? 'menuitemcheckbox' : 'menuitem');
    if (checkbox) {
      this.setAttribute('aria-checked', String(checked));
    } else {
      this.removeAttribute('aria-checked');
    }
    this.setAttribute('aria-disabled', String(this.hasAttribute('disabled')));

    const lead = document.createElement('span');
    lead.className = 'lw-menu-item-lead';
    lead.setAttribute('aria-hidden', 'true');
    let iconName: string | null;
    if (checkbox) {
      iconName = checked ? 'check' : null;
    } else {
      iconName = this.getAttribute('icon');
    }
    if (iconName) {
      const icon = document.createElement('lw-icon');
      icon.setAttribute('name', iconName);
      icon.setAttribute('size', '0.9rem');
      lead.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'lw-menu-item-label';
    label.textContent = this.getAttribute('label') ?? '';
    this.replaceChildren(lead, label);

    const shortcut = this.getAttribute('shortcut');
    if (shortcut) {
      const hint = document.createElement('span');
      hint.className = 'lw-menu-item-shortcut';
      hint.setAttribute('aria-hidden', 'true');
      hint.textContent = shortcut;
      this.append(hint);
    }
  }
}

export class LwMenuElement extends HTMLElement {
  private active = -1;

  connectedCallback(): void {
    this.setAttribute('role', 'menu');
    this.tabIndex = -1;
    this.addEventListener('keydown', this.onKeydown);
    this.addEventListener('click', this.onClick);

    queueMicrotask(() => {
      if (this.isConnected) {
        this.focus();
      }
    });
  }

  disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeydown);
    this.removeEventListener('click', this.onClick);
  }

  openAt(x: number, y: number): void {
    const { width, height } = this.getBoundingClientRect();
    this.place(
      clamp(x, width, window.innerWidth),
      clamp(y, height, window.innerHeight),
    );
  }

  openBeside(rect: MenuAnchorRect, side: MenuSide): void {
    const { width, height } = this.getBoundingClientRect();
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
    const item = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      `[role^="menuitem"]`,
    );
    if (item && !this.isDisabled(item)) {
      this.select(item);
    }
  };

  private place(left: number, top: number): void {
    this.style.left = `${left}px`;
    this.style.top = `${top}px`;
  }

  private items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter(
      (item) => !this.isDisabled(item),
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
    for (const [index_, item] of items.entries()) {
      item.tabIndex = index_ === this.active ? 0 : -1;
    }
    const item = items[this.active];
    item.focus();
    item.scrollIntoView?.({ block: 'nearest' });
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
    switch (event.key) {
      case 'ArrowDown': {
        this.setActive(this.active < 0 ? 0 : this.active + 1);
        break;
      }
      case 'ArrowUp': {
        this.setActive((this.active < 0 ? this.items().length : this.active) - 1);
        break;
      }
      case 'Home': {
        this.setActive(0);
        break;
      }
      case 'End': {
        this.setActive(this.items().length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        const item = this.active >= 0 ? this.items()[this.active] : undefined;
        if (item) {
          this.select(item);
        }
        break;
      }
      case 'Escape':
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

export function defineLwMenu(): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(LW_MENU_ITEM_TAG)) {
    customElements.define(LW_MENU_ITEM_TAG, LwMenuItemElement);
  }
  if (!customElements.get(LW_MENU_TAG)) {
    customElements.define(LW_MENU_TAG, LwMenuElement);
  }
}
