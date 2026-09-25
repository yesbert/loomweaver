import {
  afterNextRender,
  DestroyRef,
  ErrorHandler,
  inject,
  Injector,
  Service,
  signal,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { MenuContext, MenuHeader, MenuItem } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { CommandService } from '../commands/command.service';
import { HEADING_KEY } from './menu-heading';
import { followed, MenuAnchor, place } from './menu-placement';
import { MenuLabel } from './menu-wording';
import { drawMenu, MenuRow, WordedMenu } from './menu-drawing';
import {
  headingCommand,
  ResolvedItem,
  resolveMenuItems,
} from './menu-resolution';
import { wordingChanges } from '../i18n/wording';
import {
  LW_MENU_DISMISS,
  LW_MENU_SELECT,
} from '../elements/menu/lw-menu.element';

export interface MenuOpenOptions {
  readonly trigger?: HTMLElement;
  readonly header?: MenuHeader;
}

interface OpenMenu {
  readonly menu: HTMLElement;
  readonly onOutside: (event: PointerEvent) => void;
  readonly restore: HTMLElement | null;
  readonly listenTimer: ReturnType<typeof setTimeout>;
  readonly wording: Subscription;
}

export interface MenuListEntry {
  readonly key: string;
  readonly label: MenuLabel;
  readonly icon?: string;
  readonly active?: boolean;
  readonly checked?: boolean;
}

@Service()
export class MenuService {
  private readonly registry = inject(ContributionRegistry);

  private readonly commands = inject(CommandService);

  private readonly transloco = inject(TranslocoService);

  private readonly errors = inject(ErrorHandler);

  private readonly injector = inject(Injector);

  private readonly trigger = signal<HTMLElement | null>(null);

  private current?: OpenMenu;

  readonly openTrigger = this.trigger.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.close());
  }

  open(
    menuId: string | readonly string[],
    context: MenuContext,
    at: MenuAnchor,
    options: MenuOpenOptions = {},
  ): void {
    this.close();
    const commands = this.registry.commands();
    const resolved = resolveMenuItems(
      typeof menuId === 'string' ? [menuId] : menuId,
      context,
      {
        menuItems: this.registry.menuItems(),
        commands,
        shortcutOf: (command) => this.commands.shortcutOf(command),
      },
    );
    const leadsTo = headingCommand(options.header, commands);
    if (resolved.length === 0 && !leadsTo) {
      return;
    }
    const worded = drawMenu(
      resolved.map((entry) => resolvedRow(entry)),
      this.translate,
      options.header && { header: options.header, leadsTo },
    );
    const byKey = new Map(resolved.map((entry) => [entry.key, entry.item]));
    this.present(
      worded,
      at,
      (key) => {
        if (key === HEADING_KEY && leadsTo) {
          this.commands.execute(leadsTo.id, context);
          return;
        }
        const item = key === null ? undefined : byKey.get(key);
        if (item) {
          this.run(item, context);
        }
      },
      options.trigger,
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
    this.present(
      drawMenu(
        entries.map((entry) => listRow(entry)),
        this.translate,
      ),
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
    open.wording.unsubscribe();
    document.removeEventListener('pointerdown', open.onOutside, true);
    document.body.classList.remove('lw-menu-open');
    open.menu.remove();
    open.restore?.focus?.();
  }

  private present(
    { menu, word }: WordedMenu,
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
    place(menu, at);
    const openedAt = trigger?.getBoundingClientRect();
    let placedAt = at;
    this.trigger.set(trigger ?? null);
    const listenTimer = setTimeout(
      () =>
        document.addEventListener('pointerdown', onOutside, { capture: true }),
      0,
    );
    const wording = wordingChanges(this.transloco).subscribe(() => {
      word();
      place(menu, placedAt);
      afterNextRender(
        () => {
          if (this.current?.menu !== menu) {
            return;
          }
          placedAt = followed(at, trigger, openedAt) ?? placedAt;
          place(menu, placedAt);
        },
        { injector: this.injector },
      );
    });
    this.current = { menu, onOutside, restore, listenTimer, wording };
  }

  private readonly translate = (key: string): string => {
    const words: unknown = this.transloco.translate(key);
    return typeof words === 'string' ? words : key;
  };

  private run(item: MenuItem, context: MenuContext): void {
    if (item.command) {
      this.commands.execute(item.command, context);
      return;
    }
    try {
      item.run?.(context);
    } catch (error) {
      this.errors.handleError(error);
    }
  }
}

function resolvedRow(entry: ResolvedItem): MenuRow {
  return {
    key: entry.key,
    label: entry.title,
    group: entry.group,
    icon: entry.icon,
    shortcut: entry.shortcut,
    checkbox: entry.checkbox,
    checked: entry.checked,
  };
}

function listRow(entry: MenuListEntry): MenuRow {
  const checkbox = entry.checked !== undefined || entry.active === true;
  return {
    key: entry.key,
    label: entry.label,
    group: '',
    icon: entry.icon,
    checkbox,
    checked: checkbox && (entry.checked ?? entry.active) === true,
  };
}
