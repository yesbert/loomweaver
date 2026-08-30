import { AccessRequirement } from './auth.js';
import { MenuTrigger } from './menu.js';

/**
 * A Rail/Ribbon item: an **independent command** triggered from the far
 * rail — not a view switcher (switching views is the panel's tab bar). Mirrors
 * Obsidian's ribbon (`addRibbonIcon`).
 */
export interface RailItem {
  readonly id: string;
  /** Target Rail region id. */
  readonly rail: string;
  /** Icon name — resolved by the host icon registry (a plain string). */
  readonly icon: string;
  /**
   * One or two letters the host draws **instead of** the icon, for an entry whose name is the user's
   * rather than yours (a saved workspace, a project, an account) — a fixed glyph would make every
   * such entry look alike. {@link icon} stays required as the fallback for a name too short or too
   * foreign to abbreviate.
   *
   * Keep it to two characters: the rail draws them at icon size, and three no longer read at a
   * glance. The host renders them in the app font and in the same colour the icon would have taken,
   * so hover and the active marker behave exactly as elsewhere.
   */
  readonly initials?: string;
  /** Transloco key (or literal) for the tooltip/label. */
  readonly title: string;
  /** Lower renders first within its anchor group (default 0). */
  readonly order?: number;
  /** Pinned to the top (default) or the bottom of the rail (e.g. settings, VS Code style). */
  readonly anchor?: 'top' | 'bottom';
  /**
   * Id of a menu slot to open as this item's **context menu** on right-click — region-agnostic:
   * the host wires the right-click uniformly and passes a serialisable context (`{ targetKind, id, region }`).
   * Contribute items to the slot with `ctx.registerMenuItem({ menu, … })`. Omit for no context menu.
   */
  readonly menu?: string;
  /**
   * Which gesture opens {@link menu}. Defaults to `'context'`, so an item that says nothing keeps
   * the right-click it always had. Ignored without {@link menu}, and on an item that names a
   * {@link workspace}, where activating it is the switch.
   */
  readonly menuTrigger?: MenuTrigger;
  /**
   * Id of a registered {@link Command} this item triggers. Provide this **or** {@link run}; when
   * set, the host runs that command (so a keybinding/palette can share the same behaviour).
   */
  readonly command?: string;
  /**
   * Declarative auth gating: the host hides (default) or disables this item when the
   * current session does not meet the requirement. Presentation only — real enforcement is
   * server-side. Omit for an item everyone sees.
   */
  readonly access?: AccessRequirement;
  /**
   * Id of a workspace this item switches to. The host performs the switch itself and
   * marks the item as the current one while that workspace is active, so a rail entry for a
   * workspace needs no command of its own. Provide this **instead of** {@link command}/{@link run};
   * when it is set those are ignored. An id no workspace answers to warns in development.
   */
  readonly workspace?: string;
  /**
   * Inline behaviour, for an item that is not backed by a registered command. May be async; the
   * host fires it fire-and-forget. Typed `() => void` so a one-expression arrow whose handler
   * happens to return a value (e.g. `() => ctx.ui.openSettings()`) still assigns — the return is
   * ignored either way.
   */
  run?(): void;
}
