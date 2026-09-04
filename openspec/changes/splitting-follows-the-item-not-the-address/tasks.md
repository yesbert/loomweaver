## 1. Pin the defect before fixing it

- [x] 1.1 Record which of the end-to-end specs fail on the current code, so the fix is measured
      against a number rather than an impression: `npx nx e2e loom-testbed-e2e` from `platform/`.
      Expect sixteen failures, all reaching for a split control or its result.
- [x] 1.2 Add a unit case that fails now: splitting a pane whose address has several segments, and
      one declared with a parameter, must produce a sibling. Put it beside the existing pane-service
      cases so it is found with them.

## 2. Separate the two questions

- [x] 2.1 In the drag service, add a predicate for duplication beside the one for hosting. It answers
      whether the item at a path can be shown in a sibling pane: a view path resolves to a surface the
      user may see; any other path matches a content route the user may see. Document on both
      predicates which question each answers, and that the narrow one exists for the picker.
- [x] 2.2 Point the pane actions' duplication check at the new predicate. The empty home screen stays
      excluded.
- [x] 2.3 Leave the hosting predicate and everything reading it untouched: the picker's list and the
      decision whether a tab is bound to the router are unchanged by this fix.

## 3. Prove it

- [x] 3.1 The unit case from 1.2 passes, and the existing pane-service and pane-view cases still do.
- [x] 3.2 `npx nx e2e loom-testbed-e2e` reports no failures. Compare against the list from 1.1: every
      one of the sixteen is expected to turn green, and any that does not is a second defect and gets
      its own investigation rather than a loosened test.
- [x] 3.3 Look at the running testbed. Open an address of several segments and one carrying a
      parameter, split each, and confirm the sibling shows the same item and the original keeps it.
- [x] 3.4 `npx nx run-many -t lint test build` passes.

## 4. Release the fix

- [ ] 4.1 Bump to `0.8.1` on a `chore/` branch, delete the tag the script creates, sign the commit
      off, merge, then tag `main` and push the tag. A patch, because the released line carries the
      defect and a consumer on `^0.8.0` should pick this up without acting.
- [ ] 4.2 After the publish, confirm the dist-tag `latest` moved to `0.8.1` on all seven packages.
- [ ] 4.3 Point the demo at `0.8.1`.

## 5. Close the gap that let it through

- [ ] 5.1 Read the next nightly end-to-end run rather than assuming it. Its last green report ran on
      code that predates the pane service, so the suite has never reported on this area.
- [ ] 5.2 Write down, in the private operations notes, that a cancelled nightly is not a pass, and
      what to look at after a release. Whether the suite should join the merge gate is the owner's
      decision and is not taken here.
