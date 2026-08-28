import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { BarSlot } from '@loomweaver/plugin-sdk';
import { provideBarItems } from '../../foundation/bar-item';
import { QuickOpenEntry } from './quick-open-entry';

/** Where the built quick-open entry goes. Defaults: status bar, start slot, order 5. */
export interface QuickOpenEntryOptions {
  /**
   * Target Bar region id. Default `'status-bar'` — apart from the command-palette entry, so that the
   * two badges are not read as a pair of duplicates. The badge adapts to the bar it lands in: a top
   * bar is a fixed band, so there it pins the shared bar-control height; a bottom bar takes the
   * height of its tallest item, so there it renders like a plain bar item rather than growing the
   * bar and costing the content area.
   */
  readonly bar?: string;
  /** Which Bar slot the entry renders in. Default `'start'`. */
  readonly slot?: BarSlot;
  /** Lower renders first within the slot. Default `5`. */
  readonly order?: number;
}

/**
 * Places a built quick-open entry in a Bar — a badge-styled affordance (icon + the OS-correct
 * shortcut) that opens `shell.quickOpen`, the search over open work. Opt-in: omit it for a search
 * that opens only by shortcut. Uses the `shell.quickOpenEntry` bar-item id, so
 * `provideShell({ omit: ['shell.quickOpenEntry'] })` removes it.
 *
 * The badge never outlives what it opens: omitting `shell.quickOpen`, or a session that may not run
 * it, takes the badge with it rather than leaving a control that does nothing. A pop-out window is
 * the same case — it offers no search over open work, so the badge is absent there. Switching
 * shortcuts off is the exception: the badge stays and still opens the search, it simply names no
 * chord. Independent of {@link provideCommandPaletteEntry}, so a product may place either, both or
 * neither.
 */
export function provideQuickOpenEntry(
  options: QuickOpenEntryOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders(
    provideBarItems({
      id: 'shell.quickOpenEntry',
      bar: options.bar ?? 'status-bar',
      slot: options.slot ?? 'start',
      order: options.order ?? 5,
      component: QuickOpenEntry,
    }),
  );
}
