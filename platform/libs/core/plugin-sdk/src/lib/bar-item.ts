import { Type } from '@angular/core';
import { AccessRequirement } from './auth.js';

/** Bar slots. */
export type BarSlot = 'start' | 'center' | 'end';

interface BarItemBase {
  /** Stable id — same id overrides in place (last wins); used for ordering and removal. */
  readonly id: string;
  /** Target Bar region id (e.g. the top bar or a bottom status bar). */
  readonly bar: string;
  /** Which Bar slot the item renders in. */
  readonly slot: BarSlot;
  /** Lower renders first within a slot (default 0). */
  readonly order?: number;
  /**
   * Declarative auth gating: the host hides (default) or, for a {@link BarButtonItem},
   * disables this item when the current session does not meet the requirement. `disable` mode only
   * applies to the host-drawn button — a {@link BarComponentItem} owns its own cell, so it is only
   * ever hidden. Presentation only; real enforcement is server-side. Omit for an item everyone sees.
   */
  readonly access?: AccessRequirement;
}

/** A bar item that renders a plugin-provided component (full control over the cell). */
export interface BarComponentItem extends BarItemBase {
  /** Component the host renders in the slot. */
  readonly component: Type<unknown>;
}

/**
 * A declarative bar button — the host renders the button **and** its tooltip from data
 * (host offering). Lets a plugin add a status-/top-bar button without authoring
 * a component or importing `<lw-tooltip>`.
 */
export interface BarButtonItem extends BarItemBase {
  /** Icon name shown in the button (optional if a label is given). */
  readonly icon?: string;
  /** Transloco key/literal for a visible text label (optional). */
  readonly label?: string;
  /** Transloco key/literal for the tooltip; falls back to {@link label}. */
  readonly tooltip?: string;
  /**
   * Id of a menu slot to open as this button's **context menu** on right-click — region-agnostic:
   * the host wires the right-click uniformly and passes a serialisable context (`{ targetKind, id, region }`).
   * Contribute items to the slot with `ctx.registerMenuItem({ menu, … })`. Omit for no context menu.
   */
  readonly menu?: string;
  /**
   * Id of a registered {@link Command} this button triggers. Provide this **or** {@link run}; when
   * set, the host runs that command (so a keybinding/palette can share the same behaviour).
   */
  readonly command?: string;
  /**
   * Show the {@link command}'s keyboard shortcut hint next to the label, OS-correct (⌘K on macOS,
   * Ctrl+K elsewhere) — the same affordance a menu entry has. Only takes effect when {@link command}
   * names a command that declares a `shortcut`; ignored otherwise. Opt-in because a bar is tighter
   * than a menu. Default off.
   */
  readonly showShortcut?: boolean;
  /**
   * Inline behaviour, for a button that is not backed by a registered command. May be async; the
   * host fires it fire-and-forget. Typed `() => void` so a one-expression arrow whose handler
   * happens to return a value (e.g. `() => ctx.ui.openSettings()`) still assigns — the return is
   * ignored either way.
   */
  run?(): void;
}

/** A control the host renders into a slot of a Bar region. */
export type BarItem = BarComponentItem | BarButtonItem;
