import { AccessRequirement } from '../plugin/auth.js';

/**
 * A view's own header action (`header.actions`) — an independent function
 * of that view (e.g. "new", "sort"), shown in the panel header while the view is
 * active. Not a view switcher (that is the Rail).
 */
export interface ViewAction {
  readonly id: string;
  /** Icon name — resolved by the host icon registry (a plain string). */
  readonly icon: string;
  /** Transloco key (or literal) for the tooltip/label. */
  readonly title: string;
  /** Lower renders first (default 0). */
  readonly order?: number;
  /**
   * Id of a menu slot to open as this action's **context menu** on right-click — region-agnostic:
   * the host wires the right-click uniformly and passes a serialisable context (`{ targetKind, id, region }`).
   * Contribute items to the slot with `ctx.registerMenuItem({ menu, … })`. Omit for no context menu.
   */
  readonly menu?: string;
  /**
   * Id of a registered {@link Command} this action triggers. Provide this **or** {@link run}; when
   * set, the host runs that command (so a keybinding/palette can share the same behaviour).
   */
  readonly command?: string;
  /**
   * Declarative auth gating: the host hides (default) or disables this action when the
   * current session does not meet the requirement. Presentation only — real enforcement is
   * server-side. Omit for an action everyone sees.
   */
  readonly access?: AccessRequirement;
  /**
   * The state of a toggling action: `true` stands on, `false` stands off. The host draws it as the
   * control's pressed state, visibly and as `aria-pressed`, so a screen reader announces a toggle
   * as a toggle. Omit for a plain button, which is drawn and announced without any state. To move
   * a toggle, replace the action with `ctx.updateSurfaceAction` when the state changes.
   */
  readonly pressed?: boolean;
  /**
   * Inline behaviour, for an action that is not backed by a registered command. May be async; the
   * host fires it fire-and-forget. Typed `() => void` so a one-expression arrow whose handler
   * happens to return a value (e.g. `() => ctx.ui.openSettings()`) still assigns — the return is
   * ignored either way.
   */
  run?(): void;
}
