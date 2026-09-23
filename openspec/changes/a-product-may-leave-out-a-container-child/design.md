## Context

See proposal.md for the motivation. A container is a routable surface whose `ContainerSpec` lists
child surfaces (`children`) and an initial arrangement (`initial`). Its inner arrangement is a pane
tree kept in `PaneTreeService` under the dock `container@<path>`, built once from `initial`
(`ensureContainer`) and persisted per dock; stored trees are not checked against the registry. A
child's tab path is `view:<id>` or `<containerPath>/<segment>`. The address follows the focused child
(`leadUrl`) and a child's segment in the address focuses it (`followUrl` → `openContainerChild`);
every segment is also a router child route, so an address naming any child still matches.

A child the session does not qualify for keeps its place because the layout never filters by access;
only the pane picker (`containerChildTargets`) does, and the pane body draws `<lw-auth-required>`. The
strip draws `stripTabs` from the leaf, keyboard walking is DOM-driven over the drawn tabs
(`RovingTabs`), and the pane body shows the leaf's active tab with no filter. Closing in bulk walks the
leaf's tabs (`tab-closing.service`). `retitleSurface` and `updateSurfaceAction` are the model for a
live change a plugin makes to something it registered; a change of the registry's surfaces
recomputes content routes and resets the router configuration, so a new live state must not ride on
the surface entries.

## Goals / Non-Goals

**Goals:**
- A child left out is absent from everything the person sees and reaches in every container listing
  it, and returns in its place.
- The arrangement is never rewritten for it, so nothing is lost and nothing needs repairing.

**Non-Goals:**
- Leaving out per open container (per item the container shows). The need raised is per child;
  per-container can follow with the same drawing rules if asked.
- Leaving out a tab anywhere else (workspace tabs, sub-route tabs). The owner scoped this change to
  containers.
- Reopening a child the person closed. Bringing a child back shows it where it is; a child the
  person closed is not in the arrangement to be shown.

## Decisions

**A live call on the plugin context: `ctx.setChildShown(childSurfaceId, shown)`.** It sits beside
`retitleSurface` and `updateSurfaceAction`: the same capability (`contributions`), an unknown id or an
id that is not a container's child changes nothing and is reported in development, and it crosses the
sandbox RPC with a string and a boolean. A child is shown unless left out.

*Alternatives considered:*
- **An `access` mode that removes instead of explaining**: ties the decision to roles, which the owner
  ruled out, and cannot follow a setting or a licence.
- **A `shown` signal or predicate on the child entry**: does not cross to an isolated plugin, and a
  change to the declaration would recompute the routes.
- **Removing the child's tab from the arrangement**: loses its place and the person's arrangement, and
  needs a way to put it back that the arrangement does not remember.

**The arrangement stays; what is drawn is filtered.** A small store (a signal of left-out surface
ids) is read wherever the container's panes are drawn or reached:

- *The drawn tree.* A pure function prunes, from the tree the container pane host draws, every leaf
  whose tabs are all left out, unless the leaf was declared empty, and collapses a split left with one
  side. Pane ids are unchanged, so everything that addresses a pane by id still works; the stored tree
  is untouched.
- *The strip, the keyboard and the pane body.* The same function drops the tabs of left-out children
  from every drawn leaf, so the strip, keyboard walking and the pane body read the drawn leaf and need
  no filter of their own. Where the leaf's active tab is left out, the drawn leaf names its first
  shown tab as active; the stored active tab stays, so bringing the child back restores it.
- *Pickers, closing and dropping.* `containerChildTargets` skips left-out children, and every close
  that walks a pane's tabs sees only the shown ones. Closing a pane hands a left-out child to the pane
  beside it, as it does an unclosable tab. A tab dropped into a strip lands before the shown
  tab it was dropped on, so a left-out tab in the stored list does not shift it.
- *Focus and address.* Where the container's focused child is left out, the container focuses the
  first shown tab of its leaf, or the first drawn pane where that leaf is not drawn, and `leadUrl`
  names it. `followUrl` ignores an address naming a left-out child, so `leadUrl` rewrites it to the
  focused child: the one rewrite of the address on load that the containers capability allows.
- *Opening.* `ContainerHandle.open` of a left-out child does nothing and is reported in development;
  a product that wants it shown brings it back first.

**Leaving out wins over access.** The access placeholder is drawn by the pane body for a tab it
draws; a left-out tab is never drawn, so it never reaches the access check.

## Risks / Trade-offs

- [The drawn tree differs from the stored tree] → Only by leaves whose every tab is left out; pane ids
  stay stable, and the drop targets of a drag are the drawn panes, so a drop never lands in a hidden
  one.
- [A product leaves out every child] → The container shows nothing, like an area declared empty; the
  limit is stated in the requirement.
- [Initial bundle size] → The shell is close to its ceiling; the change adds a small store and a pure
  pruning function. A meant growth raises the ceiling.
