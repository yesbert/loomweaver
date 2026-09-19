## 1. A moved preview stays a preview in the main area

- [x] 1.1 Test first, in `pane-move.service.spec.ts`: a preview dragged from the pane carrying the
  address onto an edge of the main area, and onto the strip of another pane of the main area, is
  still a preview there; that pane carries the address and the address names the same content.
- [x] 1.2 Test first: a preview split out through the split-out command stays a preview.
- [x] 1.3 Keep the existing test that a preview moved into a sidebar is promoted, unchanged.
- [x] 1.4 Make the departing tab keep its preview state when the target pane belongs to the main
  area, and lose it otherwise.

## 2. The next preview replaces it where it stands

- [x] 2.1 Test first, in `content-tabs.service.spec.ts`: with the preview in a pane other than the one
  carrying the address, opening another item as a preview replaces it in place in that pane, runs the
  replaced content's close hook, hands that pane the address, navigates to the new item, and leaves
  the other pane's tabs untouched.
- [x] 2.2 Test: without a preview in the main area, a new preview opens in the pane carrying the
  address (the existing tests stay green unchanged).
- [x] 2.3 Test: with previews left in several panes by an old arrangement, the one in the pane
  carrying the address is replaced first.
- [x] 2.4 Implement it in the content tabs service: find the preview across the main area, replace it
  in its pane with the pure tree edit, run the close hook, hand that pane the address through the
  same focus step a drop uses, and navigate.

## 3. End to end

- [x] 3.1 E2E in the testbed: open an entry from the entry list as a preview, drag its tab onto the
  right edge of the main area; it stays italic and the address still names it. Open the next entry
  from the list as a preview; the italic tab in the right pane shows it, the address names it, and
  the left pane is unchanged.

## 4. Hand-over

- [x] 4.1 Say the same in the JSDoc of `OpenTabInput.preview` and of the `preview` feature switch,
  in the `OpenTabInput` comment of `llms-full.txt`, in *Preview tabs* of
  `docs/weaver/content-area.md`, and in `docs/distribution/switching-capabilities-off.md`: one preview
  in the main area, opening replaces it where it stands and moves the address there, a move within
  the main area keeps it.
- [x] 4.2 Run `openspec validate --all --strict`, the shell unit suite, the full testbed e2e suite,
  lint and the repository's guards including the bundle-size check; reconcile this change's artifacts
  with what was built.
