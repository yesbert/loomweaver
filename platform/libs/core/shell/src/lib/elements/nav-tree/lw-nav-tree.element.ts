import { addressIsUnder } from '../../regions/content/routing/address-reach';
import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import { LW_NAV_GROUP_TAG, LwNavGroupElement } from './lw-nav-group.element';
import { LW_NAV_ITEM_TAG, LwNavItemElement } from './lw-nav-item.element';
import { longestMatch, pathOf } from './nav-tree-parts';

/** The custom-element tag. */
export const LW_NAV_TREE_TAG = 'lw-nav-tree';

/** The event a tree fires when the user chooses a destination. Its detail carries `{ path }`. */
export const LW_NAV_SELECT = 'lw-nav-select';

/**
 * `<lw-nav-tree current="sales/quotes/q-0006">` — the workbench's sidebar navigation, declared as
 * markup: {@link LwNavGroupElement} and {@link LwNavItemElement} children, in the order you want
 * them drawn.
 *
 *     <lw-nav-tree current="sales/quotes/q-0006">
 *       <lw-nav-group label="Customers" key="sales/customers">
 *         <lw-nav-item path="sales/customers" label="Customer list" icon="customerList"></lw-nav-item>
 *       </lw-nav-group>
 *       <lw-nav-item path="sales/quotes" label="Quotes" icon="quotes"></lw-nav-item>
 *     </lw-nav-tree>
 *
 * Tell it the address being shown through `current`, and it marks the item that address lies at or
 * under, applying the segment rule the workbench applies when a plugin asks the same question: an
 * address is under `sales/quotes` when it is that address or continues past a `/`, so
 * `sales/quotesomething` is not. Where several items match, the longest one is marked, and never
 * more than one.
 *
 * It navigates nothing. Choosing a destination fires {@link LW_NAV_SELECT} carrying the item's
 * `path`, and what that means is yours to decide.
 */
export class LwNavTreeElement extends HTMLElement {
  static readonly observedAttributes = ['current'];

  private observer?: MutationObserver;

  get current(): string | null {
    return this.getAttribute('current');
  }

  set current(value: string | null) {
    reflectAttribute(this, 'current', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'current');
    this.setAttribute('role', 'navigation');
    this.classList.add('lw-nav-tree');
    this.addEventListener('click', this.onClick);
    this.observer = new MutationObserver(() => this.mark());
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributeFilter: ['path'],
    });
    this.mark();
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.onClick);
    this.observer?.disconnect();
    this.observer = undefined;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.mark();
    }
  }

  private readonly onClick = (event: Event) => {
    const item = (event.target as HTMLElement | null)?.closest<LwNavItemElement>(
      LW_NAV_ITEM_TAG,
    );
    if (!item || !this.owns(item)) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent(LW_NAV_SELECT, {
        detail: { path: pathOf(item) },
        bubbles: true,
      }),
    );
  };

  private mark(): void {
    const items = this.items();
    const shown = this.current ?? undefined;
    const marked = longestMatch(
      items.map((item) => pathOf(item)),
      (path) => addressIsUnder(shown, path),
    );

    for (const item of items) {
      if (marked !== null && pathOf(item) === marked) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    }
  }

  private items(): LwNavItemElement[] {
    return [...this.querySelectorAll<LwNavItemElement>(LW_NAV_ITEM_TAG)].filter(
      (item) => this.owns(item),
    );
  }

  private owns(item: LwNavItemElement): boolean {
    return item.closest(LW_NAV_TREE_TAG) === this;
  }
}

/** Registers `<lw-nav-tree>`, `<lw-nav-group>` and `<lw-nav-item>` once (idempotent). */
export function defineLwNavTree(): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(LW_NAV_ITEM_TAG)) {
    customElements.define(LW_NAV_ITEM_TAG, LwNavItemElement);
  }
  if (!customElements.get(LW_NAV_GROUP_TAG)) {
    customElements.define(LW_NAV_GROUP_TAG, LwNavGroupElement);
  }
  if (!customElements.get(LW_NAV_TREE_TAG)) {
    customElements.define(LW_NAV_TREE_TAG, LwNavTreeElement);
  }
}
