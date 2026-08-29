Counts are the state of the analysis on 2026-08-28, run 33156229919. Re-read the run summary before
starting: the list is the authority, this file is the plan.

Completed 2026-08-29. Where a task was answered differently from how it was written, the answer is
recorded under it. The four substantive departures are argued in design.md under *What the work
decided that this note did not*.

## 1. Triage

- [x] 1.1 Pull the current finding list from the latest Sonar run summary and confirm the total is
      still 83 across 27 rules. If it moved, note what changed before planning around it.
      **It had moved: 93 violations (10 bugs, 83 code smells) and 7 hotspots, not 83 and 3. The
      seven hotspots are one rule, `S5852`, in seven files.**
- [x] 1.2 Classify each of the 27 rules as fix, exempt or defect, and record the verdict with one
      sentence of reasoning. A rule whose instances need different answers, as `S2871` does, is
      classified per instance.
- [x] 1.3 Name any finding that breaks an existing guarantee. Each one leaves this change: create a
      separate change naming the requirement it fails, and record here which findings left and where
      they went. If none do, say so explicitly.
      **None did, and nothing left as its own change. Three latent defects surfaced later, after
      the language target rose in task 10.2, and were fixed in flight rather than lifted out: three
      reads past the end of an array, guarded only by a length check several lines above.**

## 2. The mechanical slice

- [x] 2.1 Merge the duplicate imports flagged by `S3863`, two per file in twelve files under
      `libs/core/shell`. Confirm the count drops by 24.

## 3. Correctness

- [x] 3.1 Give the two `S2699` tests an assertion: `libs/core/shell/src/lib/i18n/transloco-loader.spec.ts:105`
      and `apps/loom-testbed-e2e/src/cross-tab-sync.spec.ts:67`. If a test turns red once it asserts
      something, treat that as a finding and report it before changing the assertion to suit.
      **Both already asserted, through `expect.poll` and `httpMock.verify`, which Sonar cannot see.
      They got an assertion it can. Neither turned red.**
- [x] 3.2 Fix `S6959` in `libs/core/shell/src/lib/workspace/workspace-claims.ts:48`: a `reduce()`
      without an initial value throws on an empty array. Establish whether the array can be empty and
      pin the answer with a test.
- [x] 3.3 Fix the two `S4123` findings in `update.service.ts:215` and `surface-close-guard.ts:160`:
      non-promises handed to a promise aggregator. Determine whether the intent was to await
      something that is not being awaited.
- [x] 3.4 Fix the four `S6551` findings in `libs/integrations/ag-ui/src/lib/command-tools.ts`: values
      that stringify to `[object Object]` when the payload is not what was assumed.
- [x] 3.5 Fix `S3800` in `apps/loom-testbed/public/sandbox-rpc/view.js:298`, a function returning
      more than one type, and `S4144` in `lw-icon.element.ts:56`, two identical implementations.
- [x] 3.6 Decide the two `S7059` findings in `workspace.service.ts:172` and
      `hidden-views.service.ts:33`: asynchronous work started in a constructor. Move it or record why
      it belongs there.

## 4. Sorting

- [x] 4.1 Classify each of the seven `S2871` call sites as display or storage.
- [x] 4.2 Give the display sites a locale-aware comparator.
- [x] 4.3 Exempt the storage sites with the reason written beside the criterion, including
      `workspace-definition.ts:242` and `hidden-views.service.ts:66`, where a locale-aware comparator
      would make the persisted form depend on the browser's language.
      **No exemption was needed. Every site takes a comparator now; the storage sites take one that
      does not consult a locale, so the persisted form is stable across languages, which is what
      the exemption was going to protect. A later pass caught a comparator that compared whole
      `Object.entries` pairs rather than their keys, invisible in CI because an empty list never
      calls a comparator.**

## 5. Complexity and shape

- [x] 5.1 Decide each of the three `S3776` findings, in `shell-seeds.ts:273`,
      `sandbox-rpc-sanitize.ts:16` and `devkit/src/lib/validate/catalog.ts:117`: refactor where the
      code gets clearer, exempt with a reason where splitting would only serve the threshold.
      **All three were split along themes they already had: RPC surface sanitising, the built-in
      menu seeds, catalog entry validation. None needed an exemption.**
- [x] 5.2 Decide `S2004` in `view.js:327`, the two `S4624` nested template literals and the three
      `S3358` nested ternaries.

## 6. Modern API style

- [x] 6.1 Work through the 27 style findings as one slice: `S7735` negated conditions (7), `S7764`
      `globalThis` (4), `S7747` needless array conversion (4), `S7768` and `S7762` DOM insertion and
      removal (3), `S7776` set membership (2), `S1874` deprecations (2), and one each of `S7763`,
      `S7780`, `S7786`, `S7755` and `S6582`. These carry no behaviour, so anything that changes
      behaviour on the way in is a signal to stop and look.

## 7. Accessibility

- [x] 7.1 Decide `Web:S6819` on `regions/pane/pane-view.html:41` and the two
      `MouseEventWithoutKeyboardEquivalentCheck` findings on `chrome/pane-tab-strip.html:97` and
      `:107`. The existing exemptions in `platform/sonar-project.properties` already answer the same
      rules for other files: reuse the reasoning where it applies and say so, or fix where it does
      not.
      **`S6819` fixed: the awaiting-content region is an `<output>` rather than a div carrying
      `role="status"`. The two tab-strip findings are the change's only new exemption: the pin and
      close affordances are aria-hidden decorations over commands the keyboard already reaches
      through `shell.tab.close` and `shell.tab.togglePin`.**
- [x] 7.2 Confirm the accessibility end-to-end suite still passes for whatever changed here.

## 8. Security hotspots

- [x] 8.1 Review the three hotspots in Sonar and set each to its verdict.
      **All seven were fixed in code instead, which needs no server-side state and survives the
      project being recreated. Every one was `S5852`, the same super-linear pattern: a trailing-slash
      trim, a Tailwind entry-stylesheet probe read line by line instead, and the `PROVIDERS` pattern
      in `devkit/src/lib/amend/compose.ts`, which is now a small scan rather than a regular
      expression at all.**
- [x] 8.2 Record each verdict and its reasoning here, since the state itself lives only on the
      server. **Nothing to record: no hotspot was waived.**

## 9. Close out

- [x] 9.1 Confirm every exemption added to `platform/sonar-project.properties` names one rule and one
      file and carries its reason and review date, in the form the ten existing entries use.
      **One entry was added, `tabStripMouse`, in that form.**
- [x] 9.2 Run the Sonar workflow and confirm the gate is green. If it is not, name what remains and
      why it was left. **Green: 0 violations, 0 bugs, 0 code smells, 0 hotspots, coverage 84.8%.**
- [x] 9.3 Confirm no rule was disabled wholesale and no finding was closed on the server as "won't
      fix" instead of being decided here.

## 10. What the work added that this plan did not foresee

Recorded on completion. Clearing 93 findings buys one green run; these buy the state.

- [x] 10.1 `eslint-plugin-regexp` carries `no-super-linear-backtracking` and `no-super-linear-move`,
      the same analysis behind `S5852`, so the seven hotspots cannot come back through a pull
      request. Specs are exempt: a pattern in a test never meets an input it did not choose.
- [x] 10.2 The language target rose from ES2015/ES2020 to ES2022/ES2023, which is what let the
      analysis see `.at()`, `Object.hasOwn` and top-level await as available. It surfaced the three
      reads past the end of an array named in task 1.3.
- [x] 10.3 `eslint-plugin-unicorn` carries 285 of its 308 recommended rules, which is where most of
      the 93 came from. Nineteen rules are refused with the reason beside them and three wait on
      ES2025 in the browser. This is where the change's "the no is written in the repository"
      decision ended up living.
- [x] 10.4 `platform/tools/` became an Nx project so it is linted. It had been scanned by neither
      Sonar nor ESLint, which is where the scripts enforcing this repository's own rules live.
- [x] 10.5 Two files over the 400-line structure ratchet were split, which is what unblocked the two
      rules that add lines by design.
