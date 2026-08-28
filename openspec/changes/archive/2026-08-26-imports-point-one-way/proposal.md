> **Status:** approved.

## Why

`@loom/shell` is one Nx library holding 209 source files, 141 specs and 24,294 lines across 24
feature slices. Nothing checks which way its imports point, so two kinds of tangle have grown
unobserved:

**Five import cycles at file level**, spanning 19 files. Two of them are large enough to matter: a
seven-file component tying the content tabs to the pane drag machinery, and a six-file component
tying pane retention to workspace definitions. A cycle is a latent initialisation-order bug and it
makes both halves untestable in isolation.

**Thirty-two mutually dependent slice pairs.** These are not cycles between files — different files
in each slice point in different directions — but they are cycles between *slices*, and that is the
distinction that decides whether the shell can ever be cut into separate libraries. Nx refuses a
project graph with a cycle in it, so as long as `regions/pane` and `regions/content` depend on each
other, they cannot become two libraries.

Neither number is visible today and neither can only get better. This change makes both measurable
and puts a ratchet on them, so the entangling stops before the untangling starts.

## What Changes

- A checker reports import cycles between files and mutual dependencies between slices, and fails
  when either gets worse than a recorded baseline.
- The five file-level cycles are resolved, so the file-level baseline is zero from the outset.
- The 32 mutual slice pairs are recorded as a baseline that may shrink and may never grow.

Afterwards the shell can still be tangled, but not *more* tangled, and the exact distance to a
library split is a number anyone can read.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Resolving an import cycle rearranges which file holds which symbol; it changes no requirement,
no published name and no observable behaviour. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**The five file-level cycles, all inside `platform/libs/core/shell/src/lib/`:**

| Files | Members |
|---|---|
| 7 | `regions/content/tabs/content-tab-projection.ts`, `regions/content/tabs/content-tabs.service.ts`, `regions/content/pane-targets.ts`, `regions/pane/pane-move.service.ts`, `regions/pane/pane-drag.service.ts`, `regions/pane/pane-label.ts`, `regions/pane/pane-tab-strip.ts` |
| 6 | `regions/pane/retained-view-stash.ts`, `regions/pane/pane-tree.service.ts`, `regions/pane/retention-policy.ts`, `workspace/workspace-definition.ts`, `workspace/provide-workspaces.ts`, `workspace/active-workspace.service.ts` |
| 2 | `permissions/capability-refusal.ts`, `commands/command.service.ts` |
| 2 | `settings/settings.service.ts`, `settings/settings-dialog.ts` |
| 2 | `plugin-store/plugin-store.service.ts`, `plugin-store/plugin-store-dialog.ts` |

**The slice tangle**, 32 mutual pairs. The heaviest are `regions/pane` against `regions/content` (53
crossing imports), `regions/panel` against `regions/pane` (27) and `regions/content` against
`plugin` (15). Three of them are already known to be cheap: all 14 imports that reach back into the
shell root fetch the same symbol from `shell-features.ts`; the whole `regions/panel` against
`regions/pane` pair rests on a single import; and 10 of the 17 return edges from `regions/pane` to
`regions/content` fetch `content-path.ts`. Those observations belong to the next change in this
series, not this one — here they only explain why the baseline is expected to fall quickly.

**No new dependency.** `eslint-plugin-import` is not installed, and `@nx/enforce-module-boundaries`
does not see inside a project. Rather than add a plugin that solves half the problem, this adds a
fifth checker beside `check-api-docs.mjs`, `check-package-exports.mjs`, `check-region-ids.mjs` and
`check-adr-index.mjs`, which is how this repository already enforces things ESLint cannot express.

This change dissolves no decision record. It is the first of the structural changes agreed for this
audit and the precondition for the two that follow.
