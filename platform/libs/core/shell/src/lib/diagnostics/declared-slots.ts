import { TAB_CONTEXT_MENU } from '../regions/content/tabs/tab-context-menu';
import { VIEW_CONTEXT_MENU } from '../regions/pane/chrome/strip-tab';
import { PANEL_STRIP_CONTEXT_MENU } from '../regions/panel/view-context-menu';
import {
  RAIL_CONTEXT_MENU,
  RAIL_ITEM_CONTEXT_MENU,
} from '../regions/rail/rail-context-menu';

export const WORKBENCH_MENU_SLOTS: readonly string[] = [
  TAB_CONTEXT_MENU,
  VIEW_CONTEXT_MENU,
  PANEL_STRIP_CONTEXT_MENU,
  RAIL_CONTEXT_MENU,
  RAIL_ITEM_CONTEXT_MENU,
];

export interface SlotDeclarer {
  readonly menu?: string;
}

export function declaredSlots(
  controls: readonly SlotDeclarer[],
): ReadonlySet<string> {
  const slots = new Set(WORKBENCH_MENU_SLOTS);
  for (const control of controls) {
    if (control.menu) {
      slots.add(control.menu);
    }
  }
  return slots;
}
