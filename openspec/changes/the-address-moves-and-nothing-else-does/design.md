## Context

The content dock's pane tree draws two kinds of leaf. The leaf carrying the address gets the content
area, handed to the tree as a template and kept in a retained template keyed per dock, so the one
instance travels with the address. The content area has its own tab strip (facet and view tabs,
overflow, view actions, navigation on select), a floating toolbar for chromeless surfaces, the
`main` landmark, the unusable-workspace notice, a router outlet and two retained containers for
iframe and kept surfaces. Every other leaf gets a pane view, whose body is the secondary pane.

When the address moves from leaf A to leaf B:
- The retained template survives the move only when the path's retention mode is `move`, that is for
  a kept surface. Otherwise the whole content area, router outlet included, is discarded and rebuilt
  in B.
- B's pane view is destroyed and A gets a new one.
- A surface that is not kept (the default retention) was rendered by the router in A and is now
  rebuilt by A's new pane view. In B it was rendered by the pane view and is now rebuilt by the
  router.
- A kept surface survives, but its element is re-parented, and a press on it loses its click.

The secondary pane already draws iframe, kept, container and docked-view surfaces through the
retained-view stash, keyed `content:<leaf>|<path>`. It hands each surface a synthetic route built
once: parameters and sub-address are fixed at construction, and there is no query, no fragment and
no child route. The content area keys by the tab root and marks its synthetic route `urlDriven`.
Trusted surfaces read the address from the injected route or the router. The SDK says a trusted
surface reads its remainder from "its child route or the router".

## Goals / Non-Goals

**Goals:**
- Moving the address moves a pointer, the landmark and the strip's configuration, and nothing a
  surface is drawn in.
- One way to draw a surface, used by every pane.
- A surface reads its address live wherever it is.

**Non-Goals:**
- The pop-out window. It has its own outlet and page, and stays as it is.
- Panel and container pane trees. They have no address pane.
- Changing what a tab is, how tabs open, or how retention is declared.

## Decisions

**1. One leaf host, with a stable body.** Every leaf of every pane tree is drawn by the pane view. For
the leaf carrying the content address, the pane view shows the address pane's chrome (strip and
toolbars) in place of its own. The body, the element the surface is drawn in, is outside that switch
and never re-created by it. The landmark id `lw-main-content`, the router outlet for distribution
pages and the unusable-workspace notice are attached to the body of whichever leaf carries the
address. Rejected: keeping the content area as the address pane's host and moving its surface in
without re-parenting. Its router outlet is the renderer, and there is no way to hand a live component
from one outlet to another.

**2. The router renders placeholders for content.** Every registered content route, its access and
omitted placeholders, and the pending-deep-link placeholder map to the empty route stub. Guards
(`canMatch`, `canActivate`), data and children stay, so the address, its guards and its history
behave as before. Only routes the distribution owns render a real component, through one outlet in
the address pane's body. The secondary pane already draws the access, unavailable and pending cases
from the registry. Rejected: making distribution pages surfaces. That would change a published way to
add them for no gain in this change.

**3. A live surface route.** The synthetic route becomes a live object per (pane scope, tab root). Its
`snapshot` is re-created on every change, and `url`, `params`, `paramMap`, `queryParams`,
`queryParamMap`, `fragment` and `data` are replaying subjects. It has a live `firstChild` for the
sub-address or remainder. `data.urlDriven` says whether the pane carries the address; while it does,
query and fragment come from the router. Parameters are part of the key, so they never change for a
live route: different values are a different tab path, hence a new instance, as with the router
today. `routeConfig` stays `null`, the documented sign of a host-mounted surface. Rejected: handing
the router's real activated route to the surface in the address pane. A surface outlives the address
leaving its pane, and an injector cannot be swapped under a live component.

**4. Retention keys use the tab root.** The pane keys a surface by `tabRootOf(path)`, so a
sub-address change keeps the instance and reaches it through the live route. Docked views and
container children keep their keys.

**5. The address pane's strip becomes a configuration of the one strip.** The facet and view tabs,
overflow, view actions, navigation on select, the navigation picker and the duplicability guard on
split are what the content area adds today. They move into an address-pane chrome component that the
pane view shows for the address leaf. Its markup is the content area's strip and toolbars as they
are, so nothing a user sees changes. The view-tab overlay becomes the body's path: the body shows
`activeViewPath ?? leaf path`.

**6. Parking goes to the panes alone.** With the router rendering placeholders, the reuse strategy
parks nothing worth keeping. It is reduced to "never reuse across content addresses", and the
consumers of its parked handles (retention collection, unsaved work, tab closing, preview slot) read
the stash, which they already read for panes.

**Slices.** S1 (decisions 3 and 4, plus the secondary pane drawing what the router drew: a loading
state for lazy surfaces, and chromeless) changes nothing a user sees in the address pane. S2 (decision
5) extracts the chrome without moving it. S3 (decisions 1 and 2) is the switch and the fix. S4
(decision 6) removes what S3 left unused and moves the end-to-end selectors.

## Risks / Trade-offs

- [A trusted component that decides once, from `routeConfig === null`, to freeze its sub-address] →
  The live route makes the documented reads work; the testbed's surfaces that do this are changed to
  read the route, and the proposal names it as a behaviour change.
- [A second instance while S3 lands: the router's parked instance and the pane's] → S3 switches the
  router to placeholders in the same commit that makes every leaf a pane view, so there is no window
  in which both render.
- [The skip link loses its target while the landmark moves] → The id is an attribute binding on a
  stable element; the landmark moves without moving any node.
- [End-to-end selectors naming `lw-content-area` as a surface's host] → S4 moves them. S3 keeps the
  `lw-content-area` tag on the address pane's chrome, so toolbar selectors keep working.
- [The primary's minimized strip and maximize] → The pane view's minimized branch already covers any
  leaf. The address leaf takes it like others.
