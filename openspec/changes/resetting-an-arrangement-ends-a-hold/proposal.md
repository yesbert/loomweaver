> **Status:** approved.

## Why

The contract says that resetting the arrangement a held surface belongs to ends it as it ends any
other. In the running workbench it does not.

Resetting the active workspace does not end surfaces by itself. It applies the baseline, and a
surface the baseline no longer shows becomes hidden and is then let go by the ordinary rules. A held
surface is exempt from exactly that, because the hold promises not to destroy it for being hidden.
So a reset that ends a surface which never held leaves a held one running, still held, in the
product's window.

A browser probe against the testbed shows both sides. The outline, unheld, is destroyed by a reset
that switches its sidebar back to the baseline view. The same outline, held and moved into another
element, survives the same reset and stays held.

Resetting a workspace the user is not in already ends held surfaces, because it evicts that
workspace's parked instances outright.

## What Changes

- Resetting the active workspace ends the hold of every surface belonging to it before the baseline
  is applied. From there the reset treats each such surface exactly as one that was never held: its
  nodes are taken back, and it is ended or kept by the ordinary rules for the arrangement the reset
  produces.
- The product sees its hold read off, which is its signal that the surface is no longer in its
  window.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: the requirement *A surface may hold its nodes where it put them* states how a
  reset ends a hold, with a scenario for it.

## Impact

- A product that holds a surface and lets the user reset the workspace sees the surface taken back
  and its hold ended, where today the surface stays in its window indefinitely.
- Nothing changes for a surface that never holds, or for resetting a workspace the user is not in.
- Found by a browser probe run before releasing the hold.
- No legacy source is dissolved by this change.

## Non-Goals

- **Moving a held view to another sidebar or pane.** It destroys the held surface and leaves the new
  place blank. That needs its own decision and is the next change.
- **Ending holds on any other rearrangement.** Only a reset is named by the contract.
