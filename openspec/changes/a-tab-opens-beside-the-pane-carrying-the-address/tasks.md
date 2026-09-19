## 0. Order

- [x] 0.1 Confirm *a-preview-moved-to-another-pane-is-kept* is archived; this change's MODIFIED
  requirement is written against its text.

## 1. The request

- [x] 1.1 Add the optional `beside` flag to `OpenTabInput` in the plugin SDK, with JSDoc: where it
  opens, that the address stays, that a preview takes the neighbour's slot, and what the split
  switch does to it. Correct the interface's JSDoc, which says every open navigates.
- [x] 1.2 Let the flag cross the sandbox boundary in the open-tab sanitiser, with a unit test.

## 2. Opening into a pane

- [x] 2.1 Add the pure tree edit that writes a tab into a leaf, replacing the leaf's preview in place
  when the tab is a preview, and makes it the active tab, with unit tests in the tree slice. Export
  the query that names the leaf promoted when the address pane closes.
- [x] 2.2 Test first: in an unsplit area, opening beside splits to the right, the item is shown in
  the new pane, the list's pane still carries the address and still shows the list.
- [x] 2.3 Test first: in a split area, opening beside lands in the pane the tree promotes when the
  address pane closes, including a nested split; no pane is created.
- [x] 2.4 Test first: several previews opened beside in turn reuse one tab in the neighbour, the
  replaced one's close hook runs, and the address pane gains no tab.
- [x] 2.5 Test first: an item already open in the neighbour is shown there and not duplicated.
- [x] 2.6 Test first: with splitting to the right switched off, an unsplit area stays unsplit and
  the item opens in the address pane; a split area still uses its neighbour.
- [x] 2.7 Test first: a blown-up address pane is restored and the item is shown beside it; a
  minimised neighbour is brought back.
- [x] 2.8 Implement opening beside in the content tabs service: resolve the neighbour through the
  existing promotion query, split where needed and allowed, write the tab into that pane with the
  tree edit, run a replaced preview's close hook, and do not navigate. An item held by another pane
  than the neighbour takes the ordinary open.

## 3. Both runtimes, end to end

- [x] 3.1 Testbed: the entry list is also registered at an address (`browse`), and its row menu
  offers "Open preview beside".
- [x] 3.2 E2E (`open-beside.spec.ts`): three entries opened beside in turn from the list in the
  address pane; one italic tab beside the list shows the last one, the list is still visible and the
  address still shows the list.
- [x] 3.3 Sandboxed runtime, at its boundary: the sanitiser carries the wish, and the runtime hands
  it to the same opening (`sandbox-plugin-runtime.spec.ts`). A sandboxed list end to end needs a
  surface-to-logic-frame bridge the testbed does not have; see the design note.

## 4. Hand-over

- [x] 4.1 Document the flag in `llms-full.txt` (`OpenTabInput`), in *Preview tabs* of
  `docs/weaver/content-area.md` with the list example, and in `docs/distribution-api/tabs.md`.
- [x] 4.2 Run `openspec validate --all --strict`, the shell unit suite, the testbed e2e specs that
  touch previews, splits or the sandbox, the packed-declaration and documentation guards; reconcile
  this change's artifacts with what was built.
