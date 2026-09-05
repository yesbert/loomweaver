import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import { LW_ICON_TAG } from '../icon/lw-icon.element';
import { foldedShut, rememberFold } from './nav-fold-state';
import { managedPart } from './nav-tree-parts';

/** The custom-element tag. */
export const LW_NAV_GROUP_TAG = 'lw-nav-group';

/**
 * `<lw-nav-group label="Customers" key="sales/customers">` — a named group of
 * {@link LwNavItemElement} children inside a {@link LwNavTreeElement}.
 *
 * A group you declare is always drawn as a group, including one holding a single item: the shape
 * follows what you wrote rather than a rule of thumb, so a sidebar does not change shape as its
 * contents change.
 *
 * It starts open unless `collapsed` says otherwise, and what the user folds is kept for as long as
 * the session lasts, under `key` — including the tree being taken off screen and drawn again. Give
 * `key` a value that outlives a language change and is unique across the trees a product draws;
 * without one the label is used, which is fine until the label is translated. Nothing is stored
 * beyond the session, so a reload starts from what you declared.
 */
export class LwNavGroupElement extends HTMLElement {
  static readonly observedAttributes = ['label', 'key', 'collapsed'];

  get label(): string {
    return this.getAttribute('label') ?? '';
  }

  set label(value: string | null) {
    reflectAttribute(this, 'label', value);
  }

  get key(): string {
    return this.getAttribute('key') ?? this.label;
  }

  set key(value: string | null) {
    reflectAttribute(this, 'key', value);
  }

  get collapsed(): boolean {
    return this.hasAttribute('collapsed');
  }

  set collapsed(value: boolean) {
    this.toggleAttribute('collapsed', value);
  }

  get open(): boolean {
    return !foldedShut(this.key, this.collapsed);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'label');
    upgradeElementProperty(this, 'key');
    upgradeElementProperty(this, 'collapsed');
    this.classList.add('lw-nav-group');
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  toggle(): void {
    rememberFold(this.key, this.open);
    this.render();
  }

  private render(): void {
    const heading = managedPart(this, 'heading', 'button');
    heading.className = 'lw-nav-group-heading';
    heading.setAttribute('type', 'button');
    heading.setAttribute('aria-expanded', String(this.open));
    if (heading.parentElement !== this) {
      heading.addEventListener('click', () => this.toggle());
      this.prepend(heading);
    }

    const chevron = managedPart(heading, 'chevron', LW_ICON_TAG);
    chevron.setAttribute('name', 'chevronDown');
    chevron.setAttribute('size', '0.875rem');
    chevron.className = 'lw-nav-chevron';
    if (chevron.parentElement !== heading) {
      heading.prepend(chevron);
    }

    const label = managedPart(heading, 'label', 'span');
    label.className = 'lw-nav-group-label';
    label.textContent = this.label;
    if (label.parentElement !== heading) {
      heading.append(label);
    }

    this.dataset['open'] = String(this.open);
  }
}
