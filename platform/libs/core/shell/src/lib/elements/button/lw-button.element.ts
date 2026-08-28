import { LwButtonSize, LwButtonVariant } from '@loomweaver/plugin-sdk';
import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import { lwButtonClasses } from './lw-button-classes';

/** The custom-element tag. */
export const LW_BUTTON_TAG = 'lw-button';

/**
 * `<lw-button variant="primary">Save</lw-button>` — the host button primitive as a framework-agnostic
 * custom element (like `<lw-tooltip>`/`<lw-select>`/`<lw-menu>`): light DOM (its content stays
 * in place), a `role="button"` element that emits the same **`.lw-btn` CSS-class contract**
 * (`theme.css`) the {@link LwButton} directive does — one source of truth for the look, on semantic tokens.
 *
 * The Angular {@link LwButton} directive stays the idiomatic choice for host chrome (it sits on a **native**
 * `<button>`/`<a>`, keeping native semantics). This element is the framework-agnostic path for a weaver body
 * or a sandboxed iframe that cannot import the directive across the Nx boundary. It adds keyboard activation
 * (Enter/Space) and `disabled` so a `role="button"` behaves like a button.
 *
 *   <lw-button variant="primary" (click)="save()">Speichern</lw-button>
 *   <lw-button variant="ghost" size="sm" icon-only aria-label="…"><!-- icon --></lw-button>
 */
export class LwButtonElement extends HTMLElement {
  static readonly observedAttributes = [
    'variant',
    'size',
    'icon-only',
    'disabled',
  ];

  get variant(): LwButtonVariant {
    return (
      (this.getAttribute('variant') as LwButtonVariant | null) ?? 'default'
    );
  }

  set variant(value: LwButtonVariant | null) {
    reflectAttribute(this, 'variant', value);
  }

  get size(): LwButtonSize {
    return (this.getAttribute('size') as LwButtonSize | null) ?? 'md';
  }

  set size(value: LwButtonSize | null) {
    reflectAttribute(this, 'size', value);
  }

  get iconOnly(): boolean {
    return this.hasAttribute('icon-only');
  }

  set iconOnly(value: boolean) {
    this.toggleAttribute('icon-only', value);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'variant');
    upgradeElementProperty(this, 'size');
    upgradeElementProperty(this, 'iconOnly');
    upgradeElementProperty(this, 'disabled');
    this.setAttribute('role', 'button');
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
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled) {
      event.preventDefault();
      this.click();
    }
  };

  private render(): void {
    const stale = [...this.classList].filter((cls) => cls.startsWith('lw-btn'));
    this.classList.remove(...stale);
    this.classList.add(
      ...lwButtonClasses(this.variant, this.size, this.iconOnly),
    );
    this.setAttribute('aria-disabled', String(this.disabled));
    this.tabIndex = this.disabled ? -1 : 0;
  }
}

/** Registers `<lw-button>` once (idempotent) — called from {@link provideShell} at bootstrap. */
export function defineLwButton(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get(LW_BUTTON_TAG)
  ) {
    customElements.define(LW_BUTTON_TAG, LwButtonElement);
  }
}
