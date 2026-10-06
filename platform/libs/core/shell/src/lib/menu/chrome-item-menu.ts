import { isDevMode } from '@angular/core';
import { MenuContext, MenuHeader, MenuTrigger } from '@loomweaver/plugin-sdk';

export interface ChromeItemMenu {
  readonly id?: string;
  readonly menu?: string;
  readonly menuTrigger?: MenuTrigger;
  readonly submenu?: string;
  readonly menuHeader?: MenuHeader;
  readonly command?: string;
  readonly workspace?: string;
  run?(context?: MenuContext): unknown;
}

const warned = new Set<string>();

export function menuOnActivate(item: ChromeItemMenu): string | undefined {
  if (item.submenu) {
    return item.submenu;
  }
  if (!item.menu || item.menuTrigger === undefined || item.menuTrigger === 'context') {
    return undefined;
  }
  return item.workspace === undefined ? item.menu : undefined;
}

export function menuOnContext(item: ChromeItemMenu): string | undefined {
  if (!item.menu) {
    return undefined;
  }
  return menuOnActivate(item) && item.menuTrigger === 'primary'
    ? undefined
    : item.menu;
}

export function warnMenuTriggerConflict(item: ChromeItemMenu): void {
  const id = item.id ?? '';
  if (!isDevMode() || warned.has(id)) {
    return;
  }
  if (item.workspace !== undefined && item.menuTrigger !== undefined && item.menuTrigger !== 'context') {
    warned.add(id);
    console.warn(
      `Item "${item.id}" switches to workspace "${item.workspace}" and asks for its menu on ` +
        `activation — activating it is the switch, so the menu "${item.menu}" stays on the ` +
        `right-click.`,
    );
  }
}

export interface ChromeItemState {
  readonly disabled: boolean;
  readonly opensMenu?: string;
}

export function activateChromeItem(
  item: ChromeItemMenu,
  state: ChromeItemState | undefined,
  run: () => void,
): void {
  if (state?.disabled) {
    return;
  }
  warnMenuTriggerConflict(item);
  if (state?.opensMenu) {
    return;
  }
  run();
}
