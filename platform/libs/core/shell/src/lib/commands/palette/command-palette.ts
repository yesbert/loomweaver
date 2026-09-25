import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Command, DialogRef } from '@loomweaver/plugin-sdk';
import { CommandService } from '../command.service';
import { CommandRow, commandRows, commandSections } from './command-rows';
import { TabRow, tabResults, tabRows } from './tab-rows';
import { RecentCommandsService } from './recent-commands.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';
import { MENU_ANCHOR_GAP } from '../../elements/menu/lw-menu.element';
import { TAB_CONTEXT_MENU } from '../../regions/content/tabs/tab-context-menu';
import { Wording } from '../../i18n/wording';

export const PALETTE_COMMAND_ID = 'shell.commandPalette';
export const QUICK_OPEN_COMMAND_ID = 'shell.quickOpen';

export type PaletteMode = 'commands' | 'tabs';

interface PaletteData {
  readonly mode?: PaletteMode;
}

type PaletteRow = CommandRow | TabRow;

@Component({
  selector: 'lw-command-palette',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './command-palette.html',
})
export class CommandPalette {
  private readonly ref = inject(DialogRef);
  private readonly commands = inject(CommandService);
  private readonly recentCommands = inject(RecentCommandsService);
  private readonly contentTabs = inject(ContentTabsService);
  private readonly menu = inject(MenuService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly recentlyUsed = inject(FeatureSwitches).commands.recentlyUsed;
  private readonly wording = inject(Wording);

  protected readonly mode: PaletteMode =
    (this.ref.data as PaletteData | undefined)?.mode === 'tabs'
      ? 'tabs'
      : 'commands';
  protected readonly title =
    this.mode === 'tabs' ? 'palette.quickOpenTitle' : 'palette.title';
  protected readonly query = signal('');
  private readonly rawIndex = signal(0);

  private readonly commandSections = computed(() =>
    commandSections(
      commandRows(
        this.commands.commands().filter((command) => this.offered(command)),
        {
          translate: (key) => this.wording.translate(key),
          shortcutOf: (command) => this.commands.shortcutOf(command),
        },
      ),
      this.recentlyUsed() ? this.recentCommands.ids() : [],
      this.query().trim(),
    ),
  );

  private readonly tabResults = computed(() =>
    tabResults(
      tabRows(
        this.contentTabs.quickOpenTargets(),
        (key) => this.wording.translate(key),
        this.wording.activeLang(),
        Date.now(),
      ),
      this.query().trim(),
    ),
  );

  protected readonly recentCount = computed(() =>
    this.mode === 'tabs' ? 0 : this.commandSections().recent.length,
  );

  protected readonly results = computed<readonly PaletteRow[]>(() => {
    if (this.mode === 'tabs') {
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

  protected shortcutOf(row: PaletteRow): string | undefined {
    return row.kind === 'command' ? row.shortcut : undefined;
  }

  protected timeOf(row: PaletteRow): string | undefined {
    return row.kind === 'tab' ? row.time : undefined;
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
    const row = this.results()[this.activeIndex()];
    if (row) {
      this.select(row);
    }
  }

  protected select(row: PaletteRow): void {
    if (row.kind === 'command') {
      if (this.recentlyUsed()) {
        this.recentCommands.record(row.id);
      }
      this.ref.close();
      this.commands.execute(row.id);
      return;
    }
    this.ref.close();
    this.contentTabs.revealContentTab(row.navPath);
  }

  protected openTabActions(event: Event): void {
    if (this.mode !== 'tabs') {
      return;
    }
    const row = this.results()[this.activeIndex()];
    if (row?.kind !== 'tab') {
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
        tabId: row.navPath,
        closable: row.closable,
        pinned: row.pinned,
      },
      at,
    );
  }

  private offered(command: Command): boolean {
    return (
      command.id !== PALETTE_COMMAND_ID &&
      !command.paletteHidden &&
      this.commands.available(command)
    );
  }

  private scrollListToTop(): void {
    const list = this.element.nativeElement.querySelector('#lw-palette-list');
    if (list) {
      list.scrollTop = 0;
    }
  }
}
