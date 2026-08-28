import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { BarSlot } from '@loomweaver/plugin-sdk';
import { provideBarItems } from '../../foundation/bar-item';
import { CommandPaletteEntry } from './command-palette-entry';

/** Where the built command-palette entry goes (LWF-05). Defaults: top bar, end slot, order 5. */
export interface CommandPaletteEntryOptions {
  /**
   * Target Bar region id. Default `'top-bar'`. The badge adapts to the bar it lands in: a top bar is
   * a fixed band, so there it pins the shared bar-control height and lines up with the theme and
   * language controls; a bottom bar takes the height of its tallest item, so there it renders like a
   * plain bar item rather than growing the bar and costing the content area.
   */
  readonly bar?: string;
  /** Which Bar slot the entry renders in. Default `'end'`. */
  readonly slot?: BarSlot;
  /** Lower renders first within the slot. Default `5` (left of the built update/language/theme items). */
  readonly order?: number;
}

/**
 * Places a built command-palette entry in a Bar (LWF-05) — a badge-styled affordance (search icon +
 * the palette's OS-correct shortcut) that opens `shell.commandPalette`, correct-by-construction and
 * without a distribution component. Opt-in: omit it for a palette that opens only by shortcut. Uses the
 * `shell.commandPaletteEntry` bar-item id, so `provideShell({ omit: ['shell.commandPaletteEntry'] })`
 * removes it.
 *
 * The badge never outlives what it opens: omitting `shell.commandPalette`, or a session that may not
 * run it, takes the badge with it rather than leaving a control that does nothing. Switching
 * shortcuts off is the exception — the badge stays and still opens the palette, it simply names no
 * chord. Independent of {@link provideQuickOpenEntry}, which places the entry to the search over
 * open work.
 */
export function provideCommandPaletteEntry(
  options: CommandPaletteEntryOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders(
    provideBarItems({
      id: 'shell.commandPaletteEntry',
      bar: options.bar ?? 'top-bar',
      slot: options.slot ?? 'end',
      order: options.order ?? 5,
      component: CommandPaletteEntry,
    }),
  );
}
