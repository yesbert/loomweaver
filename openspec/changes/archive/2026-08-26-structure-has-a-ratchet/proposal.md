> **Status:** approved.

## Why

Two rules already stand in the engineering standards and in `openspec/config.yaml`: folders are cut
by feature and never by technical type, and a source file holds one concept. Neither is measured, so
neither held.

`platform/libs/core/shell/src/lib/regions/pane` holds **31 concepts in one flat folder**, 56 files
counting specs and templates. `plugin-store` holds 21 concepts in 36 files. Ten source files across
the platform have grown past 400 lines, the largest at 942, and the second largest exports 50 symbols
that fall into seven unrelated themes. None of this is visible without reading the tree, which is
exactly why it grew.

The structure of this repository has been audited before. What was missing each time was not the
insight but the mechanism: nothing stopped the regrowth, so the next audit found the same shape
again. This change adds the mechanism first, so the three cuts that follow it are the last ones
anybody has to make by hand.

## What Changes

- Two thresholds enter the engineering standards, stated as numbers so they can be checked:
  a folder holds at most **12 concepts**, and a source file over **400 lines** must be justified.
  A concept is one `.ts` file that is not a `.spec.ts`.
- A checker reports both across `platform/libs` and `platform/apps` and fails when either gets worse
  than a recorded baseline. The baseline may shrink and may never grow, and a stale entry fails too,
  which is how the five checkers already in this repository work.
- The baseline records today's numbers honestly, including the entries this audit will not touch.
- The checker runs in CI beside the six guards already there.

Afterwards the shell can still be untidy, but not *more* untidy, and the distance to the agreed
shape is a number anybody can read.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. A threshold on folder fan-out and file length changes no requirement, no published name and no
observable behaviour. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**The folder baseline, five entries over 12 concepts:**

| Concepts | Folder | Addressed by |
|---|---|---|
| 31 | `libs/core/shell/src/lib/regions/pane` | `pane-splits-into-themes` |
| 22 | `libs/weavers/testbed-weaver/src/lib/views` | recorded, not addressed |
| 22 | `libs/core/plugin-sdk/src/lib` | recorded, not addressed |
| 21 | `libs/core/shell/src/lib/plugin-store` | `plugin-store-splits-into-themes` |
| 14 | `libs/weavers/testbed-weaver/src/lib/plugin` | recorded, not addressed |

**The file baseline, ten entries over 400 lines:**

| Lines | File | Addressed by |
|---|---|---|
| 942 | `shell/src/lib/regions/content/tabs/content-tabs.service.ts` | `content-tabs-has-three-jobs` |
| 752 | `shell/src/lib/regions/pane/pane-node.ts` | `pane-splits-into-themes` |
| 708 | `devkit/src/recipes/angular-weaver/recipe.ts` | recorded, not addressed |
| 544 | `shell/src/lib/regions/pane/pane-tree.service.ts` | `pane-splits-into-themes` |
| 515 | `shell/src/lib/plugin/sandbox-plugin-runtime.ts` | recorded, not addressed |
| 492 | `shell/src/lib/workspace/workspace.service.ts` | recorded, not addressed |
| 475 | `devkit/src/recipes/angular-distribution/recipe.ts` | recorded, not addressed |
| 412 | `devkit/src/lib/scaffolds/scaffolds.ts` | recorded, not addressed |
| 409 | `shell/src/lib/elements/select/lw-select.element.ts` | recorded, not addressed |
| 403 | `shell/src/lib/plugin/host-plugin-context.ts` | recorded, not addressed |

Recording an entry is not accepting it forever. It is refusing to pretend the number is zero, which
is the same choice `cycle-baseline.json` and `comment-residue.json` already make.

**No new dependency.** ESLint cannot express either rule: `max-lines` counts every file including
specs and has no baseline, and no rule counts siblings in a directory. This adds a seventh checker
beside `check-api-docs.mjs`, `check-package-exports.mjs`, `check-region-ids.mjs`,
`check-adr-index.mjs`, `check-comments.mjs` and `check-import-cycles.mjs`.

This change dissolves no decision record. It is the first of four structural changes agreed for this
audit and the precondition for the three that follow.
