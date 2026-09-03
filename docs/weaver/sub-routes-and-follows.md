# Sub-routes, the rest, and tabs that follow

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `routing` · `content-tabs`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A routable surface's address can go deeper than its tab root. This page declares level-2 sub-tabs
with `subRoutes`, hands everything below a prefix to one surface with `rest`, and keeps a tab pointing
at the current selection with `follows`. It closes with what `ctx.navigateContent` does to an
arrangement, and how a panel reads which content is focused.

## Nested sub-tabs: `subRoutes`

A route's own level-2 tabs should live *in the route* (shareable,
back/forward, restored on reload), not in local state. Declare them with `subRoutes` and they become real
path segments under the route's tab root:

```ts
ctx.registerSurface({ id: 'doc', title: 'doc.title', component: DocView,
  routable: { path: 'doc/:id', subRoutes: ['code', 'preview'] } });
// → doc/main · doc/main/code · doc/main/preview   (the bare root is a valid state — no forced redirect)
```

The route's `path` stays the **tab root** (one host tab per document); switching a sub-route stays in that
tab and **preserves the parent's state** (edits, scroll). The host synthesizes the child routes — your
*parent* component stays mounted, renders a `<router-outlet />` (the children are empty stubs), reads
the active sub from the URL and navigates to `doc/<id>/<sub>` to switch.

A sub-route is written in Angular syntax, so a segment may **carry a value**:

```ts
routable: { path: 'programs/:programId', subRoutes: ['structure/:structureId', 'flows/:flowId'] }
// → programs/205470/structure/9178
```

And the bare tab root is a **valid address**: there is no redirect to the first entry, because that
cannot work once the first entry carries a value. Decide for yourself what an empty sub shows — a grid,
a marked first entry, an overview. Reading a value out of a sub-route works like the sub itself: take it
off the URL under your tab root (the sample below does exactly that). That also keeps working when the
host mounts you off-router and hands you the sub as a string instead. If you only ever run on the
router, `inject(ActivatedRoute).firstChild?.paramMap` is the Angular-native alternative.

A complete minimal component:

```ts
// src/lib/views/doc-view.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-doc-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <nav class="flex gap-2">
      @for (tab of ['code', 'preview']; track tab) {
        <button type="button" class="lw-btn lw-btn--ghost" (click)="openSub(tab)">{{ tab }}</button>
      }
    </nav>
    @if (sub() === 'code') { <p>code body…</p> } @else { <p>preview body…</p> }
    <router-outlet />
  `,
})
export class DocView {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly tabRoot = 'doc/' + this.id;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  // active sub = whatever stands under the tab root; you pick what an empty one means
  protected readonly sub = computed(() => {
    const path = this.url().split(/[?#]/)[0].replace(/^\/+/, '');
    return path.startsWith(this.tabRoot + '/') ? path.slice(this.tabRoot.length + 1) : 'code';
  });

  protected openSub(sub: string): void {
    void this.router.navigateByUrl('/' + this.tabRoot + '/' + sub);
  }
}
```

This is standard Angular nesting — deeper params work the same way. One extra fact matters as soon
as panes come in. When the host mounts your component **off-router** (a split pane, a sidebar tab, a
pop-out window), there is no URL to read. The host instead hands you a synthetic route whose
`data['sub']` carries the active sub-segment, and navigating the global router from there would be
wrong. The next section shows the `hostMounted` branch that handles it.

## Sub-routes and pop-out windows

One thing to get right if your surface draws its own **sub-tabs**: switch them **locally when you are
host-mounted**, not by pushing an absolute URL onto the global router. Your surface can be mounted
where the global URL does not belong to it: a split pane, a sidebar, a pop-out. An absolute
`navigateByUrl('/doc/42/code')` from there hijacks the window. In a pop-out it drags the URL out of
the `/popout/` prefix, so a reload opens the full app.

The host tells you which case you are in: when it host-mounts you it supplies a **synthetic
`ActivatedRoute` whose `routeConfig` is `null`**. Branch on it — keep sub-tab state local off-router,
and only reflect it into the URL when you own it:

```ts
// Inside your route component (tabRoot = the route's path with params resolved, e.g. 'doc/' + id):
private readonly route = inject(ActivatedRoute);
// Host-mounted (split/sidebar/pop-out) = the host built a synthetic route: routeConfig is null,
// and data['sub'] carries the active sub-segment instead of the URL.
private readonly hostMounted = this.route.snapshot.routeConfig === null;
private readonly localSub = signal(String(this.route.snapshot.data['sub'] ?? '') || 'code');

openSub(sub: string): void {
  if (this.hostMounted) {
    this.localSub.set(sub);        // split / sidebar / pop-out — stay put
    return;
  }
  void this.router.navigateByUrl('/' + this.tabRoot + '/' + sub);   // URL pane — shareable, back/forward
}
```

Sub-tab-less views (the common case) need none of this.

## Owning everything below your prefix: `rest`

`subRoutes` is an enumeration: you name the level-2
segments and the host mounts one child per name. That stops working as soon as the segment carries a
value, and it says nothing about a third level. Declare `rest: true` instead and the deal changes: the
**longest registered prefix wins**, and whatever no more specific surface claims is handed to you as
**the rest** — verbatim, query string included.

```ts
ctx.registerSurface({ id: 'programs', title: 'programs.title', iframe: '/programs/view.html',
  routable: { path: 'cedents/:cedentId/programs', rest: true } });
// cedents/US003950/programs/205470/pricing?t=886320
//   → this surface, rest: "205470/pricing?t=886320"
```

Without the flag a deeper address matches no route at all and the navigation fails, so this is what
makes domain-first, deep addresses reachable. Three consequences worth knowing:

- **Your prefix stays the tab root**, so the whole subtree is *one* tab and moving around inside it
  never rebuilds your surface. That is the trade: what you put in the rest is cheap, what you put in
  the pattern is a parameter change and may rebuild you. You choose where the boundary sits.
- **A sandboxed surface** reads `state.rest` from its `render` push and sets its own with the channel's
  `navigate` — both confined to the prefix, each change an ordinary history entry. A **trusted**
  component reads it the ordinary Angular way (its child `ActivatedRoute`, or the router) and navigates
  with the router. Same declaration, different target.
- **A prefix shorter than two segments** (`cedents` rather than `cedents/:id/programs`) owns most of the
  address space, which is exactly where "the channel is confined to your own territory" stops being a
  confinement. Declaring `rest` there additionally requires the `navigation` capability, and
  registration fails loudly without it.

There is no forced default: an address with an empty rest is a valid state and you decide what it
shows — a grid, a marked first entry, an overview. Selecting your tab from the strip returns to the
bare prefix rather than the deepest address you were at; that address is otherwise fully shareable and
survives reload and back/forward.

## Tabs that follow the selection: `follows`

Some tabs are not independent documents but
**facets of one choice**: pick a program on one, and the others should show that program. Declare
`follows: true` on such a surface and the host draws a **permanent facet tab** for it — labelled by the
surface's own `title`/`icon`, ordered by its `order` — and keeps that tab pointing at the current
selection. It knows the parameter values of the address it is on, because it knows which pattern
matched, and substitutes them **by name** into every following tab's pattern:

```ts
// on cedents/US003950/programs/205470/pricing
routable: { path: 'cedents/:cedentId/programs/:programId/treaties', follows: true }
// → the Treaties tab points at cedents/US003950/programs/205470/treaties
```

Where a value is unknown the address is truncated before it, which normally lands on a shorter address
another surface owns (`cedents`, if something is registered there). Where it lands nowhere, the facet
has nothing to point at yet and the host **leaves the tab out** rather than drawing a control that
cannot navigate — it reappears as soon as a selection exists.

Four things bound the feature deliberately:

- **Off by default.** The opposite is right for a tab showing one specific document: nobody wants an
  open quote rewritten because a parameter changed elsewhere — a tab opened by visiting keeps the
  address it was opened with.
- **A copy that leaves the pane carrying the browser address freezes.** Split a facet into another
  pane or pop it out and it keeps the address it had — which is how you park one program beside another.
- **A shared parameter name must mean the same thing.** Two following surfaces may only use the same
  name when the pattern *before* it is identical. Otherwise the host would fill one surface's address
  with the other's value, so it refuses that one registration with a message. Surfaces that do not
  follow are never compared, so ordinary document routes like `ask/:id` and `doc/:id` are untouched.

Part of the mapping is domain knowledge the platform cannot have. A distribution supplies it with
[`provideTabAddressResolver`](../distribution/content-routing.md#following-tabs), and the platform's
substitution stays the default for every tab that resolver passes on.

## Switching arrangements

`ctx.navigateContent(path)` just navigates — every open tab stays where it
is, and a target another pane already holds is reached there rather than copied into the current one. Whole-arrangement switching (a different set of tabs, panes and sidebar views) is the user's
**workspace** mechanism, not a navigation trick; a distribution ships ready-made arrangements with
`provideWorkspaces`. The component **instances** behind hidden tabs follow the retention rule:
destroyed while hidden unless the surface declares `retain: 'always'`; state that must survive belongs
in `VIEW_STATE`. Switching workspace hides rather than ends what the outgoing arrangement was
keeping. So a surface that declares `retain: 'always'`, an isolated one included, channel and all,
is found alive when its workspace is chosen again.

## Reading which content is focused: `ctx.activeContent`

A panel that reacts to the focused tab
(an inspector, a details view) reads the signal-shaped `ctx.activeContent()` (also `navigation`):
`{ surfaceId, path, params } | null`, with `params` extracted against your route pattern
(`ask/:id` on `ask/abc` → `{ id: 'abc' }`). Read this instead of injecting the host's router and
regex-parsing URLs — it stays stable across host URL-shape changes. Trusted rung only (a sandboxed
surface already receives its own state over the surface channel).

## Where next

- [Containers: a workspace in a tab](containers.md): children with a `segment`, the other way an address goes deeper.
- [Content-area routing](../distribution/content-routing.md#following-tabs): the distribution's side of following tabs.
- [Routing](../reference/routing.md): the router-shaped view, and the two places a surface is mounted off-router.
