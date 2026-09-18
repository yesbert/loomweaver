## 1. A pane's strip stays a drop target (F-029)

- [x] 1.1 Keep `platform/apps/loom-testbed-e2e/src/split-undo.spec.ts` as the reproduction: it
  drags a dashboard tab out of the address pane onto an edge and back onto the strip of the pane it
  came from, and fails today. Tidy it into the repository's test style and delete
  `split-undo-probe.spec.ts`.
- [x] 1.2 Add a unit test in `pane-drag.service.spec.ts`: two registrations of the same strip id,
  the first unregistered, leave the id registered. Same for a zone.
- [x] 1.3 Make the unregister functions of `registerStrip` and `registerZone` remove one occurrence.
  Both tests turn green.

## 2. Closing a pane spares what cannot close (F-028)

- [x] 2.1 Lift the "may this tab be closed here" judgement (pinned, declared unclosable) into one
  predicate the tab menu's bulk close and the pane close share, and fold the content-side `close`
  switch in through one function the pane actions and the content tabs service both call.
- [x] 2.2 Test first, in `pane-actions.service.spec.ts`: closing a non-address pane that holds an
  unclosable, a pinned and an ordinary tab leaves the first two in the neighbour, same instance,
  and closes the third.
- [x] 2.3 Implement it in `PaneActions.close` for a pane that does not carry the address: ask the
  guard about the remaining instances only, then hand the spared tabs to the adjacent pane and
  remove the leaf in one tree edit (`tree/pane-handover.ts`).
- [x] 2.4 Test and implement the same for the pane carrying the address
  (`TabClosingService.closePrimaryPane`): the promoted neighbour receives the spared tabs and the
  address.
- [x] 2.5 Test and implement the same for `PaneActions.unsplit`: spared tabs of every other pane
  end in the remaining pane.
- [x] 2.6 Test: with `content.close` switched off, closing a pane moves all its tabs to the
  neighbour.
- [x] 2.7 Test: unsaved work held only in a spared tab asks nothing.
- [x] 2.8 E2E in the testbed's dashboard workspace: split by drag, close the new pane, all three
  dashboard tabs remain.

## 3. Hand-over

- [x] 3.1 Check `llms-full.txt`, `docs/` and the JSDoc on `closable`, `pinned` and the pane
  service's close and unsplit for any sentence that says closing a pane discards its tabs, and
  correct it.
- [x] 3.2 Run `openspec validate --all --strict`, the shell unit suite, the affected testbed e2e
  specs and the repository's guards; reconcile this change's artifacts with what was built.
