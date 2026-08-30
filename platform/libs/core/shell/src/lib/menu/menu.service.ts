import { inject, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MenuContext, MenuItem } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { CommandService } from '../commands/command.service';
import {
  LW_MENU_DISMISS,
  LW_MENU_ITEM_TAG,
  LW_MENU_SELECT,
  LW_MENU_TAG,
  LwMenuElement,
  MenuAnchorRect,
  MenuSide,
} from '../elements/menu/lw-menu.element';

export { MENU_ANCHOR_GAP } from '../elements/menu/lw-menu.element';

export type MenuAnchor =
  | { readonly x: number; readonly y: number }
  | { readonly rect: MenuAnchorRect; readonly side: MenuSide };

interface ResolvedItem {
  readonly key: string;
  readonly label: string;
  readonly group: string;
  readonly order: number;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly checkbox: boolean;
  readonly checked: boolean;
  readonly item: MenuItem;
}

interface OpenMenu {
  readonly menu: HTMLElement;
  readonly onOutside: (event: PointerEvent) => void;
  readonly restore: HTMLElement | null;
  readonly listenTimer: ReturnType<typeof setTimeout>;
}

export interface MenuListEntry {
  readonly key: string;
  readonly label: string;
  readonly icon?: string;
  readonly active?: boolean;
  readonly checked?: boolean;
}

@Service()
export class MenuService {
  private readonly registry = inject(ContributionRegistry);

  private readonly commands = inject(CommandService);

  private readonly transloco = inject(TranslocoService);

  private readonly trigger = signal<HTMLElement | null>(null);

  private current?: OpenMenu;

  readonly openTrigger = this.trigger.asReadonly();

  open(
    menuId: string | readonly string[],
    context: MenuContext,
    at: MenuAnchor,
    trigger?: HTMLElement,
  ): void {
    this.close();
    const resolved = this.resolve(
      typeof menuId === 'string' ? [menuId] : menuId,
      context,
    );
    if (resolved.length === 0) {
      return;
    }
    const menu = this.createMenu(resolved);
    const byKey = new Map(resolved.map((entry) => [entry.key, entry.item]));
    this.present(
      menu,
      at,
      (key) => {
        const item = key === null ? undefined : byKey.get(key);
        if (item) {
          this.run(item, context);
        }
      },
      trigger,
    );
  }

  openList(
    entries: readonly MenuListEntry[],
    at: MenuAnchor,
    onPick: (key: string) => void,
    trigger?: HTMLElement,
  ): void {
    this.close();
    if (entries.length === 0) {
      return;
    }
    const menu = this.createListMenu(entries);
    this.present(
      menu,
      at,
      (key) => {
        if (key !== null) {
          onPick(key);
        }
      },
      trigger,
    );
  }

  close(): void {
    const open = this.current;
    if (!open) {
      return;
    }
    this.current = undefined;
    this.trigger.set(null);
    clearTimeout(open.listenTimer);
    document.removeEventListener('pointerdown', open.onOutside, true);
    document.body.classList.remove('lw-menu-open');
    open.menu.remove();
    open.restore?.focus?.();
  }

  private present(
    menu: LwMenuElement,
    at: MenuAnchor,
    onSelect: (key: string | null) => void,
    trigger?: HTMLElement,
  ): void {
    const restore = document.activeElement as HTMLElement | null;
    menu.addEventListener(LW_MENU_SELECT, (event) => {
      const key = (event as CustomEvent<{ command: string | null }>).detail
        .command;
      this.close();
      onSelect(key);
    });
    menu.addEventListener(LW_MENU_DISMISS, () => this.close());
    const onOutside = (event: PointerEvent) => {
      if (!menu.contains(event.target as Node)) {
        this.close();
      }
    };
    document.body.append(menu);
    document.body.classList.add('lw-menu-open');
    if ('rect' in at) {
      menu.openBeside(at.rect, at.side);
    } else {
      menu.openAt(at.x, at.y);
    }
    this.trigger.set(trigger ?? null);
    const listenTimer = setTimeout(() =>
      document.addEventListener('pointerdown', onOutside, {capture: true}), 0,
    );
    this.current = { menu, onOutside, restore, listenTimer };
  }

  private resolve(
    menuIds: readonly string[],
    context: MenuContext,
  ): ResolvedItem[] {
    const commands = this.registry.commands();
    return this.registry
      .menuItems()
      .filter(
        (item) =>
          menuIds.includes(item.menu) && whenMatches(item.when, context),
      )
      .map((item, index): ResolvedItem | null => {
        const command = item.command
          ? commands.find((c) => c.id === item.command)
          : undefined;
        if (item.command && !command) {
          return null;
        }
        const titleKey = item.title ?? command?.title;
        if (titleKey === undefined) {
          return null;
        }
        const checkbox = item.checkedWhen !== undefined;
        return {
          key: item.command ?? `__inline-${index}`,
          label: this.transloco.translate(titleKey),
          group: item.group ?? '',
          order: item.order ?? 0,
          icon: command?.icon,
          shortcut: this.commands.shortcutOf(command),
          checkbox,
          checked: checkbox && whenMatches(item.checkedWhen, context),
          item,
        };
      })
      .filter((entry): entry is ResolvedItem => entry !== null)
      .toSorted((a, b) => a.group.localeCompare(b.group) || a.order - b.order);
  }

  private createMenu(resolved: readonly ResolvedItem[]): LwMenuElement {
    const menu = document.createElement(LW_MENU_TAG) as LwMenuElement;
    if (resolved.some((entry) => entry.icon || entry.checkbox)) {
      menu.classList.add('lw-menu--leading');
    }
    let lastGroup: string | undefined;
    for (const entry of resolved) {
      if (lastGroup !== undefined && entry.group !== lastGroup) {
        const separator = document.createElement('div');
        separator.setAttribute('role', 'separator');
        separator.className = 'lw-menu-separator';
        menu.append(separator);
      }
      lastGroup = entry.group;
      const item = document.createElement(LW_MENU_ITEM_TAG);
      item.setAttribute('command', entry.key);
      item.setAttribute('label', entry.label);
      if (entry.icon) {
        item.setAttribute('icon', entry.icon);
      }
      if (entry.shortcut) {
        item.setAttribute('shortcut', entry.shortcut);
      }
      if (entry.checkbox) {
        item.setAttribute('checkbox', '');
        if (entry.checked) {
          item.setAttribute('checked', '');
        }
      }
      menu.append(item);
    }
    return menu;
  }

  private createListMenu(entries: readonly MenuListEntry[]): LwMenuElement {
    const menu = document.createElement(LW_MENU_TAG) as LwMenuElement;
    if (
      entries.some(
        (entry) => entry.icon || entry.active || entry.checked !== undefined,
      )
    ) {
      menu.classList.add('lw-menu--leading');
    }
    for (const entry of entries) {
      const item = document.createElement(LW_MENU_ITEM_TAG);
      item.setAttribute('command', entry.key);
      item.setAttribute('label', entry.label);
      if (entry.checked !== undefined) {
        item.setAttribute('checkbox', '');
        if (entry.checked) {
          item.setAttribute('checked', '');
        }
      } else if (entry.active) {
        item.setAttribute('checkbox', '');
        item.setAttribute('checked', '');
      } else if (entry.icon) {
        item.setAttribute('icon', entry.icon);
      }
      menu.append(item);
    }
    return menu;
  }

  private run(item: MenuItem, context: MenuContext): void {
    if (item.command) {
      this.commands.execute(item.command, context);
      return;
    }
    try {
      item.run?.(context);
    } catch (error) {
      console.error('Menu item handler failed', error);
    }
  }
}

export function whenMatches(
  when: MenuContext | undefined,
  context: MenuContext,
): boolean {
  if (!when) {
    return true;
  }
  return Object.entries(when).every(([key, value]) => context[key] === value);
}
