## 1. The two that need no judgement

- [ ] 1.1 Point both `app-reset.spec.ts` tests at the dedicated dialog: match
      `data-testid="app-reset-confirm"` instead of a button named `OK`. Verify both pass.
- [ ] 1.2 Derive the provided-workspace count in `workspaces.spec.ts:319` from the testbed's own
      declaration rather than the literal five, so the next workspace does not break it. Verify it
      passes.

## 2. Sort the nine

- [ ] 2.1 For each of the nine, record in one line what the scenario is about and which world it
      belongs in: the sandbox surface itself, which stays at `sandbox-rpc` inside the claiming
      workspace, or a surface among neighbours, which moves to `sandbox-static`. Use the rule under
      *Decisions* in design.md.
- [ ] 2.2 Confirm each of the nine traces to the claim and not to a shell defect, by checking that
      the page state at failure is the sandbox workspace with its single declared tab. Report any
      that does not trace, and leave it failing rather than adapting it.

## 3. The scenarios that stay at `sandbox-rpc`

- [ ] 3.1 Rewrite each sorted here to expect the sandbox workspace to be active and to hold the tab
      its definition declares, keeping the assertion the test was written for.
- [ ] 3.2 Run `sandbox.spec.ts` and `surface-retention.spec.ts` and confirm every test sorted here
      passes.

## 4. The scenarios that move to `sandbox-static`

- [ ] 4.1 Add `retain` and `subRoutes` to `sandbox-static.view` in
      `apps/loom-testbed/public/sandbox-static/plugin.js`, but only for what a moved scenario needs.
- [ ] 4.2 Move each coexistence scenario to the `sandbox-static` address, keeping its neighbour tab
      and its assertion intact.
- [ ] 4.3 Run `sandbox.spec.ts`, `surface-retention.spec.ts` and `pane-focus-drag.spec.ts` and
      confirm every test sorted here passes.

## 5. Close it out

- [ ] 5.1 Run the whole testbed suite locally and confirm it is green, with no test skipped and none
      removed.
- [ ] 5.2 Run the demo smoke suite and the unit tests, to confirm the `sandbox-static` edit reached
      nothing else.
- [ ] 5.3 Report the contradiction between `sandbox-rpc` declaring both `retain: 'always'` and
      `subRoutes` and the shell's boot warning that the two do not combine, as its own change rather
      than fixing it here.
