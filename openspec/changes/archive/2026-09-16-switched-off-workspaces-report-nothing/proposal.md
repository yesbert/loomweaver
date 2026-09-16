> **Status:** approved.

## Why

A distribution that switches the workspace controls off still gets a development warning that a
declared workspace "is reachable only through the workspace dialog", although that dialog is gone
with the switch. NextPA's chat app declares one workspace so its conversation tab opens, has the
controls off on purpose, and cannot silence the warning without a rail entry it does not want
(finding F-024, second part).

## What Changes

- While the workspace controls are switched off, the workbench reports nothing about a declared
  workspace that nothing offers.
- With the controls on, the report is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: the requirement *Workspaces are reachable in one gesture, and identifiable at a
  glance* today reports a declared workspace nothing offers without regard to the switch. It is
  modified so that the report holds only while the controls are on, with the rest unchanged.

## Impact

- `platform/libs/core/shell/src/lib/regions/rail/rail-workspace-entries.ts`: the report consults the
  workspace switch, as building the rail entries already does.
- `platform/libs/core/shell/src/lib/regions/rail/rail-workspace-entries.spec.ts`: the new scenario.
- `docs/distribution/workspaces.md` and `llms-full.txt`, where the report is described.
- NextPA's `loomweaver-findings.md` marks this part of F-024 fixed once a release carries it; that
  happens in a NextPA session, not here.

No legacy source is dissolved by this change.
