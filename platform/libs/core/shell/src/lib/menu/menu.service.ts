import {
  afterNextRender,
  DestroyRef,
  effect,
  inject,
  Injector,
  Service,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import {
  Command,
  MenuContext,
  MenuHeader,
  MenuItem,
} from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { CommandService } from '../commands/command.service';
import { AuthContext } from '../auth/auth-context';
import { DialogService } from '../dialog/dialog.service';
import { HEADING_KEY } from './menu-heading';
import { followed, MenuAnchor, place } from './menu-placement';
import { MenuLabel } from './menu-wording';
import { drawMenu, MenuRow, WordedMenu } from './menu-drawing';
import {
  headingCommand,
  ResolvedEntry,
  resolveSlot,
  SlotEntry,
  slotSources,
} from './menu-resolution';
import { wordingChanges } from '../i18n/wording';
import {
  LW_MENU_DISMISS,
  LW_MENU_SELECT,
} from '../elements/menu/lw-menu.element';
import { focusReturnOf, returnFocusTo } from '../elements/menu/overlay-menu';
import { closeOnOutsidePointer } from '../elements/row-fold';

export interface MenuOpenOptions {
  readonly trigger?: HTMLElement;
  readonly header?: MenuHeader;
}

interface OpenMenu {
  readonly menu: HTMLElement;
  stopOutside?: () => void;
  readonly listenTimer: ReturnType<typeof setTimeout>;
  readonly wording: Subscription;
}

export type LabelledEntry = ResolvedEntry<MenuItem> & {
  readonly title: string;
  readonly submenu?: readonly LabelledEntry[];
};

export interface MenuAnswer {
  readonly entries: readonly LabelledEntry[];
  readonly leadsTo?: Command;
}

function labelled(entry: ResolvedEntry<MenuItem>): entry is LabelledEntry {
  return entry.title !== undefined;
}

export interface MenuListEntry {
  readonly key: string;
  readonly label: MenuLabel;
  readonly icon?: string;
  readonly chord?: string;
  readonly active?: boolean;
  readonly checked?: boolean;
  readonly children?: readonly MenuListEntry[];
}

@Service()
export class MenuService {
  private readonly registry = inject(ContributionRegistry);

  private readonly commands = inject(CommandService);

  private readonly auth = inject(AuthContext);

  private readonly transloco = inject(TranslocoService);

  private readonly injector = inject(Injector);

  private readonly trigger = signal<HTMLElement | null>(null);

  private readonly dialogs = inject(DialogService).dialogs;

  private dialogsOpen = 0;

  private current?: OpenMenu;

  readonly openTrigger = this.trigger.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.close());
    effect(() => {
      const open = this.dialogs().length;
      if (open > this.dialogsOpen) {
        untracked(() => this.close());
      }
      this.dialogsOpen = open;
    });
  }

  open(
    menuId: string | readonly string[],
    context: MenuContext,
    at: MenuAnchor,
    options: MenuOpenOptions = {},
  ): void {
    this.close();
    const answer = this.answer(
      typeof menuId === 'string' ? [menuId] : menuId,
      context,
      options.header,
    );
    if (answer.entries.length === 0 && !answer.leadsTo) {
      return;
    }
    const worded = drawMenu(
      answer.entries.map((entry) => menuRowOf(entry)),
      this.translate,
      options.header && { header: options.header, leadsTo: answer.leadsTo },
    );
    this.present(
      worded,
      at,
      (key) => {
        if (key !== null) {
          this.choose(answer, key, context);
        }
      },
      options.trigger,
    );
  }

  answer(
    menuIds: readonly string[],
    context: MenuContext,
    header?: MenuHeader,
  ): MenuAnswer {
    return {
      entries: this.resolve(menuIds, context),
      leadsTo: headingCommand(header, this.usableCommands()),
    };
  }

  choose(answer: MenuAnswer, key: string, context: MenuContext): void {
    if (key === HEADING_KEY && answer.leadsTo) {
      this.commands.execute(answer.leadsTo.id, context);
      return;
    }
    const entry = everyEntry(answer.entries).find(
      (candidate) => candidate.key === key,
    );
    if (entry && !entry.disabled) {
      this.commands.trigger(entry.item, context);
    }
  }

  offers(
    menuId: string,
    context: MenuContext,
    header?: MenuHeader,
  ): boolean {
    const answer = this.answer([menuId], context, header);
    return answer.entries.length > 0 || answer.leadsTo !== undefined;
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
    this.dismiss(true);
  }

  private dismiss(restoreFocus: boolean): void {
    const open = this.current;
    if (!open) {
      return;
    }
    this.current = undefined;
    this.trigger.set(null);
    clearTimeout(open.listenTimer);
    open.wording.unsubscribe();
    open.stopOutside?.();
    document.body.classList.remove('lw-menu-open');
    open.menu.remove();
    if (restoreFocus) {
      focusReturnOf(open.menu)?.focus?.();
    }
  }

  private present(
    { menu, word }: WordedMenu,
    at: MenuAnchor,
    onSelect: (key: string | null) => void,
    trigger?: HTMLElement,
  ): void {
    returnFocusTo(menu, document.activeElement as HTMLElement | null);
    menu.addEventListener(LW_MENU_SELECT, (event) => {
      const key = (event as CustomEvent<{ command: string | null }>).detail
        .command;
      this.close();
      onSelect(key);
    });
    menu.addEventListener(LW_MENU_DISMISS, () => this.close());
    document.body.append(menu);
    document.body.classList.add('lw-menu-open');
    place(menu, at);
    const openedAt = trigger?.getBoundingClientRect();
    let placedAt = at;
    this.trigger.set(trigger ?? null);
    let hadFocus = false;
    menu.addEventListener('focusin', () => {
      hadFocus = true;
    });
    const listenTimer = setTimeout(() => {
      opened.stopOutside = closeOnOutsidePointer(
        document,
        (target) => menu.contains(target),
        (reason) => {
          if (reason === 'pointer' || hadFocus) {
            this.dismiss(reason === 'pointer');
          }
        },
      );
    }, 0);
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
    const opened: OpenMenu = { menu, listenTimer, wording };
    this.current = opened;
  }

  private readonly translate = (key: string): string => {
    const words: unknown = this.transloco.translate(key);
    return typeof words === 'string' ? words : key;
  };

  private resolve(
    menuIds: readonly string[],
    context: MenuContext,
    open: ReadonlySet<string> = new Set(menuIds),
  ): LabelledEntry[] {
    const submenus = new Map<string, LabelledEntry[]>();
    const offered = (entry: SlotEntry): string | undefined => {
      const slot = entry.submenu;
      if (slot === undefined || open.has(slot)) {
        return undefined;
      }
      const entries = this.resolve([slot], context, new Set([...open, slot]));
      if (entries.length === 0) {
        return undefined;
      }
      submenus.set(slot, entries);
      return slot;
    };
    return resolveSlot(
      this.registry.menuItems().filter((item) => menuIds.includes(item.menu)),
      () => context,
      slotSources(
        {
          registry: this.registry,
          commands: this.commands,
          auth: this.auth,
        },
        offered,
      ),
    )
      .filter((entry) => labelled(entry))
      .map((entry) => withSubmenu(entry, submenus));
  }

  private usableCommands(): readonly Command[] {
    return this.registry
      .commands()
      .filter((command) => this.commands.available(command));
  }
}

export function menuRowOf(entry: LabelledEntry): MenuRow {
  return {
    key: entry.key,
    label: entry.title,
    group: entry.group,
    icon: entry.icon,
    chord: entry.chord,
    checkbox: entry.checkbox,
    checked: entry.checked,
    disabled: entry.disabled,
    children: entry.submenu?.map((child) => menuRowOf(child)),
  };
}

function listRow(entry: MenuListEntry): MenuRow {
  const checkbox = entry.checked !== undefined || entry.active === true;
  return {
    key: entry.key,
    label: entry.label,
    group: '',
    icon: entry.icon,
    chord: entry.chord,
    checkbox,
    checked: checkbox && (entry.checked ?? entry.active) === true,
    children: entry.children?.map((child) => listRow(child)),
  };
}

function withSubmenu(
  entry: LabelledEntry,
  submenus: ReadonlyMap<string, readonly LabelledEntry[]>,
): LabelledEntry {
  const submenu = entry.opensMenu && submenus.get(entry.opensMenu);
  return submenu ? { ...entry, submenu: keyedUnder(entry.key, submenu) } : entry;
}

function keyedUnder(
  parent: string,
  entries: readonly LabelledEntry[],
): LabelledEntry[] {
  return entries.map((entry) => {
    const key = `${parent}>${entry.key}`;
    return {
      ...entry,
      key,
      submenu: entry.submenu && keyedUnder(key, entry.submenu),
    };
  });
}

function everyEntry(entries: readonly LabelledEntry[]): LabelledEntry[] {
  return entries.flatMap((entry) => [entry, ...everyEntry(entry.submenu ?? [])]);
}
