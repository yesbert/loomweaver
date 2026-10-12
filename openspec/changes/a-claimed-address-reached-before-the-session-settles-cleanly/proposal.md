> **Status:** approved.

## Why

NextPA reported on 2026-10-12 (finding F-053) that after a restart in a workspace that is not the
initial one, the initial workspace shows a tab that belongs to the other workspace, with that
workspace's address in the address bar, until the person resets the layout.

The testbed reproduces it, and the cause is not the restart. It is the first opening of a claimed
address whose content asks for a session, before the session is known, as on a fresh sign-in:

- While the session does not qualify, the content is explained at its address, and the visit does
  not move the person into the claiming workspace. Its tab opens in the workspace that is active,
  the initial one.
- When the session qualifies, the workbench moves into the claiming workspace, as it should. The
  provisional tab stays behind in the initial workspace.
- Where the session adopts the person's namespace and that namespace holds nothing yet, the initial
  workspace's arrangement is written there with the stray tab in it. Every later visit, including
  every visit after a restart, shows it.

The contract already says a visit before the session is known is treated no differently from one
after, and that the claiming workspace is where claimed content is shown. A visit after the session
leaves nothing behind in the workspace it came from, so this is a defect against both, not a missing
guarantee.

## What Changes

- A visit to a claimed address that waited for the session in another workspace takes its tab out
  of that workspace when it moves into the claiming one.
- A tab the waiting workspace already held at that address before the visit stays, as does content
  at an unclaimed address.
- Stored content is not rewritten. A person whose stored arrangement already carries the stray tab
  from this defect clears it once by resetting the workspace; the existing guarantee that stored
  content contradicting a declaration is kept stands, so the finding's proposal to drop such tabs on
  reading is not followed.
- `workspaces` gains a scenario that pins this under the claims requirement.

No API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: "A workspace may claim the content that belongs to it" states that a visit that
  waited for the session leaves nothing behind once it settles.

## Impact

- The shell's address settlement, the route table's placeholder for content the session does not
  qualify for, and the restart path that re-reads an adopted namespace.
- A unit test of settling once the session arrives, and a testbed e2e test of a restart at a gated,
  claimed address with a late session.
- NextPA finding F-053.
