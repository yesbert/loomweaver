# The content area: routes and tabs

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `content-tabs` · `routing` · `panes`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The content area is where a routable surface opens as a tab. This page declares one, opens and
refines tabs from code, and explains preview, pinned and unclosable tabs, the panes the user splits
them into, and the bridge that lets a component call `ctx`.

## Routable surfaces

The center (a `content` region) is **URL-addressed**, not a panel: a surface reaches it by declaring
`routable`, which makes it a shareable deep-link with browser back/forward. The distribution must set up the
router with [`provideShellRouter()`](../distribution/content-routing.md).

It is the Angular router underneath, so `routerLink`, `ActivatedRoute` and `<router-outlet>` behave
as they do anywhere. [Routing](../reference/routing.md) is the router-shaped view of this page: what
carries over unchanged, and the two places a surface is mounted off-router.

```ts
// a routable surface opens as a tab when visited — nothing else to declare
ctx.registerSurface({ id: 'reports', title: 'reports.title', component: ReportsView,
  routable: { path: 'reports' } });
ctx.registerSurface({ id: 'doc', title: 'doc.title', component: DocView,
  routable: { path: 'doc/:id' } });
// chromeless: a full-area screen that never becomes a tab (what a login or onboarding page needs)
ctx.registerSurface({ id: 'login', title: 'login.title', component: LoginView,
  routable: { path: 'login', chromeless: true } });
```

The host draws a tab strip **per pane**, and every pane is a tab group the user can split and move. The
strip shows **everything that pane holds**, and the rule is one sentence: a pane shows a strip when it
holds tabs; a **chromeless** surface shows none. Visiting any routable surface — by click, deep-link
or browser history — opens (or refines) its tab; a chromeless surface owns the whole content area
while active and is excluded from splits, drags and the new-tab picker. A permanent arrangement of
tabs is a **workspace**, declared by the distribution with
[`provideWorkspaces`](../distribution/workspaces.md#developer-defined-workspaces), where a declared
tab can be unclosable. The surface itself declares no arrangement.

A surface can also refuse closing on its own with **`closable: false`** — the overview screen a
product keeps open while its other tabs come and go. It removes the ×, the `Delete` key and the
menu's close entries; moving, splitting and dragging the tab still work. It applies to **every** tab
of that surface, so it fits a parameterless route like `dashboard` and is almost always wrong for
`doc/:id`, where it would make no document closable at all.

```ts
ctx.registerSurface({ id: 'dashboard', title: 'dashboard.title', component: DashboardView,
  routable: { path: 'dashboard' }, closable: false });
```

A route component reads its params the normal Angular way (`inject(ActivatedRoute)`), so `doc/:id`
resolves `id` itself. Don't draw your own top-level tab bar — open into the host strip; a **nested**
sub-tab bar *inside* one document's body (Edit | Preview) is fine, it's a level down.

## Reaching the pane edges

The host insets nothing. A surface fills the pane it is mounted in, and what stands between its
content and the pane edge is whatever the surface itself draws.

Most products want air around their prose, forms and lists, and say so once when they compose:

```ts
provideShell({ padding: 'inset' })
```

A surface that differs from its product declares **`padded`**, in either direction. `false` where
the product insets everything and this surface **is** the content — a document viewer, a canvas, a
map, an edge-to-edge table:

```ts
ctx.registerSurface({ id: 'viewer', title: 'viewer.title', component: ViewerView,
  routable: { path: 'doc/:id' }, padded: false });
```

And `true` where the product insets nothing but this one surface reads better with air:

```ts
ctx.registerSurface({ id: 'settings', title: 'settings.title', component: SettingsView,
  routable: { path: 'settings' }, padded: true });
```

It travels with the surface, so it holds wherever the user puts it — the URL pane, a split, a
sidebar, a pop-out window. Only whether there is an inset is yours; how wide it is stays a styling
question, so a product that wants a different amount everywhere writes plain unlayered CSS.

## Opening tabs from code

Open a tab yourself with:

```ts
ctx.openContentTab({
  path: `doc/${doc.id}`,
  title: doc.name,          // a document name is a literal, not a Transloco key…
  titleIsLiteral: true,     // …so mark it literal: the host shows it verbatim, no i18n lookup, no warning
  onClose: () => this.forget(doc.id), // runs once when THIS tab is closed — free per-tab state
});
ctx.closeContentTab(`doc/${doc.id}`); // the host activates a neighbour
```

`registerSurface` needs the `contributions` capability. `navigateContent`, `openContentTab`,
`keepContentTab`, `pinContentTab`, `unpinContentTab` and `closeContentTab` need `navigation`.

Your plugin does not decide, and does not need to know, which workspace the tab lands in. Where the
product has given that address to a workspace of its own, the host activates that workspace first and
opens the tab there. The call returns straight away either way; the tab appears once the switch has
happened.

Docked (non-routable) surfaces have their own opener: `ctx.revealSurface(id)` activates the
surface's tab **wherever the user has placed it**, its sidebar panel (expanding a collapsed one) or a
content pane. So a palette command like "Focus Library" works no matter where the view lives. It is a
no-op for an unknown id, and container-only children (`docks: []`) stay inside their container.
Routable surfaces are reached with `navigateContent` instead. Requires `navigation`.

A dynamic tab title is usually a runtime **literal** (a document name, an entity label). Set
`titleIsLiteral: true` so the host renders it verbatim instead of treating it as a translation key —
otherwise the value is looked up and a benign "missing translation" warning is logged in dev. Omit it
(default `false`) when the title genuinely is a Transloco key. Pass `onClose` to run teardown exactly
once when that tab is closed (the host's ×, or `closeContentTab`) — the place to free per-tab state,
cancel in-flight work or persist a draft. (In-process weavers only; a sandboxed plugin's `onClose`
does not cross the RPC boundary.)

## Preview tabs

For file-browsing UX, open with `preview: true`: the host
uses a **single reused, italic** slot per pane — the next `preview` open of a *different* path replaces
it in place, so browsing many items doesn't pile up tabs. Promote it to a permanent tab **explicitly**:
call `ctx.keepContentTab(path)` (e.g. on your list's double-click or when the content is edited).
The host's own double-click cycle on the tab is the distribution's to switch off, so do not build
your flow on it. Re-opening an already-open tab just refines it (title/sub-route) and **keeps** its
preview state — so a view can safely call `openContentTab` on mount to set the real title without
accidentally promoting itself:

```ts
// src/lib/views/library-view.ts — inside the component
onSingleClick(doc) { ctx.openContentTab({ path: `doc/${doc.id}`, title: doc.name, titleIsLiteral: true, preview: true }); }
onDoubleClick(doc) { ctx.keepContentTab(`doc/${doc.id}`); }
```

A distribution can turn the whole behaviour off (`provideShellFeatures({ content: { preview: false } })`),
in which case `preview` is ignored and every open is permanent — so treat preview as a hint, not a
guarantee.

## Pinned tabs

The permanence ladder has a top rung: `ctx.pinContentTab(path)` / `ctx.unpinContentTab(path)`
pin a tab to the **front** of its strip and guard it against accidental close (its close control becomes an
unpin control). Pinning also promotes a preview tab. It's a post-hoc action (not an open-time flag) and
survives a re-open. The host also has a double-click cycle on the tab (preview → keep → pin → unpin),
**on by default** and switchable off by the distribution.

## A deep link opens its tab too

Navigating to a dynamic route **without** opening it (a shared deep-link, browser history,
`navigateContent`) **auto-opens** its tab too — so shared links land with a proper tab, not just bare
content. If the tab is already open in **another pane** — a split, or a pane the user's workspace
declares — nothing is duplicated: that pane takes the address and activates the tab it already holds.
Give the route a default `title`/`icon` for that auto-opened tab; you can still refine it via
`openContentTab` (e.g. the real document name):

```ts
// src/lib/plugin/notes.plugin.ts — in activate(ctx)
ctx.registerSurface({ id: 'doc', title: 'doc.title', icon: 'document', component: DocView,
  routable: { path: 'doc/:id', title: 'Document', titleIsLiteral: true } });
```

## Calling `ctx` from a component

`ctx` is handed to `activate(ctx)`, but you usually open a
document from a click *inside* a component (a tree/list) that holds no `ctx`. Bridge it with a tiny
service the plugin fills at activation and the component imports:

```ts
import { PluginContext } from '@loomweaver/plugin-sdk';

class NotesNav {
  private ctx?: Pick<PluginContext, 'openContentTab'>;
  bind(ctx: Pick<PluginContext, 'openContentTab'>): void { this.ctx = ctx; }
  unbind(): void { this.ctx = undefined; }
  open(doc: { id: string; name: string }): void {
    this.ctx?.openContentTab({ path: `doc/${doc.id}`, title: doc.name, titleIsLiteral: true });
  }
}
export const notesNav = new NotesNav();
// in activate(ctx):   notesNav.bind(ctx);
// in deactivate():    notesNav.unbind();
// the list component imports { notesNav } and calls notesNav.open(doc) in its click handler
```

Use a **module-level facade** (a plain exported instance), not an Angular `@Injectable` filled via
`inject()` inside `activate()`. Activation is *not guaranteed* to run in Angular's injection context.
It re-runs, for instance, when the user re-enables your plugin at runtime. An `inject()` there can
therefore throw. The testbed weaver's `testbedContent` bridge is this exact pattern.

A trusted in-process component may also inject Angular's `Router` directly, but the bridge keeps the
weaver on the public `ctx` surface, the same path a sandboxed plugin gets later.

## Panes and tab groups

The tabs you open aren't confined to one strip. Every pane is
a **tab group** with its own strip, and the user can rearrange them — **without any extra API from you**:

- **Drag a tab to a pane edge** to split the area, taking that tab into a new group; **drag it onto
  another group's strip** to move it there. Dropping the last tab out of a group collapses it. A tab's
  context menu offers **Split right / Split down** as the keyboard/touch equivalent.
- A pane **holding no tabs** — the content area before anything is open — takes the whole drop instead
  of offering edges, so a dragged tab fills it rather than splitting it against an empty half. The
  highlight while dragging spans the whole pane, which is exactly what the drop will do.
- Dragging **moves** a tab (never copies) — the source group loses it. This holds for every tab,
  including parameterised (`doc/:id`) and sandboxed iframe routes: exactly one pane is the **URL pane**
  (it drives the deep link and back/forward), and moving a routed tab hands that role to its new pane.
- The **sidebars are the same tab groups**, just shown as **icon tabs** — a view can be dragged into the
  centre (it becomes a titled tab beside your documents) and a document into a sidebar, and back.

None of this changes your contract: you keep contributing routes and views the same way; the host
provides the pane/tab behaviour on top. Reload restores the whole arrangement.

## Where next

- [Sub-routes, the rest, and tabs that follow](sub-routes-and-follows.md): addresses below the tab root, and sub-tabs off-router.
- [Containers: a workspace in a tab](containers.md): a routable surface that holds a pane tree of its own.
- [Surfaces and panes](../concepts/surfaces-and-panes.md): why a pane is a tab group and a surface goes anywhere.
