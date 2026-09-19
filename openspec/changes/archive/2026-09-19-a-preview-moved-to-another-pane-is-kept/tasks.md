## 1. A move between panes promotes a preview

- [x] 1.1 Test first, in `pane-move.service.spec.ts`: a preview kept by a pane that has given up the
  address, dragged onto the strip of the address pane that shows a preview of its own, arrives
  permanent, and the address pane holds exactly one preview. Fails today.
- [x] 1.2 Test: a preview moved between two panes that do not carry the address, onto a strip and
  onto an edge, arrives permanent.
- [x] 1.3 Test: a preview split out of its pane through the split-out command arrives permanent, the
  same as by dragging onto an edge.
- [x] 1.4 Make the departing tab lose its preview state on every move between two different panes.
  The existing test for a preview leaving the address pane stays green unchanged.
- [x] 1.5 Test: reordering a preview within its own strip leaves it a preview.
- [x] 1.6 Test in `content-tabs.service.spec.ts`: with the main area split, opening a preview fills
  the slot of the pane carrying the address and leaves the other pane's tabs untouched.

## 2. The descriptions agree

- [x] 2.1 Rewrite the JSDoc on `OpenTabInput.preview` in the plugin SDK: one slot per pane, an opened
  preview fills the slot of the pane carrying the address (the one the user last focused), and moving
  a preview into another pane makes it permanent.
- [x] 2.2 Say the same in the `OpenTabInput` comment of `llms-full.txt`, replacing "of the URL strip".
- [x] 2.3 Say the same in *Preview tabs* of `docs/weaver/content-area.md`, and check
  `docs/distribution/switching-capabilities-off.md` and `docs/distribution-api/tabs.md` for a
  sentence that contradicts it.

## 3. Hand-over

- [x] 3.1 Run `openspec validate --all --strict`, the shell unit suite, the testbed e2e specs that
  touch previews or pane drags, and the repository's guards; reconcile this change's artifacts with
  what was built.
