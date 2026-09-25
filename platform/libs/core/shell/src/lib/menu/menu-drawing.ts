import { Command, MenuHeader } from '@loomweaver/plugin-sdk';
import {
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
  LwMenuElement,
} from '../elements/menu/lw-menu.element';
import { drawMenuHeading, wordMenuHeading } from './menu-heading';
import { MenuLabel, wordEntries } from './menu-wording';

export interface MenuRow {
  readonly key: string;
  readonly label: MenuLabel;
  readonly group: string;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly checkbox: boolean;
  readonly checked: boolean;
}

export interface MenuHeading {
  readonly header: MenuHeader;
  readonly leadsTo?: Command;
}

export interface WordedMenu {
  readonly menu: LwMenuElement;
  readonly word: () => void;
}

export function drawMenu(
  rows: readonly MenuRow[],
  translate: (key: string) => string,
  heading?: MenuHeading,
): WordedMenu {
  const menu = document.createElement(LW_MENU_TAG) as LwMenuElement;
  reserveLeadingColumns(menu, rows);
  const wordHeading = heading
    ? appendHeading(menu, heading, translate)
    : () => undefined;
  const labelled = appendRows(menu, rows);
  const word = (): void => {
    wordEntries(labelled, translate);
    wordHeading();
  };
  word();
  return { menu, word };
}

function reserveLeadingColumns(
  menu: HTMLElement,
  rows: readonly MenuRow[],
): void {
  if (rows.some((row) => row.checkbox)) {
    menu.classList.add('lw-menu--checks');
  }
  if (rows.some((row) => row.icon)) {
    menu.classList.add('lw-menu--leading');
  }
}

function appendHeading(
  menu: HTMLElement,
  { header, leadsTo }: MenuHeading,
  translate: (key: string) => string,
): () => void {
  const element = drawMenuHeading(header, leadsTo);
  menu.append(element);
  return () =>
    menu.setAttribute(
      'aria-label',
      wordMenuHeading(element, header, translate, leadsTo),
    );
}

function appendRows(
  menu: HTMLElement,
  rows: readonly MenuRow[],
): [HTMLElement, MenuLabel][] {
  const labelled: [HTMLElement, MenuLabel][] = [];
  let lastGroup: string | undefined;
  for (const row of rows) {
    if (lastGroup !== undefined && row.group !== lastGroup) {
      menu.append(separator());
    }
    lastGroup = row.group;
    const item = menuItemElement(row);
    labelled.push([item, row.label]);
    menu.append(item);
  }
  return labelled;
}

function menuItemElement(row: MenuRow): HTMLElement {
  const item = document.createElement(LW_MENU_ITEM_TAG);
  item.setAttribute('command', row.key);
  if (row.icon) {
    item.setAttribute('icon', row.icon);
  }
  if (row.shortcut) {
    item.setAttribute('shortcut', row.shortcut);
  }
  if (row.checkbox) {
    item.setAttribute('checkbox', '');
    if (row.checked) {
      item.setAttribute('checked', '');
    }
  }
  return item;
}

function separator(): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('role', 'separator');
  element.className = 'lw-menu-separator';
  return element;
}
