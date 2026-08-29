import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

export const LW_MENU_TAG = 'lw-menu';
export const LW_MENU_ITEM_TAG = 'lw-menu-item';

const VIEWPORT_MARGIN = 4;

export const LW_MENU_SELECT = 'lw-menu-select';

export const LW_MENU_DISMISS = 'lw-menu-dismiss';

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
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    this.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft))}px`;
    this.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop))}px`;
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
    items.forEach((item, i) => (item.tabIndex = i === this.active ? 0 : -1));
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
      case 'ArrowDown':
        this.setActive(this.active < 0 ? 0 : this.active + 1);
        break;
      case 'ArrowUp':
        this.setActive((this.active < 0 ? this.items().length : this.active) - 1);
        break;
      case 'Home':
        this.setActive(0);
        break;
      case 'End':
        this.setActive(this.items().length - 1);
        break;
      case 'Enter':
      case ' ': {
        const item = this.active >= 0 ? this.items()[this.active] : undefined;
        if (item) {
          this.select(item);
        }
        break;
      }
      case 'Escape':
      case 'Tab':
        this.dispatchEvent(new CustomEvent(LW_MENU_DISMISS, { bubbles: true }));
        return;
      default:
        return;
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
