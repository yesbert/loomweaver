> **Status:** approved.

## Why

A visitor of the live demo reported, with a screenshot, that in the Breeze look the active icon
tab of a sidebar header is drawn as a circle that is cut off at its top and left edge. The circle is
Breeze's doing: the look rounds every icon button fully, and the active tab of an icon strip is an
icon button. The cut is not: the strip's row clips its content, and where the row's box is tighter
than the tab's, or the row is scrolled, the tab's background is cut. In the default look the same
cut exists but hides in a small corner radius; a full circle makes it visible.

The report comes from the first outside eyes on the demo, so it is worth fixing quickly and worth
knowing exactly what it is before fixing it. The screenshot shows the row at a size we do not
reproduce at 1280 px on macOS, so the first step is to find the viewport and the state it appears in.

## What Changes

- Reproduce the cut as reported: which viewport, which look, which panel, whether the strip is
  scrolled or overflowing, and whether the sidebar header's fixed height or the strip's row is the
  clipping box. Record the answer in the design note.
- Fix the cause where it is. If the clipping box belongs to the workbench's icon strip, the fix is
  in the shell and this change gains a delta to the capability that describes the strip. If the cut
  comes only from the Breeze look's rounding against a box the look does not size, the fix is in the
  demo's look and no guarantee changes.
- Pin it with a check that a fully rounded active icon tab is drawn whole in every look the demo
  ships, at the viewport the report came from.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None yet. This change starts with `skip_specs`, because the reproduction decides whether the
workbench's strip or the demo's look is at fault. Where the strip turns out to be, the change is
updated with a delta before the fix is written.

## Impact

- The Breeze look in the demo, or the pane tab strip in the shell, decided by the reproduction.
- The demo's end-to-end suite, which gains a check for the looks.
- No legacy source is dissolved by this change.
