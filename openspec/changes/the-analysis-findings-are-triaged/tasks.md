Counts are the state of the analysis on 2026-08-28, run 33156229919. Re-read the run summary before
starting: the list is the authority, this file is the plan.

## 1. Triage

- [ ] 1.1 Pull the current finding list from the latest Sonar run summary and confirm the total is
      still 83 across 27 rules. If it moved, note what changed before planning around it.
- [ ] 1.2 Classify each of the 27 rules as fix, exempt or defect, and record the verdict with one
      sentence of reasoning. A rule whose instances need different answers, as `S2871` does, is
      classified per instance.
- [ ] 1.3 Name any finding that breaks an existing guarantee. Each one leaves this change: create a
      separate change naming the requirement it fails, and record here which findings left and where
      they went. If none do, say so explicitly.

## 2. The mechanical slice

- [ ] 2.1 Merge the duplicate imports flagged by `S3863`, two per file in twelve files under
      `libs/core/shell`. Confirm the count drops by 24.

## 3. Correctness

- [ ] 3.1 Give the two `S2699` tests an assertion: `libs/core/shell/src/lib/i18n/transloco-loader.spec.ts:105`
      and `apps/loom-testbed-e2e/src/cross-tab-sync.spec.ts:67`. If a test turns red once it asserts
      something, treat that as a finding and report it before changing the assertion to suit.
- [ ] 3.2 Fix `S6959` in `libs/core/shell/src/lib/workspace/workspace-claims.ts:48`: a `reduce()`
      without an initial value throws on an empty array. Establish whether the array can be empty and
      pin the answer with a test.
- [ ] 3.3 Fix the two `S4123` findings in `update.service.ts:215` and `surface-close-guard.ts:160`:
      non-promises handed to a promise aggregator. Determine whether the intent was to await
      something that is not being awaited.
- [ ] 3.4 Fix the four `S6551` findings in `libs/integrations/ag-ui/src/lib/command-tools.ts`: values
      that stringify to `[object Object]` when the payload is not what was assumed.
- [ ] 3.5 Fix `S3800` in `apps/loom-testbed/public/sandbox-rpc/view.js:298`, a function returning
      more than one type, and `S4144` in `lw-icon.element.ts:56`, two identical implementations.
- [ ] 3.6 Decide the two `S7059` findings in `workspace.service.ts:172` and
      `hidden-views.service.ts:33`: asynchronous work started in a constructor. Move it or record why
      it belongs there.

## 4. Sorting

- [ ] 4.1 Classify each of the seven `S2871` call sites as display or storage.
- [ ] 4.2 Give the display sites a locale-aware comparator.
- [ ] 4.3 Exempt the storage sites with the reason written beside the criterion, including
      `workspace-definition.ts:242` and `hidden-views.service.ts:66`, where a locale-aware comparator
      would make the persisted form depend on the browser's language.

## 5. Complexity and shape

- [ ] 5.1 Decide each of the three `S3776` findings, in `shell-seeds.ts:273`,
      `sandbox-rpc-sanitize.ts:16` and `devkit/src/lib/validate/catalog.ts:117`: refactor where the
      code gets clearer, exempt with a reason where splitting would only serve the threshold.
- [ ] 5.2 Decide `S2004` in `view.js:327`, the two `S4624` nested template literals and the three
      `S3358` nested ternaries.

## 6. Modern API style

- [ ] 6.1 Work through the 27 style findings as one slice: `S7735` negated conditions (7), `S7764`
      `globalThis` (4), `S7747` needless array conversion (4), `S7768` and `S7762` DOM insertion and
      removal (3), `S7776` set membership (2), `S1874` deprecations (2), and one each of `S7763`,
      `S7780`, `S7786`, `S7755` and `S6582`. These carry no behaviour, so anything that changes
      behaviour on the way in is a signal to stop and look.

## 7. Accessibility

- [ ] 7.1 Decide `Web:S6819` on `regions/pane/pane-view.html:41` and the two
      `MouseEventWithoutKeyboardEquivalentCheck` findings on `chrome/pane-tab-strip.html:97` and
      `:107`. The existing exemptions in `platform/sonar-project.properties` already answer the same
      rules for other files: reuse the reasoning where it applies and say so, or fix where it does
      not.
- [ ] 7.2 Confirm the accessibility end-to-end suite still passes for whatever changed here.

## 8. Security hotspots

- [ ] 8.1 Review the three hotspots in Sonar and set each to its verdict.
- [ ] 8.2 Record each verdict and its reasoning here, since the state itself lives only on the
      server.

## 9. Close out

- [ ] 9.1 Confirm every exemption added to `platform/sonar-project.properties` names one rule and one
      file and carries its reason and review date, in the form the ten existing entries use.
- [ ] 9.2 Run the Sonar workflow and confirm the gate is green. If it is not, name what remains and
      why it was left.
- [ ] 9.3 Confirm no rule was disabled wholesale and no finding was closed on the server as "won't
      fix" instead of being decided here.
