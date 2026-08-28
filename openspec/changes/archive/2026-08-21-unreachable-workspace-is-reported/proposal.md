> **Status:** approved.

## Why

A workspace the product declares is switchable, self-remembering and resettable — but only if the
user can get to it. The capability says they SHALL be able to switch without opening a dialog, and
that is the product's part to fulfil: it registers an entry that names the workspace, under an icon
of its own choosing. Nothing tells a product when it has not.

This was found the expensive way. The demo declared a workspace and shipped it without an entry, so
it was reachable only through the dialog and absent from the activity bar's customization. The guide
did not help: its section on declared workspaces shows the declaration in full — content, sidebars,
proportions — and never mentions the entry that makes it reachable.

The workbench already reports the other ways a declaration can fall short: a tab path matching no
route, a chromeless surface that can never be a tab, a sidebar view that does not exist, a duplicate
id, two workspaces claiming the first visit. A declared workspace nothing switches to belongs in
that list and is missing from it.

## What Changes

- The workbench reports, in development, a declared workspace that no entry switches to — naming the
  workspace and what the user is left with.
- The distribution guide shows the entry beside the declaration, so the pairing is visible where a
  reader meets it.

## Capabilities

### Modified Capabilities

- `workspaces`: the requirement that workspaces are reachable in one gesture gains the diagnostic
  that says when a declared one is not, stated beside the guarantee it protects.

## Impact

- `platform/libs/core/shell/src/lib/regions/rail/rail-workspace-entries.ts` — the service that already
  watches the rail and the workspaces.
- `docs/building-a-distribution.md` — the declared-workspaces section.
- The demo's existing end-to-end case admits no console message mentioning a workspace, so this
  diagnostic makes that test fail for any future workspace shipped without an entry. That is the
  point: the three workspaces still to come cannot repeat the omission.
