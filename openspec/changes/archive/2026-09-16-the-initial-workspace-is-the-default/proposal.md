> **Status:** approved.

## Why

A distribution whose declared workspaces are its navigation still has the workbench's own empty
workspace listed first in the workspace dialog, as "Default". It holds nothing the distribution
declared: no content tab, none of the declared sidebars. A person who chooses it lands in an empty
workbench with nothing that says how to get back. The distribution has no way to leave it out, and no
way to say which of its own workspaces the default is (NextPA finding F-024, first part).

A distribution that declares the workspace the application opens in has already said which workspace
is its default. That declaration is where this belongs, so no second switch is added.

## What Changes

- **BREAKING** A workspace a distribution declares as the one the application opens in becomes the
  default workspace. The workbench's own empty workspace is then not offered anywhere: not in the
  workspace dialog, not in any count of workspaces.
- Wherever the workbench falls back to the default workspace, it falls back to the declared one:
  removing the active saved workspace moves the user there.
- A user whose stored choice is the empty workspace from before is in the declared one at the next
  opening. What they had arranged in the empty workspace is not carried over.
- A distribution that declares no starting workspace keeps the empty workspace, offered and behaving
  exactly as today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: a requirement is added saying that the declared starting workspace is the default
  one, that the workbench's own empty workspace is then not offered, and where a fallback leads.

## Impact

- `platform/libs/core/shell/src/lib/workspace/`: one place decides which workspace is the default;
  the active-workspace resolution, `WorkspaceService` (removal, the reset of every workspace,
  existence), the baseline lookup, and the workspace dialog use it.
- `platform/libs/core/shell/src/lib/workspace/workspace-definition.ts`: the JSDoc on `initial`, which
  is published contract.
- `docs/distribution/workspaces.md` and `llms-full.txt`.
- Distributions that already declare `initial`: their users no longer see "Default", and an
  arrangement built there is no longer reachable. The release notes say so.
- NextPA's `loomweaver-findings.md` marks this part of F-024 fixed once a release carries it; that
  happens in a NextPA session, not here.

No legacy source is dissolved by this change.
