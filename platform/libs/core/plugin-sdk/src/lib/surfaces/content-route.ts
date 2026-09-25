import { Type } from '@angular/core';
import { ContainerSpec } from './container-spec.js';
import { AccessRequirement } from '../plugin/auth.js';

/**
 * What a content route renders from (the UI-boundary form). Exactly one is set:
 *
 * - `component` — an Angular class rendered in-process, so only for a trusted plugin. Cannot
 *   cross an RPC boundary, so a **sandboxed** plugin never uses this form.
 * - `iframe` — a URL the host mounts as an **isolated** `<iframe sandbox>` surface. A plain string, so it
 *   serialises over the `ctx`-RPC boundary; this is how a sandboxed, non-Angular plugin contributes a
 *   content view. A **trusted** plugin may use it too, to embed a foreign origin on purpose (a
 *   dashboard, a docs site, a video): a sandboxed plugin is confined to the origins its distribution
 *   permitted, whereas for a trusted one the distribution's CSP `frame-src` decides.
 * - `container` — the host draws a nested pane tree of child surfaces.
 */
export type ContentSurface =
  | {
      readonly component: Type<unknown>;
      readonly loadComponent?: never;
      readonly iframe?: never;
      readonly container?: never;
    }
  | {
      readonly loadComponent: () => Promise<Type<unknown>>;
      readonly component?: never;
      readonly iframe?: never;
      readonly container?: never;
    }
  | {
      readonly iframe: string;
      readonly component?: never;
      readonly loadComponent?: never;
      readonly container?: never;
    }
  | {
      readonly container: ContainerSpec;
      readonly component?: never;
      readonly loadComponent?: never;
      readonly iframe?: never;
    };

/** The route metadata shared by every surface form. */
export interface ContentRouteBase {
  /**
   * The originating surface's id — the handle a distribution omits the route by
   * (`provideShell({ omit: ['route:<id>'] })`). Distinct from {@link path}, which stays the
   * **override** handle (re-registering a path replaces it in place, last-in wins). Carried through
   * from `ctx.registerSurface`; a route without an id can never be omitted.
   */
  readonly id?: string;
  /** Route path (Angular syntax), e.g. `'reports'`, `'doc/:id'`, `'dashboard'`. */
  readonly path: string;
  /**
   * A chromeless surface owns the whole content area while active — carried through from
   * `SurfaceRoutable.chromeless`: no tab strip, never a tab, excluded from splits, drags and the
   * new-tab picker.
   */
  readonly chromeless?: boolean;
  /**
   * Default title/icon for the tab the host opens when navigation lands on this route without an
   * explicit `openContentTab` (a shared deep-link, browser history, `navigateContent`). A plugin can
   * still refine it via `openContentTab` (e.g. the real document name). Omit and the host falls back
   * to the last path segment.
   */
  readonly title?: string;
  /** Default icon for that tab, a host icon-registry name. */
  readonly icon?: string;
  /**
   * Facet ordering — carried through from `SurfaceBase.order`: a following surface's permanent facet
   * tab renders lower orders first.
   */
  readonly order?: number;
  /**
   * Whether {@link title} is a **literal** (shown verbatim) rather than a Transloco key. Default `false`
   * (translated). The auto-open fallback (last path segment) is always treated as a literal. Set this
   * `true` when the route's default title is a non-translatable string, to avoid a benign
   * "missing translation" dev warning.
   */
  readonly titleIsLiteral?: boolean;
  /**
   * Nested sub-route segments under this route — the view's own level-2 tabs (e.g. `['code','preview']`),
   * reflected in the URL as real path segments (`doc/:id/code`) so they are shareable and restorable.
   * Angular syntax, so a segment may **carry a value** (`'structure/:structureId'`). There is
   * **no forced default**: the bare tab root is a valid address and the surface decides what it shows
   * there. The route's `path` stays the **tab root**: navigating between sub-routes stays in one tab and
   * preserves the parent component's state. A component reads the active sub from its injected route,
   * which follows the address: `data.sub`, or the child route, whose params carry a sub-route's values.
   * `data.urlDriven` is `true` while its pane carries the address. An `iframe` surface is told the
   * active sub over its channel.
   */
  readonly subRoutes?: readonly string[];
  /**
   * Keep this route's permanent tab pointing at the current selection — carried through from
   * {@link SurfaceRoutable.follows}: the host substitutes the parameter values it knows by name into
   * this pattern, truncating before the first it does not know.
   */
  readonly follows?: boolean;
  /**
   * Own everything below {@link path} — carried through from {@link SurfaceRoutable.rest}: the host
   * routes any deeper address to this route and hands the remainder over as the rest (verbatim,
   * including the query string), while {@link path} stays the tab root.
   */
  readonly rest?: boolean;
  /**
   * Declarative auth gating: when the current session does not meet the requirement the host
   * renders a neutral **"sign-in required" placeholder** at this URL instead of the route's surface (the
   * URL is preserved), or — if the distribution provided one via `provideUnauthorizedRedirect` — redirects
   * to the product's login. Reactive: the surface appears once the session qualifies, no reload. The
   * same holds below the route: a sub-address, a container child's segment or an owned remainder is
   * kept on a cold start and opens once the session qualifies. A route
   * is reachable or not, so `mode` is ignored. Presentation only — real enforcement is server-side. Omit
   * for a route everyone can reach.
   */
  readonly access?: AccessRequirement;
  /**
   * Retention when this route's surface is hidden — carried through from
   * {@link Surface.retain}. `'always'` keeps the instance alive while hidden; `'never'` forces
   * destruction; omitted falls back to the distribution's retention default (destroy).
   */
  readonly retain?: 'always' | 'never';
  /**
   * Auto-save on hiding — carried through from {@link Surface.saveOn}: a hidden dirty
   * instance's `surfaceSave` is called fire-and-forget.
   */
  readonly saveOn?: 'hide';
  /** Whether the user may close a tab of this route — carried through from {@link Surface.closable}. */
  readonly closable?: boolean;
  /**
   * Whether the host insets this surface from its pane edges. Absent, the product's own default
   * applies, which is no inset unless the distribution asked for one. See `SurfaceBase.padded`.
   */
  readonly padded?: boolean;
}

/**
 * A URL-addressed view in the content area. Unlike a {@link View} (which docks into
 * a Panel region and is chrome-local), a content route is reached by its `path`, so it is a shareable
 * deep-link with browser back/forward. The content area has a single `<router-outlet>`, so a route
 * needs no region id. Its surface is either an Angular `component` (trusted only — it cannot cross an RPC
 * boundary) or an `iframe` URL (the form a sandboxed plugin uses; a trusted plugin may also use
 * it to embed a foreign origin) — see {@link ContentSurface}. This is the host's **internal** shape
 * for a routable surface: authors do not build one directly — contribute a {@link Surface} via
 * `ctx.registerSurface` and the host normalises it into this.
 */
export type ContentRoute = ContentRouteBase & ContentSurface;
