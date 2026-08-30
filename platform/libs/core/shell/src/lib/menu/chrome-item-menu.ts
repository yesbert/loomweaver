import { isDevMode } from '@angular/core';
import { MenuTrigger } from '@loomweaver/plugin-sdk';

export interface ChromeItemMenu {
  readonly id: string;
  readonly menu?: string;
  readonly menuTrigger?: MenuTrigger;
  readonly command?: string;
  readonly workspace?: string;
  run?(): void;
}

const warned = new Set<string>();

export function menuOnActivate(item: ChromeItemMenu): string | undefined {
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
  if (!isDevMode() || warned.has(item.id)) {
    return;
  }
  if (item.workspace !== undefined && item.menuTrigger !== undefined && item.menuTrigger !== 'context') {
    warned.add(item.id);
    console.warn(
      `Item "${item.id}" switches to workspace "${item.workspace}" and asks for its menu on ` +
        `activation — activating it is the switch, so the menu "${item.menu}" stays on the ` +
        `right-click.`,
    );
    return;
  }
  if (menuOnActivate(item) && (item.command !== undefined || item.run !== undefined)) {
    warned.add(item.id);
    console.warn(
      `Item "${item.id}" opens the menu "${item.menu}" on activation, so its ` +
        `${item.command === undefined ? 'inline behaviour' : `command "${item.command}"`} is ` +
        `never run from here. Reach it from a menu entry, a shortcut or the palette instead.`,
    );
  }
}
