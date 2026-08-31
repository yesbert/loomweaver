import { Type } from '@angular/core';
import { AccessRequirement } from './auth.js';
import { ContainerSpec } from './content-route.js';
import { ViewAction } from './view.js';

/**
 * How a surface is presented (the UI-boundary form). Exactly one is set:
 *
 * - `component` — an Angular class rendered in-process (trusted rung; the default today). Cannot
 *   cross an RPC boundary, so a **sandboxed** plugin never uses this form.
 * - `loadComponent` — the same thing, **deferred**: a loader the host calls the first time the surface is
 *   actually shown, mirroring Angular's `Route.loadComponent`. Use it when a surface drags a heavy
 *   dependency tree behind it (a chart engine, a graph layout), so that code lands in its own chunk and a
 *   user who never opens the surface never downloads it. Routable surfaces hand it straight to the router;
 *   host-mounted ones render nothing until it resolves.
 * - `iframe` — a URL the host mounts as an **isolated** `<iframe sandbox>` surface. A plain string, so it
 *   serialises over the `ctx`-RPC boundary — which is why it is the form a **sandboxed** plugin uses
 *   (the first untrusted rung). A **trusted** plugin may use it too, to embed a foreign origin on purpose
 *   (a dashboard, a docs site, a video): a sandboxed plugin is confined to same-origin URLs at the RPC
 *   seam, whereas for a trusted one the distribution's CSP `frame-src` decides what may be framed.
 * - `container` — the surface hosts a **nested pane tree** of child surfaces
 *   ("workspace-in-a-tab"): the host draws the inner drag/split/tab mechanics, the surface only declares
 *   which children it offers. Must be combined with `routable` (the container tab holds its own `:id`).
 *
 * Mirrors the {@link ContentSurface} union so a {@link Surface} and a {@link ContentRoute}
 * present identically, deliberately: `ContentRoute`
 * remains the host's internal storage shape, `Surface` the one authoring contract.
 */
export type SurfacePresentation =
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

/**
 * The **routable** capability of a {@link Surface}: the surface is URL-addressable, so it
 * can hold the one URL pane (deep-link, browser back/forward, `RouteReuseStrategy`). Carries the former
 * {@link ContentRoute} route fields. Omit for a surface that only ever lives as host-rendered workspace
 * state (a classic sidebar view).
 */
export interface SurfaceRoutable {
  /** Route path (Angular syntax), e.g. `'reports'`, `'doc/:id'`, `'dashboard'`. */
  readonly path: string;
  /**
   * A **chromeless** surface owns the whole content area while active: no tab strip, never a tab,
   * excluded from splits, drags and the new-tab picker — the full-area screen that login and
   * onboarding need. Every other routable surface lives in the tab area: navigating to it opens (or
   * re-uses) a tab, in whatever workspace the user is standing in. (This flag replaces the retired
   * `group` concept, whose only remaining meaning had been "lives in the tab area".)
   */
  readonly chromeless?: boolean;
  /**
   * Default title for the tab the host opens when navigation lands on this route (a deep link,
   * browser history, `navigateContent`). Falls back to {@link Surface.title} when omitted.
   */
  readonly title?: string;
  /** Default icon for that dynamic tab; falls back to {@link Surface.icon}. */
  readonly icon?: string;
  /** Whether the routable {@link title} is a literal rather than a Transloco key. */
  readonly titleIsLiteral?: boolean;
  /**
   * Nested sub-route segments — the surface's own level-2 tabs, reflected in the URL.
   * Angular syntax, so a segment may carry a value (`'structure/:structureId'`); the bare tab root is a
   * valid address with no forced redirect to the first entry.
   */
  readonly subRoutes?: readonly string[];
  /**
   * Keep this surface's **permanent tab pointing at the current selection**. Its siblings are facets of
   * one choice rather than independent documents: pick a program on one tab and the others should show
   * that program.
   *
   * The host knows the parameter values of the address it is on, because it knows which pattern matched.
   * For a following tab it substitutes those values **by name** into this surface's pattern, and where a
   * value is unknown it truncates the address before it:
   *
   * ```
   * on cedents/US003950/programs/205470/pricing
   * cedents/:cedentId/programs/:programId/treaties → cedents/US003950/programs/205470/treaties
   * cedents/:cedentId/programs/:programId/:reportId → cedents/US003950/programs/205470
   * ```
   *
   * **Off by default**, because the opposite is right for a tab showing one specific document: nobody
   * wants an open quote rewritten because a parameter changed elsewhere. A following surface is drawn
   * as a **permanent facet tab** (labelled by {@link SurfaceBase.title}/`icon`, ordered by
   * {@link SurfaceBase.order}) whenever its computed address leads somewhere — it does not open
   * dynamic tabs. A dynamically opened tab keeps the address it was opened with,
   * and a tab dragged out of the group that carries the browser address freezes where it is — which is
   * what lets a user park one program beside another.
   *
   * Two following surfaces may use the same parameter name only when the pattern **before** it is
   * identical; otherwise the name means two different things and the host would fill one surface's
   * address with the other's value. A collision refuses that one registration with a message.
   */
  readonly follows?: boolean;
  /**
   * Own **everything below** {@link path}: the longest registered prefix wins, and whatever no more
   * specific surface claims is handed to this one as **the rest** — verbatim, **including the query
   * string**. Without it a deeper address matches no route at all and the navigation fails; with it
   * `programs/US003950/pricing?t=886320` reaches the surface registered on `programs` and hands over
   * `US003950/pricing?t=886320`.
   *
   * The prefix stays the **tab root**, so the whole subtree is one tab whose state survives every move
   * within it. That is the trade the flag buys you: what you put *in the rest* changes without
   * rebuilding the surface, what you put *in the pattern* is a parameter change and may rebuild it.
   *
   * How the rest reaches you depends on the rung. A **sandboxed** surface receives it over its channel
   * (`state.rest`) and sets its own with the channel's `navigate` — both confined to this prefix. A
   * **trusted** component reads it the ordinary Angular way (its child `ActivatedRoute`/the router) and
   * navigates with the router.
   *
   * A prefix of **fewer than two segments** owns most of the address space, which is where the surface
   * channel's "confined to your own territory" guarantee stops meaning anything — declaring it there
   * additionally requires the `navigation` capability.
   */
  readonly rest?: boolean;
}

/** The metadata every surface form shares, independent of its presentation. */
export interface SurfaceBase {
  /** Stable id (ordering, active selection, override/removal, per-instance `VIEW_STATE` key). */
  readonly id: string;
  /** Transloco key (or literal) for the surface title (its tab label + panel header). */
  readonly title: string;
  /** Icon name — resolved by the host icon registry (a plain string). */
  readonly icon?: string;
  /** Lower renders first among sibling surfaces in a dock (default 0). */
  readonly order?: number;
  /** The surface's own header actions, shown in the pane header while active (ex `View.actions`). */
  readonly actions?: readonly ViewAction[];
  /**
   * Declarative auth gating: the host hides/disables/placeholders the surface when the current
   * session does not meet the requirement. Presentation only — real enforcement is server-side. Omit for a
   * surface everyone sees.
   */
  readonly access?: AccessRequirement;
  /**
   * Opt in to **named saved instances**: the host shows a switcher so the user can save,
   * name, rename and delete several configurations of this surface, each with its own `VIEW_STATE` blob.
   */
  readonly instanceable?: boolean;
  /**
   * The **routable** capability — provide to let this surface hold the URL pane. A surface
   * with `routable` is reached by its `path`; one without is host-rendered workspace state only.
   */
  readonly routable?: SurfaceRoutable;
  /**
   * Retention when the surface is **hidden** — rendered by no pane of this window: a tab switch, a
   * minimised or closed pane, a collapsed sidebar, the closed compact drawer. The default is
   * the distribution's retention default (`provideShell({ retention })`), which itself
   * defaults to **destroy**: a hidden, clean surface is destroyed and rebuilt on return — state that
   * must survive belongs in `VIEW_STATE`. Declare `'always'` to keep the instance alive while hidden
   * (an expensive rebuild, a live connection); `'never'` to opt back into destruction when the
   * distribution flipped the default. The declaration wins over the distribution default. A retained
   * **`iframe` surface is hidden in place** rather than destroyed (no reload, no new Penpal
   * handshake) but is still rebuilt whenever it would have to *move* — a split, a drag into another
   * pane, a minimise — because moving an `<iframe>` element in the DOM reloads it. `container`
   * surfaces are always rebuilt.
   */
  readonly retain?: 'always' | 'never';
  /**
   * Auto-save on hiding: when an instance of this surface becomes hidden while its
   * {@link DirtySurface.surfaceDirty} reports unsaved changes, the host calls its
   * {@link DirtySurface.surfaceSave} fire-and-forget — the gesture stays instant. Safe by
   * construction: while the save is in flight the instance is still dirty and therefore still
   * alive; a failure keeps it dirty and surfaces as an error, never as silent loss. Only
   * meaningful for a surface whose component implements {@link DirtySurface} with a save.
   */
  readonly saveOn?: 'hide';
  /**
   * Whether a tab of this surface may be closed by the user — the × affordance, the `Delete` key and
   * the close entries of the tab menu. Defaults to `true`; declare `false` for the overview screen a
   * product wants to keep open while its other tabs come and go.
   *
   * It applies to **every** tab of this surface, so it fits a parameterless route like `dashboard`
   * and is almost always wrong for `doc/:id`, where it would make no document closable at all. The
   * user can still move such a tab, split it and drag it elsewhere; only closing is refused.
   */
  readonly closable?: boolean;
  /**
   * Whether the host insets this surface from its pane edges. Leave it out and the product decides:
   * the host insets nothing unless the distribution asked it to, with `padding` on `provideShell`.
   *
   * Declare it where this surface differs from the product's answer, in either direction. `true` for
   * the prose, forms and lists that read better with air around them; `false` for a surface that
   * **is** the content and owns its own edges — a viewer, a canvas, a map, an edge-to-edge table —
   * in a product that insets everything else. It travels with the surface, so it holds wherever the
   * user puts it: the URL pane, a split, a sidebar, a pop-out window.
   *
   * Only whether there is an inset is yours; how wide it is stays a styling question, so a product
   * that wants a different amount everywhere writes plain unlayered CSS rather than asking for a
   * token.
   */
  readonly padded?: boolean;
  /**
   * Which docks (region ids, e.g. `'primary'`/`'secondary'`, or `'content'`) this surface may be hosted in
   * — capabilities, not location: the *user* decides where a surface finally lands. The first
   * entry is the surface's **home** dock (where a non-routable surface first appears). Omit only for a
   * routable surface (its home is the content area); a non-routable surface **must** declare `docks` —
   * the host fails fast at registration otherwise. A non-routable surface with an **empty** `docks: []`
   * is a **container-only child**: it is never seeded into a panel and exists only to be
   * mounted inside a container's nested pane tree by id.
   */
  readonly docks?: readonly string[];
}

/**
 * The **one author contract**: a plugin contributes a `Surface` and declares *what it can do*
 * (routable · instanceable · which docks) rather than *where it lives* — the user decides placement.
 * This is the convergence of the two older contracts, {@link View} (a component docked in a Panel region)
 * and {@link ContentRoute} (a URL-addressed content view), which the host still uses internally as its
 * storage shapes. Register it with `ctx.registerSurface`.
 */
export type Surface = SurfaceBase & SurfacePresentation;
