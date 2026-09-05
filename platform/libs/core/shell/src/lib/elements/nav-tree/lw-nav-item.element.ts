import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import {
  dropManagedPart,
  managedPart,
  managedPartIn,
  setGlyph,
} from './nav-tree-parts';

/** The custom-element tag. */
export const LW_NAV_ITEM_TAG = 'lw-nav-item';

/**
 * `<lw-nav-item path="sales/quotes" label="Quotes" icon="quotes">7</lw-nav-item>` — one destination
 * in a {@link LwNavTreeElement}, on its own or inside a {@link LwNavGroupElement}.
 *
 * The element **is** the row, so anything you put inside it stays on screen after the label: a
 * count, a dot, an amount. The workbench draws the glyph and the label and leaves your content
 * where you wrote it.
 *
 * `label` is displayed as given. The element translates nothing, so a consumer that changes
 * language supplies the changed text. `path` is the address the item stands for; the tree marks the
 * item the address it was told about lies at or under, so an item never decides that for itself.
 */
export class LwNavItemElement extends HTMLElement {
  static readonly observedAttributes = ['path', 'label', 'icon'];

  get path(): string {
    return this.getAttribute('path') ?? '';
  }

  set path(value: string | null) {
    reflectAttribute(this, 'path', value);
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }

  set label(value: string | null) {
    reflectAttribute(this, 'label', value);
  }

  get icon(): string | null {
    return this.getAttribute('icon');
  }

  set icon(value: string | null) {
    reflectAttribute(this, 'icon', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'path');
    upgradeElementProperty(this, 'label');
    upgradeElementProperty(this, 'icon');
    this.setAttribute('role', 'button');
    this.classList.add('lw-nav-item');
    this.tabIndex = 0;
    this.addEventListener('keydown', this.onKeydown);
    this.render();
  }

  disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeydown);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private readonly onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.click();
  };

  private render(): void {
    const icon = this.icon;
    if (icon) {
      setGlyph(this, 'glyph', icon);
    } else {
      dropManagedPart(this, 'glyph');
    }

    const label = managedPart(this, 'label', 'span');
    label.className = 'lw-nav-item-label';
    label.textContent = this.label;
    if (label.parentElement !== this) {
      this.insertBefore(label, this.glyphEnd());
    }
  }

  private glyphEnd(): ChildNode | null {
    const glyph = managedPartIn(this, 'glyph');
    return glyph ? glyph.nextSibling : this.firstChild;
  }
}
