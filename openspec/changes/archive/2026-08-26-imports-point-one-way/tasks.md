## 1. Build the checker and calibrate it

- [x] 1.1 Write `platform/tools/check-import-cycles.mjs`: build the file import graph of
      `platform/libs/core/shell/src` from relative specifiers, report strongly connected components
      of size greater than one, and project the same graph onto slices to report mutually dependent
      slice pairs.
- [x] 1.2 Implement the slice definition from design.md: a direct child of `src/lib/`, except
      `regions/*` counts one level deeper and `elements/*` collapses to a single `elements` slice;
      files directly in `src/lib/` are the composition root.
- [x] 1.3 Calibrated: the first run reported exactly 5 components covering 19 files and exactly 32
      mutual slice pairs, matching the proposal. **The calibration was right and the measurement was
      still wrong**, which only became visible in 2.5: counting `import type` as an edge invents
      cycles that cannot exist at run time. See 2.7.
- [x] 1.4 Add a deliberate probe to prove the checker bites: introduce a throwaway import that
      creates a new cycle, confirm the checker fails on it, then remove it.

## 2. Resolve the file-level cycles

- [x] 2.1 `settings/settings.service.ts` against `settings/settings-dialog.ts`.
- [x] 2.2 `plugin-store/plugin-store.service.ts` against `plugin-store/plugin-store-dialog.ts`.
- [x] 2.3 `permissions/capability-refusal.ts` against `commands/command.service.ts`.
- [x] 2.4 The six-file component: `regions/pane/retained-view-stash.ts`,
      `regions/pane/pane-tree.service.ts`, `regions/pane/retention-policy.ts`,
      `workspace/workspace-definition.ts`, `workspace/provide-workspaces.ts`,
      `workspace/active-workspace.service.ts`.
- [x] 2.5 The seven-file component needed no code change: **it was never a cycle.** The only edge
      closing it was `import type { StripTab }` in `regions/pane/pane-label.ts`, which TypeScript
      erases entirely. A type-only edge cannot put two modules in a circular initialisation, and
      initialisation order is the whole reason a file cycle is a defect. The checker was over-counting,
      so the fix went into the checker, not the shell. No bad cut was forced, and none was needed.
- [x] 2.6 Re-run after each step; the count fell by one each time and no new component appeared.
      Final state: **0 file cycles**, down from 5.
- [x] 2.7 Correct the checker to build two graphs rather than one: file cycles from value imports
      only, slice pairs from every import. The two questions differ — a library split is a
      compile-time boundary as well as a runtime one, so a type-only edge still counts there. This is
      the checker's second calibration failure and, like the first, it was found by doing the work
      rather than by reading the output.
- [x] 2.8 **Defect found by packaging, not by tests.** Moving `DEFAULT_WORKSPACE_ID` and leaving a
      bare `export { DEFAULT_WORKSPACE_ID } from './workspace-definition'` in
      `active-workspace.service.ts` kept all 1,288 specs green while `nx package shell` failed: a
      re-export does not bring the name into local scope. Vitest does not type-check; packaging is the
      type check. Recorded in operations.md.

## 3. Prove the published surface is untouched

- [x] 3.1 Build the packed type declarations from `main` into a separate worktree and hash them.
- [x] 3.2 **Not byte-identical, and the criterion as written was too strict.** `@loom/plugin-sdk`'s
      declarations are byte-identical. `loom-shell.d.ts` differs in exactly 8 lines and **all 8 are
      `private readonly` fields** — `SettingsService` lost `requested`/`sections`/`omitted` and gained
      `dialogs`/`registry`, `CommandService` traded `refusals` for `errors`. Zero non-private lines
      differ, so no consumable name changed. TypeScript emits private members into a `.d.ts` for
      structural completeness; a consumer cannot reach them. Recorded rather than waved through.
- [x] 3.3 Confirm `platform/tools/check-api-docs.mjs` and `check-package-exports.mjs` are still
      green.

## 4. Record the baseline and wire the gate

- [x] 4.1 Write the slice baseline as an explicit list of the mutual pairs that remain, one line per
      pair, checked in beside the checker.
- [x] 4.2 Make the checker fail on a pair absent from the list **and** on a listed pair that no
      longer exists, so the list has to be trimmed as the tangle shrinks.
- [x] 4.3 File-level baseline is **zero**. No exception was needed.
- [x] 4.4 Add the checker to `azure-pipelines-build.yml` in the "Build + test" stage. It reads
      sources only, so it needs no packaging step and can run early.
- [x] 4.5 Add a `package.json` script so a contributor can run it without reading the pipeline, and
      name it in the `CONTRIBUTING.md` list of checks.

## 5. Verify

- [x] 5.1 `npx nx run-many --target=lint --target=test --target=build --all` is green in `platform/`.
- [x] 5.2 The shell's file graph is acyclic: 211 files, 0 cycles, 31 mutual slice pairs.
- [x] 5.3 The packed `.d.ts` carries no public change against the `main` baseline — see 3.2 for
      what does differ and why it is unreachable.
- [x] 5.4 `openspec validate --all --strict` passes.
- [x] 5.5 Nightly run 19407 against `main` `fbb0d77a`: **293 e2e tests passed** in 9.1 minutes,
      plus 53 demo smoke tests. The suite stays out of the merge gate.
