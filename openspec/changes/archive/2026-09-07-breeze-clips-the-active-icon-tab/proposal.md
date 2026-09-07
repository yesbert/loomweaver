> **Status:** approved.

## Why

A visitor of the live demo reported, with a screenshot, that the Breeze look draws something wrong
at the top of the window, and the owner reproduced it in Chrome: in Breeze the header rows do not
line up. The look raises the top bar to 56 px, but the heads of the sidebars beside it stay at 52 px,
and on a narrow window the hamburger boxes beside it stay at 48 px, so the header line steps down
on both sides of the bar and the rows beside each other do not share a bottom edge. The screenshot's
circle is the pressed "System" option of the scheme toggle, which Breeze rounds, standing on that
stepped edge.

The look is at fault, not the workbench. Dimensions are deliberately not tokens: a look changes them
with its own stylesheet, and Breeze changed the bar's height without changing the rows that stand
beside it.

## What Changes

- Breeze gives every header row the same height as its top bar: the sidebar heads in their wide
  form, the hamburger and expand boxes they take on a narrow window, and the icon strips they hold.
  The content pane's own tab strip keeps the height the look gave it, because it stands below the
  header line, not on it.
- A demo check that, in every look the demo ships, the rows on the header line share one bottom
  edge, on a wide and on a narrow window.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The reproduction found the demo's look at fault, and the workbench's position that dimensions
are a look's own stylesheet business stands; `skip_specs` stays.

## Impact

- The Breeze look's stylesheet in the demo.
- The demo's end-to-end suite, which gains a check for the looks.
- No legacy source is dissolved by this change.
