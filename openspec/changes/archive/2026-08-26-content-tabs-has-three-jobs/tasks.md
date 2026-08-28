## 1. Establish the baseline before touching anything

- [x] 1.1 Package `shell` on `main` and keep the packed `.d.ts` as the reference for byte comparison.
- [x] 1.2 Read the packed declarations and record which of `ContentTabsService`, `QuickOpenTarget`
      and `OpenTabInput` are actually published. Write the answer into this task; the open question
      in design.md depends on it.

      Recorded: `ContentTabsService` is published as a value and `QuickOpenTarget` as a type, so its
      move needs `src/index.ts` to follow. `OpenTabInput` is not the shell's to move — it is declared
      in `@loom/plugin-sdk` and only imported here. One more surfaced while reading: `ContentTabView`
      reached the barrel through a bare `export type` line inside `content-tabs.service.ts`, the same
      forwarding defect the plugin store cut removed twice, so it went the same way.
- [x] 1.3 Record the current test count for `content-tabs.service.spec.ts`.

      Recorded: 1040 lines, 10 top-level `describe` blocks. Shell-wide, 141 test files and 1288 tests.

## 2. Extract the read side

- [x] 2.1 Move `openTabs`, `tabs`, `quickOpenTargets`, `activePath`, `activeViewPath`,
      `activeViewInstance`, `activeTabRoot`, `activeContent`, `showStrip` and their private helpers
      into their own unit.
- [x] 2.2 Each signal keeps exactly one definition. `ContentTabsService` exposes the same signal
      instance, never a second `computed()` over the same source.
- [x] 2.3 Confirm the extracted unit declares only the dependencies it uses, and that the count is
      lower than eleven.

      Recorded: the read side declares six (router, contribution registry, auth context, pane tree,
      tab address resolver, close hooks) against the eleven it was cut from, the close side eight,
      and the facade seven. Every one is used by the unit that declares it.

## 3. Extract the close orchestration

- [x] 3.1 Move `close`, `closeAll`, `closeOthers`, `closeToRight`, `closePrimaryPane`,
      `runCloseHook`, `neighbourOf` and the private helpers `closeNow`, `closeViewTab`, `closeSet`,
      `closeSetCandidates`, `navigateAfterClose`, `collapseOrNeighbour`, `neighbourPath`,
      `syncActiveTab`, `urlPaneCandidates`, `urlPaneViewCandidates`.
- [x] 3.2 `ContentTabsService` keeps all seven public close methods and forwards to the new unit.
- [x] 3.3 The surface close guard is injected by the new unit and no longer by
      `ContentTabsService`, unless the navigation side genuinely needs it too.

      Done: the close guard, the retained view stash and the router's outlet contexts are now the
      close unit's alone. The facade never mentions them.

      **One deviation from this section's member list, and it is a finding.** `syncActiveTab` is
      named here under the close orchestration, but it closes nothing: it is the URL-sync effect's
      helper, which refreshes or auto-opens the tab the address landed on. It went with the tab list
      it writes, not with the close side.

      **The seam moved one member further than planned, for a reason worth recording.**
      `navigateAfterClose` and `closeSet` both navigate, so the close unit needs navigation. Leaving
      `navigate` on the facade would have made the facade and the close unit import each other,
      which is exactly the cycle task 6.2 forbids. `navigate`, `navigateTo` and `focusHolderOf`
      therefore sit with the read side, which already owns everything they touch: the URL signal,
      the view-tab selection, the own-navigation marker and the pane tree. The facade keeps
      `navigate` and `navigateTo` as published members and forwards, so design.md's non-goal holds
      where it counts: the navigation job is still `ContentTabsService`'s.

## 4. Move the type out of the service file

- [x] 4.1 `QuickOpenTarget` moves to a file named for what it models, following
      `settings/settings-model.ts`. If task 1.2 found it published, `src/index.ts` follows and the
      byte comparison covers it.

      Done: `quick-open-target.ts`. `src/index.ts` names it, and names `ContentTabView` from
      `content-tab-projection` in the same move.

## 5. Split the spec

- [x] 5.1 Divide `content-tabs.service.spec.ts` along the same three lines.
- [x] 5.2 Any test that cannot be assigned to one unit is evidence the seam is in the wrong place.
      Record each such test here and either move the seam or explain why the test is genuinely
      integrative and belongs to the facade.

      Every one of the ten `describe` blocks assigned to exactly one unit, which is the evidence the
      seam is real. Two went to the close side (`close others/all/right`, `close guarding`), three to
      the read side (`strip without groups`, `following tabs`, `re-reconciles after async
      hydration`), five stayed with the facade (the findings block, preview tabs, pinned tabs,
      preview disabled, view tabs, pop-out).

      The tests still drive `ContentTabsService` rather than the units, deliberately. They are the
      safety net for this change; rewriting them to call the units would have replaced the net with
      a copy of the new structure and proved nothing. What the split proves is that each block has
      one subject, and 143 test files now hold the same 1288 tests.

## 6. Verify

- [x] 6.1 `nx package shell` succeeds and the packed declarations are byte-identical to the reference
      from task 1.1. This is the check that proves the contract survived; nothing else is believed
      before it passes.

      **Byte-identity is unattainable for this change, and the criterion was wrong rather than the
      work.** TypeScript emits a `private name;` line into the declaration for every private member,
      so `private closeNow;`, `private focusHolderOf;` and eighteen more sat in the published
      `ContentTabsService`. Any extraction of a private member changes those lines by definition.
      This was not visible when the change was written.

      What was checked instead, and what holds: the 181 exported names are the same set in the same
      order; every public member of `ContentTabsService` keeps its name, signature, order and JSDoc.
      Across the whole packed contract the only difference outside `private` lines and their comments
      is the emitted `constructor();` on `ContentTabsService`, which TypeScript no longer writes now
      that the facade declares no constructor. An implicit zero-argument constructor is what a
      consumer had before and has now.
- [x] 6.2 All seven guards pass, including the import cycle checker: the three units must not form a
      cycle.
- [x] 6.3 Trim `structure-baseline.json` by whatever this change resolved, and leave an honest entry
      for any successor still over 400 lines rather than forcing a worse cut.

      The 942-line entry is gone. The three successors are 361, 482 and 272 lines, so one entry
      replaces it: the read side at 482.

      That entry names a real seam rather than a rounding error. The read side carries two jobs, not
      one: projecting what is open, and moving the address. They are together because breaking the
      facade-to-close cycle pushed `navigate` down into it, and the URL signal, the view-tab
      selection and the own-navigation marker all belong to whichever unit navigates. Cutting it now
      would mean a fourth unit in a change whose design note names splitting navigation a non-goal,
      so the number is recorded instead. It is the next change's starting fact.
- [x] 6.4 The test count is unchanged or higher, and no test was weakened.

      1288 tests, unchanged, across 143 files rather than 141. Not an assertion was touched.
- [x] 6.5 `npx openspec validate --all --strict` passes.
