# Layout: regions and docks

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`provideLayout` declares which **regions** sit where in the border topology. A region has a `type`
(its anatomy) and a `dock` (where it sits):

Collapsing, resizing and hiding views in the sidebars from your own code is `SidebarService` in the
[host services](../reference/distribution/sidebars.md).

- **Docks:** `top` · `bottom` · `left` · `right` · `center`.
- **Region types:**
  - `bar` — a thin strip of items in `start | center | end` slots (top bar, status bar, sidebar footer).
  - `rail` — the activity bar: icon triggers for commands.
  - `panel` — a sidebar surface that hosts views (the host auto-tabs multiple views).
  - `content` — the main content area (docks `center`). **URL-addressed** (routes), not views.

A weaver's `registerSurface({ docks: ['primary'] })` / `registerRailItem({ rail: 'activity' })` /
`registerBarItem({ bar: 'status-bar' })` target these region ids. Left and right are symmetric — see
[shell anatomy](../reference/shell-anatomy.md) for the full vocabulary.

> **Non-routable surfaces render only in `panel` regions.** A surface's home dock (`docks[0]`) may name
> any region id, but one docked into a `content` (or `bar`/`rail`) region is a silent no-op (dev-mode
> warns). The content area is **routed** — a weaver fills it with a surface that declares
> `routable: { path }` (see below).

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../reference/distribution/index.md): everything your own code can do once the product runs.
