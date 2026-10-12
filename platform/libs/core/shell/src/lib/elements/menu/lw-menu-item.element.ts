import { reflectAttribute, upgradeElementProperty } from '../custom-elements';
import { markOpener, nestedMenu, submenuMark } from './lw-submenu';

export const LW_MENU_ITEM_TAG = 'lw-menu-item';

function leadingPlace(
  className: string,
  iconName: string | null,
): HTMLSpanElement {
  const place = document.createElement('span');
  place.className = className;
  place.setAttribute('aria-hidden', 'true');
  if (iconName) {
    const icon = document.createElement('lw-icon');
    icon.setAttribute('name', iconName);
    icon.setAttribute('size', '0.9rem');
    place.append(icon);
  }
  return place;
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

  private opens = false;

  private observer?: MutationObserver;

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
    this.observer = new MutationObserver(() => {
      const opens = nestedMenu(this) !== null;
      if (opens !== this.opens) {
        this.render();
      }
    });
    this.observer.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
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

    const check = leadingPlace('lw-menu-item-check', checked ? 'check' : null);
    const lead = leadingPlace('lw-menu-item-lead', this.getAttribute('icon'));

    const label = document.createElement('span');
    label.className = 'lw-menu-item-label';
    label.textContent = this.getAttribute('label') ?? '';

    const submenu = nestedMenu(this);
    this.opens = submenu !== null;
    const stale = [...this.childNodes].filter((child) => child !== submenu);
    for (const child of stale) {
      child.remove();
    }
    this.prepend(check, lead, label, ...this.trailing());
    markOpener(this, label, this.opens);
  }

  private trailing(): HTMLElement[] {
    if (this.opens) {
      return [submenuMark()];
    }
    const shortcut = this.getAttribute('shortcut');
    if (!shortcut) {
      return [];
    }
    const hint = document.createElement('span');
    hint.className = 'lw-menu-item-shortcut';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = shortcut;
    return [hint];
  }
}
