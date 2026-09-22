# Sub-routes, the rest, and tabs that follow

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `routing` · `content-tabs`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A routable surface's address can go deeper than its tab root. This page declares level-2 sub-tabs
with `subRoutes`, hands everything below a prefix to one surface with `rest`, and keeps a tab pointing
at the current selection with `follows`. It closes with what `ctx.navigateContent` does to an
arrangement, and how a sidebar surface reads which content is focused.

## Nested sub-tabs: `subRoutes`

A route's own level-2 tabs should live _in the route_ (shareable,
back/forward, restored on reload), not in local state. Declare them with `subRoutes` and they become real
path segments under the route's tab root:

```ts
ctx.registerSurface({ id: 'doc', title: 'doc.title', component: DocView,
  routable: { path: 'doc/:id', subRoutes: ['code', 'preview'] } });
// → doc/main · doc/main/code · doc/main/preview   (the bare root is a valid state — no forced redirect)
```

The route's `path` stays the **tab root** (one host tab per document); switching a sub-route stays in that
tab and **preserves the parent's state** (edits, scroll). Your component stays mounted and reads the
active sub from its route: `data['sub']` carries the segments below the tab root, and the child route
carries them as its URL. Both follow the address. To switch, it navigates to `doc/<id>/<sub>`.

A sub-route is written in Angular syntax, so a segment may **carry a value**:

```ts
routable: { path: 'programs/:programId', subRoutes: ['structure/:structureId', 'flows/:flowId'] }
// → programs/205470/structure/9178
```

And the bare tab root is a **valid address**: there is no redirect to the first entry, because that
cannot work once the first entry carries a value. Decide for yourself what an empty sub shows: a grid,
a marked first entry, an overview. Reading a value out of a sub-route works like the sub itself: take it
off `data['sub']`, or read `inject(ActivatedRoute).firstChild?.paramMap`, which carries the values of
the sub-route you declared.

A complete minimal component:

```ts
// src/lib/views/doc-view.ts
import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-doc-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex gap-2">
      @for (tab of ['code', 'preview']; track tab) {
        <button type="button" class="lw-btn lw-btn--ghost" (click)="openSub(tab)">{{ tab }}</button>
      }
    </nav>
    @if (sub() === 'code') { <p>code body…</p> } @else { <p>preview body…</p> }
  `,
})
export class DocView {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tabRoot = 'doc/' + (this.route.snapshot.paramMap.get('id') ?? '');
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  // whatever stands under the tab root; you pick what an empty one means
  protected readonly sub = linkedSignal(() => String(this.data()['sub'] ?? '') || 'code');

  protected openSub(sub: string): void {
    if (this.data()['urlDriven'] !== true) {
      this.sub.set(sub); // a pane without the address, a sidebar, a pop-out: stay put
      return;
    }
    void this.router.navigateByUrl('/' + this.tabRoot + '/' + sub); // the address: shareable
  }
}
```

The workbench draws your surface in whichever pane shows it, and the route it hands you is live. One
fact matters as soon as panes come in: only one of them carries the address. `data['urlDriven']` says
whether yours does, and it changes when the user moves the address. The next section says why the
branch in `openSub` matters.

## Sub-routes and pop-out windows

One thing to get right if your surface draws its own **sub-tabs**: switch them **locally while your
pane does not carry the address**, not by pushing an absolute URL onto the global router. Your surface
can be shown where the global URL does not belong to it: a split pane, a sidebar, a pop-out. An
absolute `navigateByUrl('/doc/42/code')` from there hijacks the window. In a pop-out it drags the URL
out of the `/popout/` prefix, so a reload opens the full app.

The route tells you which case you are in, live: `data['urlDriven']` is `true` while your pane carries
the address. The sample above branches on it. An older check still works, read once when the
component is created: `routeConfig` is `null` when it was created in a pane that did not carry the
address.

Sub-tab-less views (the common case) need none of this.

## Owning everything below your prefix: `rest`

`subRoutes` is an enumeration: you name the level-2
segments and the host mounts one child per name. That stops working as soon as the segment carries a
value, and it says nothing about a third level. Declare `rest: true` instead and the deal changes: the
**longest registered prefix wins**, and whatever no more specific surface claims is handed to you as
**the rest**, verbatim, query string included.

```ts
ctx.registerSurface({ id: 'programs', title: 'programs.title', iframe: '/programs/view.html',
  routable: { path: 'cedents/:cedentId/programs', rest: true } });
// cedents/US003950/programs/205470/pricing?t=886320
//   → this surface, rest: "205470/pricing?t=886320"
```

Without the flag a deeper address matches no route at all and the navigation fails, so this is what
makes domain-first, deep addresses reachable. Three consequences worth knowing:

- **Your prefix stays the tab root**, so the whole subtree is _one_ tab and moving around inside it
  never rebuilds your surface. That is the trade: what you put in the rest is cheap, what you put in
  the pattern is a parameter change and may rebuild you. You choose where the boundary sits.
- **A sandboxed surface** reads `state.rest` from its `render` push and sets its own with the channel's
  `navigate`. Both are confined to the prefix, and each change is an ordinary history entry. A **trusted**
  component reads it the ordinary Angular way (its child `ActivatedRoute`, or the router) and navigates
  with the router. Same declaration, different target.
- **A prefix shorter than two segments** (`cedents` rather than `cedents/:id/programs`) owns most of the
  address space, which is exactly where "the channel is confined to your own territory" stops being a
  confinement. Declaring `rest` there additionally requires the `navigation` capability, and
  registration fails loudly without it.

There is no forced default: an address with an empty rest is a valid state and you decide what it
shows: a grid, a marked first entry, an overview. Selecting your tab from the strip returns to the
bare prefix rather than the deepest address you were at; that address is otherwise fully shareable and
survives reload and back/forward.

## Tabs that follow the selection: `follows`

Some tabs are not independent documents but
**facets of one choice**: pick a program on one, and the others should show that program. Declare
`follows: true` on such a surface and the host draws a **permanent facet tab** for it, labelled by the
surface's own `title`/`icon` and ordered by its `order`. That tab keeps pointing at the current
selection. The host knows the parameter values of the address it is on, because it knows which pattern
matched, and substitutes them **by name** into every following tab's pattern:

```ts
// on cedents/US003950/programs/205470/pricing
routable: { path: 'cedents/:cedentId/programs/:programId/treaties', follows: true }
// → the Treaties tab points at cedents/US003950/programs/205470/treaties
```

Where a value is unknown the address is truncated before it, which normally lands on a shorter address
another surface owns (`cedents`, if something is registered there). Where it lands nowhere, the facet
has nothing to point at yet and the host **leaves the tab out** rather than drawing a control that
cannot navigate. The tab reappears as soon as a selection exists.

Four things bound the feature deliberately:

- **Off by default.** The opposite is right for a tab showing one specific document: nobody wants an
  open quote rewritten because a parameter changed elsewhere. A tab opened by visiting keeps the
  address it was opened with.
- **A copy that leaves the pane carrying the browser address freezes.** Split a facet into another
  pane or pop it out and it keeps the address it had, which is how you park one program beside another.
- **A shared parameter name must mean the same thing.** Two following surfaces may only use the same
  name when the pattern _before_ it is identical. Otherwise the host would fill one surface's address
  with the other's value, so it refuses that one registration with a message. Surfaces that do not
  follow are never compared, so ordinary document routes like `ask/:id` and `doc/:id` are untouched.

Part of the mapping is domain knowledge the platform cannot have. A distribution supplies it with
[`provideTabAddressResolver`](../distribution/content-routing.md#following-tabs), and the platform's
substitution stays the default for every tab that resolver passes on.

## Switching arrangements

`ctx.navigateContent(path)` just navigates: every open tab stays where it
is, and a target another pane already holds is reached there rather than copied into the current one. Whole-arrangement switching (a different set of tabs, panes and sidebar views) is the user's
**workspace** mechanism, not a navigation trick; a distribution ships ready-made arrangements with
`provideWorkspaces`. What happens to the instances behind the tabs a switch hides is the retention
rule, on [Retention and unsaved work](../concepts/retention-and-unsaved-work.md#hiding-is-not-closing).

## Reading which content is focused: `ctx.activeContent`

A sidebar surface that reacts to the focused tab
(an inspector, a details view) reads the signal-shaped `ctx.activeContent()` (also `navigation`):
`{ surfaceId, path, params } | null`, with `params` extracted against your route pattern
(`ask/:id` on `ask/abc` → `{ id: 'abc' }`). Read this instead of injecting the host's router and
regex-parsing URLs. It stays stable across host URL-shape changes. Trusted rung only (a sandboxed
surface already receives its own state over the surface channel).

## Asking whether the address shown is under yours: `ctx.isShowingUnder`

A [navigation tree](navigation-tree.md) marks where the user is. The question it asks is narrower than the whole address:
is the content shown at, or below, the address of this entry? `ctx.isShowingUnder('sales/quotes')`
answers it (also `navigation`). It is `true` for `sales/quotes` and for `sales/quotes/q-0006`.

The comparison breaks on segment boundaries, so `sales/quotesomething` is **not** under
`sales/quotes`. That is the rule you would otherwise write with `startsWith` and get wrong; the
symptom is quiet, an entry that never marks or one that marks its neighbour too. It reads
`activeContent`, so it is live in the same way and a template re-reads it, and it is trusted rung
only for the same reason.

## Renaming a surface while it is mounted: `ctx.retitleSurface`

A sidebar whose header should say where the user is needs the surface's title to change while it
runs. `ctx.retitleSurface('navigation.sales', 'product.area.customers')` replaces it under the id you
registered with (`contributions`). Everywhere the workbench names that surface follows: its tab, the
panel header, a picker that lists it.

The surface is **not** rebuilt, so what the user typed, scrolled or folded inside it survives. A
translation key still translates, and still follows a language change.

Only the title changes. The icon, the docks and everything else the declaration carries stay as
registered, and renaming an id you did not register does nothing.

## Where next

- [Containers: a workspace in a tab](containers.md): children with a `segment`, the other way an address goes deeper.
- [Content-area routing](../distribution/content-routing.md#following-tabs): the distribution's side of following tabs.
- [Routing](../reference/routing.md): the router-shaped view, and where the router is not the whole story.
