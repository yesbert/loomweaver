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

## 2. S2 — one strip model

- [ ] 2.1 Extract the content area's strip and toolbars into an address-pane chrome component, used by
  the content area unchanged.
- [ ] 2.2 Run the unit and e2e suites; open the S2 pull request.

## 3. S3 — the switch

- [ ] 3.1 Test first, e2e: in a split, a click held for 120 ms on a list row in the pane not carrying
  the address is received once, and the address moves there.
- [ ] 3.2 Test first, e2e: a surface that is not kept keeps its instance, scroll position and entered
  text while the address moves into its pane and out again; its element is not re-inserted.
- [ ] 3.3 Test first, e2e: a text field clicked in the other pane keeps its focus.
- [ ] 3.4 Every leaf is a pane view; the address leaf shows the address-pane chrome; the body carries
  the landmark, the notice and the outlet for distribution pages while its leaf carries the address;
  the body path is the active view tab or the leaf's tab.
- [ ] 3.5 Content routes, their placeholders and the pending-link placeholder render the empty stub.
- [ ] 3.6 Remove the retained template and the primary retention prefix from the pane tree.
- [ ] 3.7 Run the unit and e2e suites; open the S3 pull request.

## 4. S4 — removing what is left

- [ ] 4.1 Reduce the reuse strategy to never reusing across content addresses; move retention
  collection, unsaved work, tab closing and the preview slot off its parked handles.
- [ ] 4.2 Move end-to-end selectors that name `lw-content-area` as a surface's host.
- [ ] 4.3 Say it in `llms-full.txt`, `docs/weaver/content-area.md` and the JSDoc on reading the
  sub-address and the remainder.
- [ ] 4.4 Run `openspec validate --all --strict`, the unit suites, the full testbed e2e suite, lint
  and the repository's guards including the bundle-size check; reconcile this change's artifacts;
  open the S4 pull request.
