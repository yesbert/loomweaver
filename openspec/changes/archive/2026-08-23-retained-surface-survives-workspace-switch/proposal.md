> **Status:** approved.

## Why

A surface that declares it must be kept is destroyed when the user switches workspace. The contract
already forbids that — `surface-retention` says a surface whose declaration asks to be kept is not
destroyed when it is hidden, and switching workspace is one of the ways a surface is hidden. So this
is a defect against a guarantee the platform already makes, not a feature it lacks.

It was found by the demo's first isolated plugin. Its surface declares `retain: 'always'`, and the
measurement is unambiguous: hidden by a **tab** switch it survives — same document, same channel,
nothing re-run. Hidden by a **workspace** switch its element leaves the document and comes back
reloaded, so everything the user did inside it is gone. For a frame surface that also means a new
handshake, which the retention rule exists precisely to avoid.

The cost is not cosmetic. The demo's payment matching keeps the user's confirmations in the surface,
and every click on a rail entry throws them away. Any product whose workspace holds an expensive or
stateful surface pays the same price, and pays it silently.

## What Changes

- A surface that asks to be kept SHALL survive a workspace switch, as it already survives a tab
  switch — the workbench parks it rather than destroying it.
- The guarantee gains the workspace switch as a named case, so what "hidden" covers is no longer a
  matter of reading.
- A test pins the case that was missed, for a component surface and for a frame surface, because
  only the second one also loses its channel.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: the requirement that a surface may ask to be kept regardless gains a scenario
  naming the workspace switch. No new right is granted — the case that was read out of the existing
  one is written into it.

## Impact

- The content area's workspace activation path, which today rebuilds the arrangement rather than
  parking what the outgoing workspace was keeping.
- `openspec/specs/surface-retention/spec.md` — one added scenario.
- No published type changes, so no consumer has anything to migrate.

Nothing is dissolved: no decision record, guide or specification is superseded by this change.
