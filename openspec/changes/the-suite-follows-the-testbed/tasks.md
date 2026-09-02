## 1. The two that need no judgement

- [x] 1.1 Point both `app-reset.spec.ts` tests at the dedicated dialog: match
      `data-testid="app-reset-confirm"` instead of a button named `OK`. Verify both pass.
- [x] 1.2 In `workspaces.spec.ts`, derive the provided-workspace count asserted by *the dialog opens
      on the list holding the active workspace* from the testbed's own declaration rather than from
      the literal five, so the next workspace the testbed gains does not break it. Verify it passes.

## 2. Sort the nine

- [x] 2.1 For each of the nine, record in one line what the scenario is about and which world it
      belongs in. The sorting, by the rule under *Decisions* in design.md:

      Stays at the claimed address, because the scenario is about the surface's own routing:
      - `sandbox.spec.ts` deep-links straight into a sub-route
      - `surface-retention.spec.ts` the retained surface keeps its state across its own sub-routes

      Moves to the unclaimed address, because a tab a workspace declares is neither a preview nor
      closable:
      - `sandbox.spec.ts` opens as a preview tab; the surface promotes it over RPC
      - `surface-retention.spec.ts` a sandboxed surface vetoes its close with its own dialog
      - `surface-retention.spec.ts` a dirty sandbox surface is guarded by the host dialog

      Moves to the unclaimed address, because the scenario needs a neighbour tab the claiming
      workspace does not have:
      - `sandbox.spec.ts` opens as a dynamic tab next to an open dashboard tab
      - `surface-retention.spec.ts` a retained sandbox surface keeps its state across a tab switch
      - `surface-retention.spec.ts` a sandbox surface that does not retain leaves the DOM when hidden
      - `pane-focus-drag.spec.ts` an iframe tab dragged to an edge splits with it
- [x] 2.2 Confirm each of the nine traces to the claim and not to a shell defect. Seven do. The two
      sorted as *stays at the claimed address* do not: reaching that address by direct navigation
      leaves the retained surface parked in the hidden stash, its container carrying `display: none`
      and hanging off `body` rather than the content area, so the tab opens onto a blank pane while
      the workbench reports the surface as active content. Reached from inside the application the
      same surface mounts correctly. Both are left failing.

## 3. The scenarios that stay at the claimed address

- [x] 3.1 Not rewritten, and deliberately so. Both rest on the defect named in 2.2, not on a stale
      expectation, and the proposal binds this change to leave such a test failing rather than adapt
      it. They keep the assertions they were written for.
- [x] 3.2 Confirm the two fail for that reason and no other: both reach the claimed address by direct
      navigation, and both fail on content that is present in the DOM but never shown.

## 4. The scenarios that move to an unclaimed address

- [x] 4.1 Register the existing `sandbox-rpc` view a second time in
      `apps/loom-testbed/public/sandbox-rpc/plugin.js`, at a routable path no workspace claims, with
      its own iframe query so a locator can tell the two apart. Keep `retain`, declare no
      sub-routes.
- [x] 4.2 Move each scenario sorted here to that address, keeping its neighbour tab and its
      assertion intact.
- [x] 4.3 Run `sandbox.spec.ts`, `surface-retention.spec.ts` and `pane-focus-drag.spec.ts` and
      confirm every test sorted here passes.

## 5. Close it out

- [x] 5.1 Run the whole testbed suite locally. 315 pass, no test skipped and none removed. Two fail,
      and they are the two named in 2.2 and 3.1, left failing on purpose. The suite is therefore not
      green, and cannot be until the defect behind those two is fixed; every failure that was a stale
      expectation is gone.
- [x] 5.2 Run the demo smoke suite and the unit tests, to confirm the added surface registration reached
      nothing else.
- [ ] 5.3 Raise the defect from 2.2 as its own change: a deep link into an address a workspace claims
      leaves a retained surface parked and the pane blank. Name the requirement it fails rather than
      restating the symptom.
- [ ] 5.4 Report the contradiction between `sandbox-rpc` declaring both `retain: 'always'` and
      `subRoutes` and the shell's boot warning that the two do not combine. It is adjacent to 5.3 and
      may belong in the same change; decide there, not here.
