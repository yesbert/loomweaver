import { Type } from '@angular/core';
import { SurfaceBase } from './surface.js';
import { ViewAction } from './view-action.js';
import { AccessRequirement } from '../plugin/auth.js';

/**
 * A view docked into a **Panel** region (chrome-local, auto-tabbed by the host) — the host's internal
 * shape for a **non-routable** {@link Surface}. Authors do not build one directly: contribute a
 * `Surface` via `ctx.registerSurface` and the host normalises it into this.
 */
export interface View
  extends Pick<SurfaceBase, 'retain' | 'saveOn' | 'closable' | 'padded'> {
  /** Stable id (ordering, active-view selection, removal). */
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
