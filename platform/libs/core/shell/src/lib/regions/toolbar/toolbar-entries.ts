import { MenuContext, MenuItem, ViewAction } from '@loomweaver/plugin-sdk';
import { SlotEntry } from '../../menu/menu-resolution';

export interface ToolbarEntry extends SlotEntry {
  readonly id: string;
  readonly source: MenuItem | ViewAction;
}

export function entryOfAction(action: ViewAction): ToolbarEntry {
  return {
    id: action.id,
    title: action.title,
    icon: action.icon,
    pressed: action.pressed,
    access: action.access,
    order: action.order,
    command: action.command,
    run: action.run === undefined ? undefined : () => action.run?.(),
    menu: action.menu,
    menuTrigger: action.menuTrigger,
    menuHeader: action.menuHeader,
    source: action,
  };
}

export function entryOfMenuItem(item: MenuItem, index: number): ToolbarEntry {
  return {
    id: item.id ?? `${item.menu}#${item.command ?? index}`,
    title: item.title,
    icon: item.icon,
    access: item.access,
    group: item.group,
    order: item.order,
    when: item.when,
    checkedWhen: item.checkedWhen,
    command: item.command,
    run:
      item.run === undefined
        ? undefined
        : (context?: MenuContext) => item.run?.(context),
    submenu: item.submenu,
    menuHeader: item.menuHeader,
    source: item,
  };
}
