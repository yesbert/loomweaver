> **Status:** approved.

## Why

A product holds a docked surface while it shows it in a window of its own. The contract says that
while the surface is held, the workbench does not take its nodes away, whatever it does to the panel
or pane the surface belongs to. Moving the view to the other sidebar, or into another pane, breaks
that in the running workbench.

A browser probe against the testbed shows what happens. The held outline, shown in another element,
is moved to the other sidebar through the view's menu. The instance running in the product's element
is destroyed and its nodes leave that element. The other sidebar builds a second component for the
same view, which shares the hold, reads as held and is therefore never placed. The product's window
loses the surface and the sidebar stays empty.

Two things cause it. The retention collector treats a view tab that left its pane as closed, and ends
a closed surface even when it is held. And the place the view arrives at never learns that a live
instance of it exists, so it builds a new one.

## What Changes

- Moving the view of a held surface keeps the one running instance. Its nodes stay where the product
  put them, and nothing is built for the new place while the hold lasts.
- When the hold is turned off, the instance is placed where the view now is, exactly as releasing it
  in its original place would have put it back there.
- A held surface counts as closed only when its view is open nowhere, so moving is no longer taken
  for closing. Closing the view still ends it.
- Nothing changes for a surface that never holds: moving it behaves as today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: the requirement *A surface may hold its nodes where it put them* states that
  moving the view keeps a held instance and places it at the new place once released, with scenarios
  for moving within the sidebars and into a pane.

## Impact

- A product holding a surface in its own window keeps it when the user moves the view, where today
  the window empties and the new place is blank.
- The retention collector keeps a held surface a little longer in one case: when its tab left one
  pane and is open in another. A held surface whose view is closed everywhere is ended as before.
- Found by a browser probe run before releasing the hold.
- No legacy source is dissolved by this change.

## Non-Goals

- **Opening the view in content as a second, separate instance.** That is not a move: the view is
  shown in a second place with its own hold, and it stays so.
- **Moving a surface that is not held.** It keeps being rebuilt at its new place, with its view
  state carried over, as today.
