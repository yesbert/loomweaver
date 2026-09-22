## 1. S1 — a pane can draw everything the address pane draws

- [x] 1.1 Test first: a live surface route for a tab root reports a new sub-address, query and
  fragment through its snapshot and its streams, and its child route follows the sub-address.
- [x] 1.2 Test first: `data.urlDriven` follows whether the pane carries the address, and while it does,
  query and fragment come from the router.
- [x] 1.3 Implement the live route and the injector factory that owns one per (scope, tab root); the
  secondary pane feeds it its path and whether its leaf carries the address.
- [x] 1.4 Test first: a sub-address change in a secondary pane keeps the surface instance.
- [x] 1.5 Key the secondary pane's surfaces by the tab root; the pane-close candidates look them up by
  the tab root too.
- [x] 1.6 A lazy surface that is still loading shows a quiet loading state, not "unavailable".
- [x] 1.7 Change the testbed's surfaces that freeze the sub-address on `routeConfig === null` to read
  the live route.
- [x] 1.8 Run the shell unit suite and the full testbed e2e suite; open the S1 pull request.

## 2. S2 — one strip model (shipped with S3)

- [x] 2.1 The content area keeps only the address pane's strip and toolbars (host `display: contents`);
  its body, router outlet, retained containers and view overlay go.
- [x] 2.2 Shipped in the S3 pull request: on its own it would have needed a throwaway body component and
  a second selector migration.

## 3. S3 — the switch

- [x] 3.1 Test first, e2e (`address-moves-nothing-else.spec.ts`): in a split, a click held for 120 ms
  on a control in the pane not carrying the address is received, and the address moves there. Red on
  the code before S3.
- [x] 3.2 Test first, e2e: a surface that is not kept keeps its element, never removed from the page,
  while the address moves into its pane and out again. Red before S3.
- [x] 3.3 Test first, e2e: a text field clicked in the other pane keeps its focus and takes typing. Red
  before S3.
- [x] 3.4 Every leaf is a pane view; the address leaf shows the address-pane chrome; the body carries
  the landmark, the notice and the outlet for distribution pages while its leaf carries the address;
  the body path is the active view tab or the leaf's tab.
- [x] 3.5 Content routes, their placeholders and the pending-link placeholder render the empty stub.
- [x] 3.6 The content grid hands the pane tree no template. The retained template and the primary
  retention prefix stay: the sidebars use them for their first leaf.
- [x] 3.7 Move the end-to-end selectors to `#lw-main-content` and `data-address-pane`; resolve an
  outer pane's container by its tab root; move unit tests that relied on the router drawing content
  to draw it through a pane.
- [x] 3.8 Run the unit and e2e suites; open the S3 pull request.

## 4. S4 — removing what is left

- [x] 4.1 Reduce the reuse strategy to never reusing across content addresses; move retention
  collection, unsaved work, retention candidates, tab closing and the preview slot off its parked
  handles.
- [x] 4.2 Bring the bundle ceilings back where the slices leave the bundles: `loom-shell` 925 kB (S3),
  `loom-testbed` 900 kB (S4).
- [x] 4.3 Say it in `llms-full.txt`, the routing reference, the retention concept, the sub-routes,
  content-area, view-state, containers and pop-out guides, and the JSDoc on `loadComponent`,
  `subRoutes` and `rest`. The live route names a route configuration while its pane carries the
  address, so the documented once-only `routeConfig === null` check keeps its meaning, and its child
  route carries a declared sub-route's values. The dev-mode warning against `retain` with `subRoutes`
  goes: a kept surface follows its sub-address like any other.
- [x] 4.5 Hand-over to the demo adoption of the next release: `demo/e2e/dashboard-narrow-pane.spec.ts`
  reads `lw-content-area main`, which becomes `#lw-main-content > lw-content-secondary-pane`. It runs
  against the published packages, so it moves with the version bump, not before.
- [x] 4.4 Run `openspec validate --all --strict`, the unit suites, the full testbed e2e suite, lint
  and the repository's guards including the bundle-size check; reconcile this change's artifacts;
  open the S4 pull request.
  Testbed e2e: 360 of 361; the one failure (`tab-order.spec.ts`, narrow pane) passes five of five
  alone, as it did before this change.
