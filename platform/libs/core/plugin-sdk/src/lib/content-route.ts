import { Type } from '@angular/core';
import { AccessRequirement } from './auth.js';
import { PaneArea } from './pane-area.js';

/**
 * A **container** surface ("workspace-in-a-tab"): instead of rendering one thing, the host
 * draws a nested, host-managed pane tree of **child surfaces** inside this surface's content tab —
 * the same drag/split/min/max mechanics as the top level, one level nested and scoped to
 * the parent tab instance. A container is always `routable` (it holds its own `:id`); its children are
 * non-routable surfaces mounted off-router, each receiving the container's route params (its `:id`).
 */
export interface ContainerSpec {
  /**
   * The child surfaces this container may hold — a bare surface id, or the object form when the child
   * should also carry an **address** inside the container (see {@link ContainerChildEntry.segment}).
   * The list is what the inner "new tab" picker offers, access-gated.
   */
  readonly children: readonly ContainerChild[];
  /**
   * How the tree looks when a container tab is opened fresh — either a plain list of child surface
   * ids, which is shorthand for one tabs area, or an arrangement in the {@link PaneArea} grammar:
   *
   * ```ts
   * initial: {
   *   columns: [
   *     { size: 60, tabs: ['quotes.positions'] },
   *     { size: 40, rows: [{ tabs: ['quotes.customer'] }, { tabs: ['quotes.margin'] }] },
   *   ],
   * }
   * ```
   *
   * A container whose path carries an `:id` needs this: its tree is keyed per instance, so no user
   * gesture can ever become the default for the next one. The declaration applies whenever the tab
   * is opened fresh; while it stays open the user's own arrangement wins.
   *
   * Every named child must also be listed in {@link children} — an entry that is not is dropped with
   * a developer warning, as is a structurally invalid area. A child the current user may not see is
   * still laid out and shows the host's access placeholder in its pane, so a session that has not
   * arrived yet cannot flatten the declared layout.
   */
  readonly initial?: readonly string[] | ContainerArea;
}

/** A container child — a bare surface id, or the object form for a child that carries an address. */
export type ContainerChild = string | ContainerChildEntry;

export interface ContainerChildEntry {
  /** The child surface id. */
  readonly surface: string;
  /**
   * The child's address **inside** this container, in Angular path syntax, so it may carry values:
   * `'list'`, `'entry/:entryId'`. Declaring one turns the child into something a sibling can open
   * several times over — a list child opens `entry/e-01` and `entry/e-02` as two tabs, each its own
   * pane if the user splits them, each with its own `VIEW_STATE`, all of it surviving a reload
   * because it lives in the container's tree.
   *
   * The address is **relative**: it means nothing outside this container, which is what lets the same
   * child surface serve several containers under different names, and what keeps the container
   * sealed. While the container tab holds the browser address, the URL shows the focused child
   * (`/runs/abc123/verdict`); in a split pane or a pop-out the child stays put and the address simply
   * does not express it.
   *
   * Without a segment the child behaves exactly as it always has: reachable from the inner picker,
   * one instance, no address.
   *
   * A child whose segment carries a value cannot be seeded in {@link ContainerSpec.initial} or offered
   * by the picker — neither knows what value to use. It is opened by a sibling, which is the point.
   * Declare a pane as `{ tabs: [] }` to say where those children land.
   */
  readonly segment?: string;
}

/** A container's initial arrangement — the {@link PaneArea} grammar over child surface ids. */
export type ContainerArea = PaneArea<ContainerTabEntry>;

/** A tab in a container declaration — a child surface id, or the object form for the extra flags. */
export type ContainerTabEntry = string | ContainerTab;

export interface ContainerTab {
  /** The child surface id the tab mounts; it must be listed in {@link ContainerSpec.children}. */
  readonly surface: string;
  /**
   * `false` fixes the tab inside this container: it shows no close affordance, "close others" and
   * "close all" spare it, and it cannot be dragged to another pane of the container.
   */
  readonly closable?: boolean;
  /** Marks the area's initially active tab; without it the first tab is active. */
  readonly active?: boolean;
}

/**
 * What a content route renders from (the UI-boundary form). Exactly one is set:
 *
 * - `component` — an Angular class rendered in-process (trusted rung; the default today). Cannot
 *   cross an RPC boundary, so a **sandboxed** plugin never uses this form.
 * - `iframe` — a URL the host mounts as an **isolated** `<iframe sandbox>` surface. A plain string, so it
 *   serialises over the `ctx`-RPC boundary; this is how a sandboxed, non-Angular plugin contributes a
 *   content view (the first untrusted rung). A **trusted** plugin may use it too, to embed a foreign
 *   origin on purpose (a dashboard, a docs site, a video): a sandboxed plugin is confined to same-origin
 *   URLs at the RPC seam, whereas for a trusted one the distribution's CSP `frame-src` decides.
 * - `container` — the host draws a nested pane tree of child surfaces.
 *
 * (`element` — a Web-Component tag — is the reserved form for the later WC rung; not yet.)
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
   * reflected in the URL as real path segments (`doc/:id/code`) so they are shareable and restorable
   *. Angular syntax, so a segment may **carry a value** (`'structure/:structureId'`). There is
   * **no forced default**: the bare tab root is a valid address and the surface decides what it shows
   * there. The route's `path` stays the **tab root**: navigating between sub-routes stays in one tab and
   * preserves the parent component's state. The view reads the active sub from the URL and renders it
   * (a component view needs a `<router-outlet>`; an `iframe` surface is told the active sub over its
   * channel).
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
   * to the product's login. Reactive: the surface appears once the session qualifies, no reload. A route
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

/** Input to `ctx.openContentTab` — opens a titled **dynamic** tab and navigates to it. */
export interface OpenTabInput {
  /** Concrete path to navigate to, e.g. `'doc/abc'` (not a pattern). */
  readonly path: string;
  /** Human title for the tab (e.g. the document name) — dynamic, not known from the URL. */
  readonly title: string;
  /** Icon name for the tab. */
  readonly icon?: string;
  /**
   * Whether {@link title} is a **literal** (shown verbatim) rather than a Transloco key. Default
   * `false` (the host translates it, preserving key-titled dynamic tabs). Set `true` for an inherently
   * dynamic title — a document name, an entity label — so the host skips the i18n lookup and does not
   * log a benign "missing translation" dev warning (finding #8).
   */
  readonly titleIsLiteral?: boolean;
  /**
   * Runs once when **this** tab is closed (the host's close control, or `ctx.closeContentTab`), giving
   * the weaver a hook to free per-tab state, cancel in-flight work or persist a draft. Not called when
   * the tab is merely deactivated (still open) or when the whole plugin deactivates. Re-opening the same
   * path replaces the handler with the latest one. (The callback itself cannot cross the sandbox RPC
   * boundary and is dropped there — instead the host calls the optional `contentTabClosed(path)` method
   * a sandboxed plugin's entry document may expose on its RPC channel.)
   */
  readonly onClose?: () => void;
  /**
   * Opens this as a **preview tab** (VS-Code "Preview Editors") — a single, reused, *italic*
   * slot per pane for transient browsing: a subsequent `openContentTab({ preview: true })` for
   * a **different** path replaces this tab's content instead of adding a tab, so browsing many items
   * doesn't pile up tabs. Promotion to a permanent tab is **explicit**: double-click the tab, or call
   * `ctx.keepContentTab(path)`. Re-opening the **same** path deliberately does *not* promote it and
   * preserves the tab's current state — a view commonly re-opens itself on mount to refine its title,
   * which would otherwise make every preview tab permanent the moment it renders. Default `false`
   * (a permanent tab). Ignored when the distribution disabled preview (`provideShellFeatures({ content: { preview: false } })`).
   */
  readonly preview?: boolean;
}
