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

describe('what the frame kit says of its elements', () => {
  it('names every tag the kit defines, and no other', () => {
    expectTypeOf<keyof LwElementTagNameMap>().toEqualTypeOf<keyof Drawn>();
  });

  it('says of each element only what the element drawn in the page has', () => {
    expectTypeOf<Undescribed>().toEqualTypeOf<never>();
  });

  it('takes on a toolbar the description a slot is matched against, named values alone', () => {
    expectTypeOf<LwElementTagNameMap['lw-toolbar']['context']>().toEqualTypeOf<LwToolbarElement['context']>();
  });
});
