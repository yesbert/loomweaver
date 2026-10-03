import { InjectionToken, Type } from '@angular/core';
import { AccessRequirement } from '../plugin/auth.js';
import { MenuContext } from './menu.js';

/**
 * A toolbar a plugin owns: a menu slot drawn open and side by side, wherever the plugin places
 * `<lw-toolbar menu="…">` in its own content. Register it once; place it as often as you like, each
 * placement with its own `context` describing what it stands beside. Any plugin fills it with
 * `registerMenuItem({ menu: slot, … })`, exactly as it fills a menu, and the same `when` matching,
 * groups and command-derived labels apply. The slot is yours: export its id so the plugins meant to
 * fill it can name it, and a second plugin registering a toolbar under it is refused.
 */
export interface Toolbar {
  /** The slot this toolbar draws. Convention: `<plugin>.<thing>/toolbar`. */
  readonly slot: string;
  /**
   * The name assistive technology announces the toolbar by — Transloco key or literal. A placement
   * may give its own `label`; this one stands where it gives none.
   */
  readonly title: string;
}

/**
 * A control of your own inside another plugin's toolbar, for a plugin the workbench renders in the
 * page: the host renders the component into a cell among the toolbar's entries, told the
 * placement's description through `TOOLBAR_CONTEXT`. The workbench does not look inside a cell: it
 * has no command, matches no `when`, shows no shortcut, and folds whole when the toolbar is too
 * narrow for it. `access` can only hide it. A cell never reaches a toolbar drawn inside an isolated
 * surface, because code does not cross that boundary.
 *
 * The plugin that placed the toolbar needs none of this for its own controls: it writes them as
 * children of the `<lw-toolbar>` element, with an `order` attribute where the position matters.
 */
export interface ToolbarCell {
  /** Stable id — same id overrides in place (last wins); used for ordering and removal. */
  readonly id: string;
  /** The toolbar slot to appear in. */
  readonly slot: string;
  /** Component the host renders in the cell. */
  readonly component: Type<unknown>;
  /** Lower renders first among the toolbar's entries (default 0). */
  readonly order?: number;
  /** Hides the cell while the session does not meet the requirement; `mode` is ignored. */
  readonly access?: AccessRequirement;
}

/**
 * What a component rendered into a toolbar cell is told about where it stands: the slot of the
 * toolbar and the description of the placement it was drawn in, the same values the toolbar's
 * entries are matched against. Inject it with `inject(TOOLBAR_CONTEXT)`.
 */
export interface ToolbarContext {
  readonly slot: string;
  readonly context: MenuContext;
}

/** The token a toolbar cell component injects to learn its slot and placement. */
export const TOOLBAR_CONTEXT = new InjectionToken<ToolbarContext>(
  'TOOLBAR_CONTEXT',
);
