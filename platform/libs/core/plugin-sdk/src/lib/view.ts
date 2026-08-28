import { Type } from '@angular/core';
import { AccessRequirement } from './auth.js';

/**
 * A view's own header action (`header.actions`) — an independent function
 * of that view (e.g. "new", "sort"), shown in the panel header while the view is
 * active. Not a view switcher (that is the Rail). Mirrors Obsidian's view actions.
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
   * Inline behaviour, for an action that is not backed by a registered command. May be async; the
   * host fires it fire-and-forget. Typed `() => void` so a one-expression arrow whose handler
   * happens to return a value (e.g. `() => ctx.ui.openSettings()`) still assigns — the return is
   * ignored either way.
   */
  run?(): void;
}

/**
 * A view docked into a **Panel** region (chrome-local, auto-tabbed by the host) — the host's internal
 * shape for a **non-routable** {@link Surface}. Authors do not build one directly: contribute a
 * `Surface` via `ctx.registerSurface` and the host normalises it into this.
 */
export interface View {
  /** Stable id (ordering, active-view selection, future removal). */
  readonly id: string;
  /** Target region id this view docks into. */
  readonly region: string;
  /** Transloco key (or literal) for the view title. */
  readonly title: string;
  /** Lower renders/launchers first within a region (default 0). */
  readonly order?: number;
  /** Icon name for this view's tab in the panel's tab bar. */
  readonly icon?: string;
  /** The view's own header actions, shown in the panel header while active. */
  readonly actions?: readonly ViewAction[];
  /**
   * Declarative auth gating: the host **hides** the whole view (its tab and body) when
   * the current session does not meet the requirement. A view is present or not, so `mode` is
   * ignored here (unlike a button, a disabled tab is not a useful state). Presentation only — real
   * enforcement is server-side. Omit for a view everyone sees.
   */
  readonly access?: AccessRequirement;
  /**
   * Opt in to **named saved instances**: the host shows a switcher in the view
   * header so the user can save, name, rename and delete several configurations of this view, each with
   * its own `VIEW_STATE` blob (auto-saved). The non-deletable *default* instance carries the view's
   * baseline state. Omit for a single implicit instance (the view's own `VIEW_STATE`).
   */
  readonly instanceable?: boolean;
  /**
   * Retention when the view is hidden — carried through from {@link Surface.retain}.
   * `'always'` keeps the instance alive while hidden; `'never'` forces destruction; omitted falls back
   * to the distribution's retention default (destroy).
   */
  readonly retain?: 'always' | 'never';
  /**
   * Auto-save on hiding — carried through from {@link Surface.saveOn}: a hidden dirty
   * instance's `surfaceSave` is called fire-and-forget.
   */
  readonly saveOn?: 'hide';
  /** Whether the user may close a tab of this view — carried through from {@link Surface.closable}. */
  readonly closable?: boolean;
  /**
   * Whether the host insets this surface from its pane edges (default `true`). Declare `false` for a
   * surface that owns its own edges — a viewer, a canvas, a map, an edge-to-edge table. See
   * `SurfaceBase.padded`.
   */
  readonly padded?: boolean;
  /** Component the host renders as the view body. */
  readonly component?: Type<unknown>;
  /** Deferred alternative to {@link component} — the host calls it the first time the view is shown. */
  readonly loadComponent?: () => Promise<Type<unknown>>;
  /**
   * A URL the host mounts as an **isolated** `<iframe sandbox>` view body — the same presentation form a
   * routable surface may take, now valid at a dock too. A docked surface has no address, so
   * its channel's `navigate` is a no-op with a development warning and it is told no tab or sub-route;
   * everything else it receives (locale, theme, tokens, text size, session, its instance id) is unchanged.
   */
  readonly iframe?: string;
}
