> **Status:** approved.

## Why

In a split content area, the first click into a pane that does not carry the address does nothing:
the press hands the address to that pane, the workbench moves the pane's surface into a different
host in the page before the button is released, and the browser drops the click. Where a surface is
not kept (the default), it is worse: the hand-over destroys it and builds it again, so a list loses
its scroll position, its filter and its selection on every click into its pane.

The contract already forbids both. *Exactly one pane carries the address* says focusing another pane
moves a pointer "rather than renaming or rebuilding anything", and *Navigating reaches the content
where it already is* says moving the address "SHALL NOT move, rebuild or reorder anything". The cause
is structural: the pane carrying the address is drawn by a different host (the content area, whose
router outlet renders the surface) from every other pane, and that host travels with the address.
NextPA reported the lost click as finding F-036.

## What Changes

- **Every pane draws its surface itself, in place.** The pane carrying the address is drawn like any
  other pane; only its tab strip and its toolbar differ. Moving the address moves a pointer and the
  page landmark, and nothing a surface is drawn in.
- **The router keeps the state and draws nothing of the content.** Content routes render an empty
  placeholder; guards, parameters and deep links behave as before. Pages a distribution owns (a start
  page, a sign-in page, a catch-all) keep being rendered by the router, in the pane carrying the
  address.
- **A surface reads its address live in every pane.** Values, sub-address, query and fragment reach it
  whichever pane it is shown in, and follow the address while its pane carries it. A sub-address
  change within its tab reaches it without rebuilding it; a change of its values rebuilds it, as
  today.
- **What a pane keeps is keyed by the tab, not by its sub-address**, so moving between sub-addresses
  never rebuilds a surface in any pane.
- The router's own parking of surface instances goes; keeping and discarding is the panes' alone.

It is delivered in four slices, each merged on its own:
- **S1**, a pane can draw everything the address pane can;
- **S2**, one tab strip model for both;
- **S3**, the switch;
- **S4**, removing what the switch leaves unused.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: *Exactly one pane carries the address, and the pointer moves, not the pane* states that
  nothing a surface is drawn in moves or is rebuilt when the address moves, and that an interaction
  begun in a pane completes.
- `routing`: a requirement is added that a surface reads its address, sub-address, query and fragment
  live in whichever pane it is shown.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/`: `content-area` shrinks to the address pane's
  chrome; `content-secondary-pane` draws every surface; `routing/content-router.ts` maps content
  routes to placeholders; `routing/content-reuse-strategy.ts` loses its parking;
  `routing/synthetic-route.ts` and `routing/surface-injector.ts` give way to a live route.
- `platform/libs/core/shell/src/lib/regions/pane/`: `pane-tree-view` draws a pane view for every leaf;
  `pane-view` carries the address pane's chrome and landmark; `retention/retained-template.ts` and the
  primary retention prefix go; retention keys use the tab root.
- Retention bookkeeping that read the router's parked instances: retention collection, unsaved work,
  tab closing, the preview slot.
- The testbed's own surfaces that tell router-mounted from host-mounted by `routeConfig`.
- End-to-end selectors that name `lw-content-area` as the host of a surface.
- `llms-full.txt`, `docs/weaver/content-area.md` and the published JSDoc on reading the sub-address.
- NextPA finding **F-036**. NextPA's press-and-release workaround in its listing can go once a release
  carries this.
- Behaviour change for plugins: a trusted component is always mounted by the host, never by the
  router. The route it injects is live; a component that decided once, from a missing route
  configuration, to stop following the address has to follow the route instead.
