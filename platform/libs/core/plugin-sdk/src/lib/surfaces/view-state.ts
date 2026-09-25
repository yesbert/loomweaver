import { InjectionToken } from '@angular/core';

/**
 * An instance-scoped handle a mounted view uses to read and persist its **own** serialisable state — the
 * chosen view + filters, scroll position, expanded nodes. The platform stays
 * domain-pure: it stores an opaque blob and only this view interprets it.
 *
 * Since a hidden surface is destroyed as soon as it is clean, this is the survival path:
 * anything that must outlive a tab switch, a collapsed sidebar or an F5 belongs here — the rule to author
 * by is *evictable = reload-safe*.
 *
 * Reads are Signal-shaped (`() => T`) so a template re-reads reactively (the same convention as
 * `PluginSession`); writes are auto-saved by the host (debounced) — the view never touches storage, and
 * a fresh instance simply reads `undefined` and applies its own default.
 *
 * The host provides one handle per mounted **docked** surface instance. A **routable** surface has none:
 * its shareable state belongs in the URL it already owns (route params, `subRoutes`), and unsaved work is
 * carried by `DirtySurface` or a `retain` declaration. A **sandboxed** surface has none either — nothing
 * of this shape crosses the RPC boundary; it declares `retain: 'always'` instead, and the host hides the
 * iframe in place rather than destroying it, so the document keeps its own state.
 */
export interface ViewState<T = unknown> {
  /** The instance's saved state, reactive; `undefined` for a fresh instance (apply your own default). */
  readonly value: () => T | undefined;
  /**
   * Replace the state; the host auto-saves it to the active instance. Call it freely — writes are
   * debounced. It replaces the **whole** blob, so spread the current value when you change one field.
   */
  set(next: T): void;
  /** The id of the instance this view is bound to. */
  readonly instanceId: string;
}

/**
 * DI token for the mounted view's {@link ViewState}. A docked view injects it, typing the state to its
 * own shape: `const vs = inject(VIEW_STATE) as ViewState<MyState>`. The host provides one per instance.
 * Injecting it from a routable or sandboxed surface throws — see {@link ViewState} for what those do
 * instead.
 */
export const VIEW_STATE = new InjectionToken<ViewState>('lw.view-state');
