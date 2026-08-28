import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import { resolveIcon } from './icon-registry-global';

/** The custom-element tag. */
export const LW_ICON_TAG = 'lw-icon';

const DEFAULT_SIZE = '1.25rem';

/**
 * `<lw-icon name="add" size="1rem">` — the host icon primitive as a framework-agnostic custom element
 *: a plain `HTMLElement` that resolves a **name** to its SVG via the module-global icon
 * registry — no Angular DI, no `@ng-icons` runtime — so it works in a weaver body by tag, not
 * only in shell chrome. Light DOM: the SVG uses `currentColor`, so `text-*` tokens tint it for free.
 *
 * The SVG is already safe (first-party markup, or sanitized at registration), so it is set as raw
 * `innerHTML`. Decorative by default (`aria-hidden`); pass `aria-label` to expose it as an image.
 *
 *   <lw-icon name="close" size="0.85rem"></lw-icon>
 *   <lw-icon [name]="dynamicName()" aria-label="…"></lw-icon>
 */
export class LwIconElement extends HTMLElement {
  static readonly observedAttributes = ['name', 'size', 'aria-label'];

  get name(): string {
    return this.getAttribute('name') ?? '';
  }
  set name(value: string | null) {
    reflectAttribute(this, 'name', value);
  }
  get size(): string {
    return this.getAttribute('size') ?? DEFAULT_SIZE;
  }
  set size(value: string | null) {
    reflectAttribute(this, 'size', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'name');
    upgradeElementProperty(this, 'size');
    this.render();
  }

  attributeChangedCallback(): void {
    this.refresh();
  }

  /**
   * Re-draws from the registry without changing the name. A sandboxed surface receives the product's
   * replacement icons over its channel, which can arrive after it has already painted.
   */
  refresh(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    this.innerHTML = resolveIcon(this.name) ?? '';
    const svg = this.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', this.size);
      svg.setAttribute('height', this.size);
    }
    const label = this.getAttribute('aria-label');
    if (label) {
      this.setAttribute('role', 'img');
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
    }
  }
}

/** Registers `<lw-icon>` once (idempotent) — called from {@link provideShell} at bootstrap. */
export function defineLwIcon(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get(LW_ICON_TAG)
  ) {
    customElements.define(LW_ICON_TAG, LwIconElement);
  }
}
