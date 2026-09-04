# Routing — one router, and it is the one you know

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `routing` · `content-tabs` · `panes` · `surface-retention`.
> Where this page and a specification disagree, the specification is right, and that is a defect in
> this page: change the behaviour there, then explain it here.

A LoomWeaver application has exactly one router, and it is Angular's. `provideShellRouter()` calls
`provideRouter()` for you; the surfaces plugins contribute become ordinary `Route` objects in that
router's configuration; your component is mounted by it and injects a real `ActivatedRoute`. There is
no second routing system beside the one you already use.

One thing is genuinely different, and it is a single thing: **you do not hand-write a `Routes` array
for the content area**, because those addresses belong to plugins that register at runtime. Every
step after that is Angular.

This page is the router-shaped view of the workbench. The surface declarations themselves are in
[The content area: routes and tabs](../weaver/content-area.md), the distribution's side in
[Content-area routing](../distribution/content-routing.md), and what the address means in a workbench
with several panes is on [The address](../concepts/the-address.md).

## What you already know, and where it lands

| Angular | Here |
| --- | --- |
| `routerLink`, `router.navigate`, `navigateByUrl` | work as they do anywhere: the address resolves and the workbench opens or refines the tab that holds it |
| `ActivatedRoute` and `paramMap` | work; a surface at `doc/:id` reads `id` the ordinary way |
| a query string and a fragment | work, and are not part of a tab's identity, so `doc/7?view=raw` stays the tab that `doc/7` is |
| `<router-outlet>` inside your own component | works, for the sub-routes you declared |
| back, forward, reload and a pasted link | work, and are the reason the content area is addressed at all |
| `provideRouter(routes)` | `provideShellRouter(routes)` instead, once, in the distribution |
| a `Routes` array for your content | you write none: a surface declares `routable: { path }` |
| a `canActivate` of your own on contributed content | not attachable; declare `access` and the host gates it for you |
| resolvers and live parameter streams | fine, except on a **retained** surface (below) |

## Where a route comes from

A weaver contributes a surface and says it is addressable:

```ts
ctx.registerSurface({
  id: 'doc',
  title: 'doc.title',
  component: DocView,
  routable: { path: 'doc/:id' },
});
```

The host collects every such declaration and installs them in the router once the plugins have
activated. That is the whole reason `provideShellRouter()` exists and why it bundles
`withDisabledInitialNavigation()`: the first navigation has to wait until the routes it might need
are there. A deep link that arrives before its plugin has registered is remembered and resolved when
the content appears, and abandoned if the user navigates somewhere else in the meantime.

The consequence for you is small but worth stating plainly: at the moment your distribution starts,
`router.config` does not yet contain the content routes. Do not read it, and do not try to build one
yourself.

## Navigating

Inside your own surface, a link is a link:

```html
<a [routerLink]="['/doc', doc.id]">{{ doc.name }}</a>
```

That opens the tab, is a real anchor with a real URL for middle-click and "copy link address", and
costs no capability, because it is not a `ctx` call.

It also reaches the content **where it already is**: if the user parked that surface in a split pane,
the link lands there rather than opening a second copy beside what they were looking at, and inside a
pop-out window it is refused with an explanation instead of navigating the window away from the one
surface it exists to show. That is the workbench's behaviour for every navigation, whoever started
it — a link, a programmatic `router.navigate`, a command, browser history — so there is no rule here
to remember and no wrong way to navigate.

`ctx.navigateContent(path)` performs the same navigation, and it exists for reasons that are not
behavioural: it is gated by the `navigation` capability, so a distribution can refuse it; it is the
form a **sandboxed** plugin has, which cannot reach the router at all because it runs in another
document; and it is the one that reports back whether the navigation happened. Use it from a plugin
that may be sandboxed and from chrome-level code that wants that answer. Inside your own surface, use
`routerLink`.

`ctx.openContentTab({ path, title })` is the third one, and it is not navigation with a nicer name:
it is how you give a tab a title the URL does not carry (a document name), and how you attach an
`onClose`. Both need the `navigation` capability. The complete set, including pinning, preview tabs
and closing, is in [host services](../distribution-api/index.md).

## Sub-routes are child routes

`subRoutes` declares the level-2 segments a surface owns, and they become real child routes under it:

```ts
routable: { path: 'doc/:id', subRoutes: ['code', 'preview'] }
```

Your component renders them through an ordinary `<router-outlet>`, and moving between them stays
inside one tab and does not rebuild you. The bare address stays valid: the host never redirects
`doc/7` to `doc/7/code`, and what the tab root shows is your decision.

## Mounting an app that brings its own routes

Where the segments are not a fixed list — a value in the segment, a third level, an existing routing
tree of your own that you want to keep — declare `rest: true` instead and the surface owns everything
below its path, handed over verbatim including the query string. That is the seam for mounting a
sub-application that brings its own routes. It is written up with its trade-offs in
[Sub-routes, the rest, and tabs that follow](../weaver/sub-routes-and-follows.md#owning-everything-below-your-prefix-rest).
The one rule to carry here: a claim shorter than two segments also needs the `navigation` capability,
because at that width the claim stops being a boundary.

## Routes of your own that are not content

A distribution may have addresses that are not workbench content at all: a callback URL an identity
provider redirects to, a print view, a health page. Pass them to `provideShellRouter`:

```ts
provideShellRouter([
  { path: 'auth/callback', component: AuthCallback },
]);
```

They are ordinary routes with no tab, no strip and no pane. For a full-area screen that *is*
workbench content but must not become a tab — a login page, an onboarding flow — declare the surface
`routable: { path: 'login', chromeless: true }` instead and keep it inside the plugin that owns it.

## The two places the router is not the whole story

**A retained surface is mounted off-router.** A surface that declares `retain: 'always'` is kept
alive while hidden, and to make that work the host mounts it in every pane itself rather than letting
the router build it. It still receives an `ActivatedRoute`, but a fabricated one: route parameters
are there, and nothing else is, so never combine `retain` with `subRoutes` (the host warns in
development). What the fabricated route lacks and why is on
[Retention and unsaved work](../concepts/retention-and-unsaved-work.md#a-kept-surface-lives-off-the-router).

**A pop-out window shows one surface and has no address to drive.** Your component is host-mounted
there, which you can see: its `ActivatedRoute` has a `routeConfig` of `null`. Branch on that and keep
sub-tab state local instead of pushing it onto the global router, or the same component will misbehave
in exactly one of its two homes. The pattern is in
[Sub-routes, the rest, and tabs that follow](../weaver/sub-routes-and-follows.md#sub-routes-and-pop-out-windows).
