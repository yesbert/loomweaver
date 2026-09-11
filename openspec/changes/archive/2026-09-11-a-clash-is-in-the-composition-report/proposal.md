> **Status:** approved.

## Why

Two commands in the testbed declared the same keyboard shortcut for about three weeks. The menu went
on promising the chord to one of them while the key ran the other. Nobody noticed.

Nothing was broken about the platform while that was true. `commands` requires that a clash is
reported and that the later registration wins, and both halves were kept: a warning was written on
every boot, and the later command took the chord. The warning went to the browser console, which is
where a developer looks last. It was found by accident, while end-to-end output was being read for an
unrelated reason.

The place a developer does look is the composition report, which exists to answer whether a product
is put together correctly. While the clash was live, that report said the composition was sound. That
is the gap worth closing: not a missing warning, but a warning nowhere near the question it answers.

Closing it also restores a signal we already pay for. The end-to-end suite asserts that the testbed's
report finds nothing wrong, so a clash that reached the report would have turned that test red the
following night.

## What Changes

- The composition report names a keyboard shortcut declared by more than one command. It names the
  commands that declared it and says which of them holds the chord, because which one holds it is
  what makes the difference visible: a control goes on showing a shortcut that now runs something
  else.
- A composition with no clash is unaffected, and a report that finds nothing still says so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-composition`: the requirement *A composition can be asked what is wrong with it*
  enumerates the mistakes the report finds. That list gains one: a shortcut two commands both claim.

## Impact

- The composition report gains one more thing to look for. Nothing else about it changes.
- The end-to-end test asserting the testbed's report is sound becomes a guard against this class of
  mistake as well, at no extra cost.
- No legacy source is dissolved by this change.

## Non-Goals

- **Changing who wins a clash.** `commands` states that the later registration takes the chord. That
  stays. Whether the first should instead keep it is a real question with a real argument on both
  sides, and it deserves its own change rather than arriving as a rider on a diagnostic.
- **Moving or duplicating the existing warning.** The console warning keeps the `commands` guarantee
  on its own, and it fires without being asked. The report is the roll-call a developer asks for. The
  two are not the same thing and neither replaces the other.
- **A repository guard over shortcuts.** Which chords collide is decided by what a product composes,
  and who wins by the order things register in. Neither is visible to a scan of the source. The
  existing check over command *names* says as much about its own scope, and this clash was between a
  weaver and the distribution composing it, so a guard of that shape would not have seen it.
- **Shortcuts that collide with the browser's own.** A different problem, with no list to check
  against that would stay true.
