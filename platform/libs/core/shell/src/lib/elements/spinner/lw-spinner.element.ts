import {
  defineElementOnce,
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-elements';

/** The custom-element tag. */
export const LW_SPINNER_TAG = 'lw-spinner';

const DEFAULT_SIZE = '1.5rem';

/**
 * `<lw-spinner size="1rem" label="…">` — the busy indicator as a framework-agnostic custom element:
 * a plain `HTMLElement`, **light DOM**, drawing one `.lw-spinner-ring` in the brand colour. Usable in
 * a plugin's markup by tag, without importing `@loomweaver/shell`, and in an isolated surface.
 *
 * `size` is a CSS length (width = height, default `1.5rem`); a bare number is invalid and the
 * browser discards it. `label` is the accessible name announced with `role="status"` — pass a
 * translated string, or leave it out where the surrounding text already says what is running.
 * Both are attributes and properties alike. For a known amount of progress use
 * `<lw-progress-ring>` instead.
 */
export class LwSpinnerElement extends HTMLElement {
  static readonly observedAttributes = ['size', 'label'];

  private ring?: HTMLElement;

  get size(): string {
    return this.getAttribute('size') ?? DEFAULT_SIZE;
  }
  set size(value: string | null) {
    reflectAttribute(this, 'size', value);
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }
  set label(value: string | null) {
    reflectAttribute(this, 'label', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'size');
    upgradeElementProperty(this, 'label');
    if (!this.ring) {
      this.ring = document.createElement('span');
      this.ring.className = 'lw-spinner-ring';
      this.ring.setAttribute('role', 'status');
      this.append(this.ring);
    }
    this.render(this.ring);
  }

  attributeChangedCallback(): void {
    if (this.ring) {
      this.render(this.ring);
    }
  }

  private render(ring: HTMLElement): void {
    ring.style.width = this.size;
    ring.style.height = this.size;
    reflectAttribute(ring, 'aria-label', this.label || null);
  }
}

/** Registers `<lw-spinner>` once (idempotent), called from {@link provideShell} at bootstrap. */
export function defineLwSpinner(): void {
  defineElementOnce(LW_SPINNER_TAG, LwSpinnerElement);
}
