import { expectTypeOf } from 'vitest';
import { LW_BUTTON_TAG, LwButtonElement } from '../elements/button/lw-button.element';
import { LW_ICON_TAG, LwIconElement } from '../elements/icon/lw-icon.element';
import { LW_MARKDOWN_TAG, LwMarkdownElement } from '../elements/markdown/lw-markdown.element';
import { LW_MENU_ITEM_TAG, LwMenuItemElement } from '../elements/menu/lw-menu-item.element';
import { LW_MENU_TAG, LwMenuElement } from '../elements/menu/lw-menu.element';
import { LW_NAV_GROUP_TAG, LwNavGroupElement } from '../elements/nav-tree/lw-nav-group.element';
import { LW_NAV_ITEM_TAG, LwNavItemElement } from '../elements/nav-tree/lw-nav-item.element';
import { LW_NAV_TREE_TAG, LwNavTreeElement } from '../elements/nav-tree/lw-nav-tree.element';
import { LW_PROGRESS_RING_TAG, LwProgressRingElement } from '../elements/progress/lw-progress-ring.element';
import { LW_OPTION_TAG, LwOptionElement } from '../elements/select/lw-option.element';
import { LW_SELECT_TAG, LwSelectElement } from '../elements/select/lw-select.element';
import { LW_SPINNER_TAG, LwSpinnerElement } from '../elements/spinner/lw-spinner.element';
import { LW_TOOLBAR_TAG, LwToolbarElement } from '../elements/toolbar/lw-toolbar.element';
import { LW_TOOLTIP_TAG, LwTooltipElement } from '../elements/tooltip/lw-tooltip.element';
import { defineLwElements } from '../elements/lw-elements';
import type { LwElementTagNameMap } from './surface-kit-elements';

interface Drawn {
  [LW_BUTTON_TAG]: LwButtonElement;
  [LW_ICON_TAG]: LwIconElement;
  [LW_MARKDOWN_TAG]: LwMarkdownElement;
  [LW_MENU_TAG]: LwMenuElement;
  [LW_MENU_ITEM_TAG]: LwMenuItemElement;
  [LW_NAV_GROUP_TAG]: LwNavGroupElement;
  [LW_NAV_ITEM_TAG]: LwNavItemElement;
  [LW_NAV_TREE_TAG]: LwNavTreeElement;
  [LW_OPTION_TAG]: LwOptionElement;
  [LW_PROGRESS_RING_TAG]: LwProgressRingElement;
  [LW_SELECT_TAG]: LwSelectElement;
  [LW_SPINNER_TAG]: LwSpinnerElement;
  [LW_TOOLBAR_TAG]: LwToolbarElement;
  [LW_TOOLTIP_TAG]: LwTooltipElement;
}

type Undescribed = {
  [Tag in keyof Drawn]: [Drawn[Tag]] extends [LwElementTagNameMap[Tag]] ? never : Tag;
}[keyof Drawn];

type Lifecycle = 'connectedCallback' | 'disconnectedCallback' | 'attributeChangedCallback';

function told<Tag extends keyof LwElementTagNameMap>(tag: Tag): LwElementTagNameMap[Tag] {
  return document.createElement(tag) as LwElementTagNameMap[Tag];
}

describe('what the frame kit says of its elements', () => {
  beforeAll(() => defineLwElements());

  it('names every tag the kit defines, and no other', () => {
    expectTypeOf<keyof LwElementTagNameMap>().toEqualTypeOf<keyof Drawn>();
  });

  it('says of each element only what the element drawn in the page has', () => {
    expectTypeOf<Undescribed>().toEqualTypeOf<never>();
  });

  it('takes on a toolbar the description a slot is matched against, named values alone', () => {
    expectTypeOf<LwElementTagNameMap['lw-toolbar']['context']>().toEqualTypeOf<LwToolbarElement['context']>();
  });

  it('says of the progress ring that it takes attributes alone, as the element drawn in the page does', () => {
    expectTypeOf<Exclude<keyof LwProgressRingElement, keyof HTMLElement | Lifecycle>>().toEqualTypeOf<never>();
  });

  it('lets a surface assign what each element takes, and clear it with null as the element does', () => {
    const button = told('lw-button');
    button.variant = 'danger';
    button.size = 'sm';
    button.iconOnly = true;
    button.disabled = true;
    expect(button.getAttributeNames()).toEqual(['variant', 'size', 'icon-only', 'disabled']);
    button.variant = null;
    button.size = null;
    button.iconOnly = false;
    button.disabled = false;
    expect(button.getAttributeNames()).toEqual([]);
    expect([button.variant, button.size]).toEqual(['default', 'md']);

    const icon = told('lw-icon');
    icon.name = 'add';
    icon.size = '1rem';
    icon.name = null;
    icon.size = null;
    expect(icon.getAttributeNames()).toEqual([]);

    const markdown = told('lw-markdown');
    markdown.source = '**bold**';
    markdown.source = null;
    expect(markdown.getAttributeNames()).toEqual([]);

    const item = told('lw-menu-item');
    item.label = 'Import';
    item.command = 'import';
    item.label = null;
    item.command = null;
    expect(item.getAttributeNames()).toEqual([]);

    const group = told('lw-nav-group');
    group.label = 'Customers';
    group.key = 'sales/customers';
    group.collapsed = true;
    group.label = null;
    group.key = null;
    group.collapsed = false;
    expect(group.getAttributeNames()).toEqual([]);

    const destination = told('lw-nav-item');
    destination.path = 'sales/quotes';
    destination.label = 'Quotes';
    destination.icon = 'quotes';
    destination.path = null;
    destination.label = null;
    destination.icon = null;
    expect(destination.getAttributeNames()).toEqual([]);

    const tree = told('lw-nav-tree');
    tree.current = 'sales/quotes';
    tree.current = null;
    expect(tree.getAttributeNames()).toEqual([]);

    const option = told('lw-option');
    option.value = 'a';
    option.icon = 'add';
    option.value = null;
    option.icon = null;
    expect(option.getAttributeNames()).toEqual([]);

    const select = told('lw-select');
    select.value = 'a';
    select.compact = true;
    select.required = true;
    select.value = null;
    select.compact = false;
    select.required = false;
    expect(select.getAttributeNames()).toEqual([]);

    const spinner = told('lw-spinner');
    spinner.size = '1rem';
    spinner.label = 'Loading';
    spinner.size = null;
    spinner.label = null;
    expect(spinner.getAttributeNames()).toEqual([]);

    const tooltip = told('lw-tooltip');
    tooltip.text = 'Add';
    tooltip.position = 'bottom';
    tooltip.text = null;
    tooltip.position = null;
    expect(tooltip.getAttributeNames()).toEqual([]);
    expect(tooltip.position).toBe('top');

    const toolbar = told('lw-toolbar');
    toolbar.menu = 'acme/toolbar';
    toolbar.label = 'Tools';
    toolbar.size = 'sm';
    toolbar.context = { record: 'r1', pinned: true, row: 3 };
    expect(toolbar.context).toEqual({ record: 'r1', pinned: true, row: 3 });
    toolbar.menu = null;
    toolbar.label = null;
    toolbar.size = null;
    toolbar.context = undefined;
    expect(toolbar.getAttributeNames()).toEqual([]);
    expect([toolbar.size, toolbar.context]).toEqual(['md', {}]);
  });
});
