import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CommandService } from './command.service';
import { fuzzyScore } from './palette-fuzzy';
import { formatRelativeTime } from './relative-time';
import { PaletteMruService } from './palette-mru.service';
import { SHELL_FEATURES } from '../foundation/shell-features';
import { DialogRef } from '../dialog/dialog-ref';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { MenuService, MENU_ANCHOR_GAP } from '../menu/menu.service';
import { TAB_CONTEXT_MENU } from '../regions/content/tabs/tab-context-menu';

export const PALETTE_COMMAND_ID = 'shell.commandPalette';
export const QUICK_OPEN_COMMAND_ID = 'shell.quickOpen';

export type PaletteMode = 'commands' | 'tabs';

interface PaletteData {
  readonly mode?: PaletteMode;
}

interface CommandEntry {
  readonly kind: 'command';
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly shortcut?: string;
}

interface TabEntry {
  readonly kind: 'tab';
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly navPath: string;
  readonly pinned: boolean;
  readonly closable: boolean;
  readonly lastActive?: number;
  readonly time?: string;
}

type PaletteEntry = CommandEntry | TabEntry;

interface CommandSections {
  readonly recent: readonly CommandEntry[];
  readonly others: readonly CommandEntry[];
}

function matching<T extends { label: string }>(
  query: string,
  entries: readonly T[],
): readonly T[] {
  return entries.filter((entry) => fuzzyScore(query, entry.label) !== null);
}

function ranked<T extends { label: string }>(
  query: string,
  entries: readonly T[],
): readonly T[] {
  return entries
    .map((entry) => ({ entry, score: fuzzyScore(query, entry.label) }))
    .filter(
      (scored): scored is { entry: T; score: number } => scored.score !== null,
    )
    .toSorted((a, b) => b.score - a.score)
    .map((scored) => scored.entry);
}

@Component({
  selector: 'lw-command-palette',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './command-palette.html',
})
export class CommandPalette {
  private readonly ref = inject(DialogRef);
  private readonly commands = inject(CommandService);
  private readonly mru = inject(PaletteMruService);
  private readonly contentTabs = inject(ContentTabsService);
  private readonly menu = inject(MenuService);
  private readonly transloco = inject(TranslocoService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly recentlyUsed = inject(SHELL_FEATURES).commands.recentlyUsed;
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  private readonly translations = toSignal(this.transloco.events$, {
    initialValue: null,
  });

  protected readonly mode = signal<PaletteMode>(
    (this.ref.data as PaletteData | undefined)?.mode === 'tabs'
      ? 'tabs'
      : 'commands',
  );
  protected readonly query = signal('');
  private readonly rawIndex = signal(0);

  private readonly commandEntries = computed<readonly CommandEntry[]>(() => {
    this.lang();
    this.translations();
    return this.commands
      .commands()
      .filter(
        (command) =>
          command.id !== PALETTE_COMMAND_ID &&
          !command.paletteHidden &&
          this.commands.available(command),
      )
      .map((command) => ({
        kind: 'command' as const,
        id: command.id,
        label: this.transloco.translate(command.title),
        icon: command.icon,
        shortcut: this.commands.shortcutOf(command),
      }));
  });

  private readonly tabEntries = computed<readonly TabEntry[]>(() => {
    this.lang();
    this.translations();
    const locale = this.transloco.getActiveLang();
    const now = Date.now();
    return this.contentTabs.quickOpenTargets().map((tab) => ({
      kind: 'tab' as const,
      id: tab.path,
      label: tab.literalTitle ? tab.title : this.transloco.translate(tab.title),
      icon: tab.icon,
      navPath: tab.navPath,
      pinned: tab.pinned,
      closable: tab.closable,
      lastActive: tab.lastActive,
      time:
        tab.lastActive === undefined
          ? undefined
          : formatRelativeTime(locale, tab.lastActive, now),
    }));
  });

  private readonly commandSections = computed<CommandSections>(() => {
    const query = this.query().trim();
    const entries = this.commandEntries();
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const recent = this.recentlyUsed
      ? this.mru
          .ids()
          .map((id) => byId.get(id))
          .filter((entry): entry is CommandEntry => entry !== undefined)
      : [];
    const recentIds = new Set(recent.map((entry) => entry.id));
    const others = entries.filter((entry) => !recentIds.has(entry.id));
    if (!query) {
      return { recent, others };
    }
    return {
      recent: matching(query, recent),
      others: ranked(query, others),
    };
  });

  private readonly tabResults = computed<readonly TabEntry[]>(() => {
    const query = this.query().trim();
    const entries = this.tabEntries();
    if (!query) {
      return [...entries].toSorted(
        (a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0),
      );
    }
    return ranked(query, entries);
  });

  protected readonly recentCount = computed(() =>
    this.mode() === 'tabs' ? 0 : this.commandSections().recent.length,
  );

  protected readonly results = computed<readonly PaletteEntry[]>(() => {
    if (this.mode() === 'tabs') {
      return this.tabResults();
    }
    const sections = this.commandSections();
    return [...sections.recent, ...sections.others];
  });

  protected readonly activeIndex = computed(() => {
    const last = this.results().length - 1;
    return Math.max(0, Math.min(this.rawIndex(), last));
  });

  protected readonly activeId = computed<string | null>(() =>
    this.results().length ? this.optionId(this.activeIndex()) : null,
  );

  protected optionId(index: number): string {
    return `lw-palette-option-${index}`;
  }

  protected shortcutOf(entry: PaletteEntry): string | undefined {
    return entry.kind === 'command' ? entry.shortcut : undefined;
  }

  protected timeOf(entry: PaletteEntry): string | undefined {
    return entry.kind === 'tab' ? entry.time : undefined;
  }

  protected setActive(index: number): void {
    this.rawIndex.set(index);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.rawIndex.set(0);
    this.scrollListToTop();
  }

  protected move(event: Event, delta: number): void {
    event.preventDefault();
    const count = this.results().length;
    if (count === 0) {
      return;
    }
    const next = (this.activeIndex() + delta + count) % count;
    this.rawIndex.set(next);
    this.element.nativeElement
      .querySelector(`#${this.optionId(next)}`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }

  protected runActive(event: Event): void {
    event.preventDefault();
    const entry = this.results()[this.activeIndex()];
    if (entry) {
      this.select(entry);
    }
  }

  protected select(entry: PaletteEntry): void {
    if (entry.kind === 'command') {
      if (this.recentlyUsed) {
        this.mru.record(entry.id);
      }
      this.ref.close();
      this.commands.execute(entry.id);
      return;
    }
    this.ref.close();
    this.contentTabs.revealContentTab(entry.navPath);
  }

  protected openTabActions(event: Event): void {
    if (this.mode() !== 'tabs') {
      return;
    }
    const entry = this.results()[this.activeIndex()];
    if (entry?.kind !== 'tab') {
      return;
    }
    event.preventDefault();
    const rect = this.element.nativeElement
      .querySelector(`#${this.optionId(this.activeIndex())}`)
      ?.getBoundingClientRect();
    const at = rect
      ? { x: rect.right - MENU_ANCHOR_GAP, y: rect.top }
      : { x: 0, y: 0 };
    this.ref.close();
    this.menu.open(
      TAB_CONTEXT_MENU,
      {
        tabId: entry.navPath,
        closable: entry.closable,
        pinned: entry.pinned,
      },
      at,
    );
  }

  private scrollListToTop(): void {
    const list = this.element.nativeElement.querySelector('#lw-palette-list');
    if (list) {
      list.scrollTop = 0;
    }
  }
}
