## 1. Take stock before touching anything

- [ ] 1.1 Record the current hits for each old id, so the rename can be checked against a known
      number: `grep -rn "'activity'\|'primary'\|'secondary'\|'activity-right'" platform/apps/loom-testbed/src platform/libs/weavers/testbed-weaver/src` (excluding matches that are the workbench label *Customize activity bar*).
- [ ] 1.2 Confirm the end-to-end suite references no region id: every match for "activity" under
      `platform/apps/loom-testbed-e2e/src` must be a `getByRole` label, not a string passed to the
      shell. If any is a region id, add it to the rename scope before starting.
- [ ] 1.3 Run the suite once on the current code so a later failure can be told apart from one that
      was already there: `npx nx e2e loom-testbed-e2e`.

## 2. Rename in the testbed's layout

- [ ] 2.1 In `platform/apps/loom-testbed/src/main.ts`, rename the four ids in the `regions` array:
      `activity` → `primary`, `primary` → `left-panel`, `secondary` → `right-panel`,
      `activity-right` → `secondary`. Apply them in that order and read each hit; `secondary`
      changes meaning rather than disappearing, so a global replace will produce wrong results.
- [ ] 2.2 In the same file, follow every `rail:` on a rail item and every `bar:` on a bar item.
- [ ] 2.3 In the same file, follow the `sidebars` maps inside `provideWorkspaces`. Their keys are
      panel ids, so `primary` becomes `left-panel` and `secondary` becomes `right-panel`.

## 3. Rename in the testbed weaver

- [ ] 3.1 `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed-surfaces.ts`: every `docks`
      entry.
- [ ] 3.2 `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed-chrome.ts`: every `rail` and
      `bar` target.
- [ ] 3.3 `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed-theme.ts`: every `rail` and
      `bar` target.
- [ ] 3.4 `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed.plugin.spec.ts`: the ids the
      spec pins. The spec is the evidence that a contribution lands where it is declared, so it must
      assert the new ids rather than be loosened.

## 4. Prove nothing is left behind

- [ ] 4.1 Search the whole repository for each old id in its region-id shape and confirm every
      remaining hit is either a shell unit-test fixture (those name arbitrary ids and are not the
      testbed) or the workbench label: `grep -rn "rail: 'activity'\|docks: \['primary'\]\|docks: \['secondary'\]\|'activity-right'" platform demo docs`.
- [ ] 4.2 Confirm no contribution targets a region the testbed no longer declares, by reading the
      `regions` array beside the list from task 1.1.
- [ ] 4.3 Run `node platform/tools/check-region-ids.mjs`. It reads the scaffold and the shell
      defaults, not the testbed, so it must still pass unchanged; a failure here means the rename
      reached something it should not have.

## 5. Remove the record of the deviation

- [ ] 5.1 In `docs/reference/shell-anatomy.md`, delete the sentence stating that the testbed names
      its rail `activity` and its left panel `primary`. The table of the scaffold's ids stays.
- [ ] 5.2 Run `node platform/tools/check-docs-style.mjs`. If the page dropped a long sentence, write
      the baseline with `--write-baseline` so the improvement holds.
- [ ] 5.3 Build the website from `website/` (`npm run sync && npm run build`) to confirm no link or
      anchor depended on the deleted sentence.

## 6. Verify

- [ ] 6.1 `npx nx run-many -t lint test build` passes.
- [ ] 6.2 `npx nx e2e loom-testbed-e2e` passes, compared against the baseline from task 1.3.
- [ ] 6.3 Start the testbed and look at it. Both rails carry their items, both panels open their
      views, the footers are populated, and the status bar shows the version. A persisted layout
      from before the rename will look empty; *Reset app layout* restores it, and that is expected
      rather than a defect.
