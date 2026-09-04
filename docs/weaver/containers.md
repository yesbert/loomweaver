# Containers: a workspace in a tab

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `containers` · `routing`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A container is a surface that holds an arrangement of child surfaces: a small workbench for one item, opened, moved and closed as a unit. This page declares one, gives it a child that stands for one item, and lets its children carry addresses.

## Container surfaces (workspace-in-a-tab)

A **container** surface does not render one view. Instead it renders a host-managed **nested pane
tree** of child surfaces _inside its own content tab_. The tree has the same drag/split/tab mechanics
as the top level, one level nested and scoped to that tab. Use it for a "one X = one tab, with inner panes" layout (e.g. a run/sim
tab holding its feed, graph and details side by side). A container is always `routable`: its tab holds
its own `:id`, so several open in parallel and each is deep-linkable. Its children are non-routable
surfaces declared with **`docks: []`**, "child-only": never seeded into a sidebar, mounted only inside
a container by id. The host draws the tree; you only declare which children it offers and which load
first.

```ts
ctx.registerSurface({
  id: 'sim', title: 'sim.title',
  routable: { path: 'runs/:id' },
  container: { children: ['sim.feed', 'sim.graph', 'sim.details'], initial: ['sim.feed', 'sim.graph'] },
});
ctx.registerSurface({ id: 'sim.feed',  title: 'sim.feed',  docks: [], component: FeedView });
ctx.registerSurface({ id: 'sim.graph', title: 'sim.graph', docks: [], component: GraphView });
ctx.registerSurface({ id: 'sim.details', title: 'sim.details', docks: [], component: DetailsView });
```

### Declare how it opens, not just what it holds

`initial` also takes an **arrangement**, in the same grammar a distribution uses for a workspace: an
area either holds `tabs`, splits into `rows` (top to bottom) or splits into `columns` (left to right),
with an optional `size` share. A tab is a child surface id, or the object form when you want to fix or
preselect it:

```ts
container: {
  children: ['sim.graph', 'sim.feed', 'sim.details', 'sim.monitor'],
  initial: {
    columns: [
      { size: 60, tabs: ['sim.graph'] },
      { size: 40, rows: [
        { size: 65, tabs: ['sim.feed', { surface: 'sim.details', active: true }] },
        { size: 35, tabs: [{ surface: 'sim.monitor', closable: false }] },
      ]},
    ],
  },
}
```

Declare this whenever your container's path carries an `:id`. Its inner tree is kept **per instance**,
so an arrangement a user builds by hand belongs to that one run and is gone when the tab closes. A
sensible default can only come from your declaration. The plain list stays valid and means one tabs
area.

The baseline applies whenever a container tab is opened **fresh**; while it stays open the user's own
arrangement wins, across reloads. Closing the tab and opening it again is therefore also how a user
gets your arrangement back.

Two rules worth knowing before you debug something odd. A tab naming a child you did **not** list in
`children` is dropped with a developer warning, as is a malformed area. The container degrades to
whatever still makes sense rather than refusing to appear, so check the console when the layout is not
what you wrote. And a child the current user may **not** see still takes its place in the layout and
shows the host's access placeholder; the arrangement does not rearrange itself per role, and it cannot
collapse just because a session arrived late.

Each child receives the **container's route params**: read the `:id` off Angular's `ActivatedRoute`
(`route.snapshot.paramMap.get('id')`), the same idiom as a routable surface. So a child is contextualised
by its parent tab alone; there is **no global "active X"**. The inner tree is workspace state, not URL:
each open container tab keeps its own inner layout, it travels with the tab, and it survives reload
(persisted per window). The inner "new tab" picker offers only your declared `children` (access-gated),
and a popped-out container carries its whole inner tree.

`loomweaver weaver --id sim --container` scaffolds this whole shape: the container, two children with
`docks: []`, and child components that already read the `:id`. So you start from a running example
rather than from this page.

## A child that stands for one item

The children above are facets of one subject: a feed, a graph, a details panel, one of each. A child
that is a **list** needs its sibling to stand for one _item_ of that list, several at a time. For
that the child needs an address of its own. Declare a `segment`:

```ts
container: {
  children: [
    { surface: 'sim.list', segment: 'list' },
    { surface: 'sim.item', segment: 'item/:itemId' },
    'sim.details',
  ],
  initial: {
    columns: [
      { size: 34, tabs: [{ surface: 'sim.list', closable: false }] },
      { size: 66, tabs: [] },
    ],
  },
}
```

Two things in there are new. The `{ tabs: [] }` pane is declared **empty on purpose**: it says where
opened children land, and unlike every other pane it stays when its last tab closes. And a segment may
carry values, which is what lets one child surface stand for several open items.

The list opens them through the handle every child inside a container receives:

```ts
import { CONTAINER_HANDLE } from '@loomweaver/plugin-sdk';

const container = inject(CONTAINER_HANDLE);
container?.open(`item/${item.id}`, { title: item.name, titleIsLiteral: true });
```

`CONTAINER_HANDLE` resolves to `null` outside a container, so a surface that appears in both places
checks before it calls. The optional second argument is a `ContainerTabLabel` (`title`,
`titleIsLiteral`, `icon`). Give the tab one, or every open item reads as the child surface's own
title. Opening the same
address twice focuses the tab that is already there rather than adding a second one, so a list may
call `open` on every click without checking.

It is a call rather than a navigation on purpose, and that is worth understanding before you reach for
the router instead. A container tab may sit in a split pane or in a pop-out, where it holds no browser
address at all, and a list whose rows only worked in the main window would not be much of a list.

While the container tab _does_ hold the address, the URL names the focused child
(`/sim/abc123/item/42`), so such a link is shareable. A deep link opens what it names: into that
same declared pane, and into an existing tab when one is already open. Elsewhere the container keeps
its own idea of what is focused and the address simply does not express it.

A child whose segment carries a value cannot appear in `initial` or in the inner picker: neither knows
which value to use. That is what the declared-empty pane is for. A child with no segment needs
none of this: it is reachable from the picker, exists once and has no address.

A surface that draws its own sub-tabs must switch them locally wherever the host mounts it off-router,
a pop-out included; [Sub-routes and pop-out windows](sub-routes-and-follows.md#sub-routes-and-pop-out-windows) shows the branch.

## Where next

- [The content area](content-area.md): the routable surface a container is, and the tabs it opens into.
- [Sub-routes, the rest, and tabs that follow](sub-routes-and-follows.md): addresses below a tab root, and sub-tabs when the host mounts you off-router.
- [The address](../concepts/the-address.md): why one pane carries it and what inside a container has none.
