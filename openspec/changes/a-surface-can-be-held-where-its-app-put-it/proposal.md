> **Status:** approved.

## Why

A product wants to show one of its docked surfaces somewhere the workbench does not draw, while it
goes on living: NextPA moves its help chat into a floating window during a voice call, so the engine,
the microphone and the connection never restart. The product does all of that itself. It opens the
window, moves the surface's element into it, mirrors its styles and brings the element back.

The workbench undoes it. It handles a surface's rendered nodes in three places, and each of them
assumes the nodes are where it put them:

- **Collapsing a panel** takes the surface's nodes out of the document, wherever they are.
- **Switching what a pane or a workspace shows** hides the nodes or moves them to a hidden holding
  place, so a surface shown elsewhere goes blank or disappears.
- **A displaced surface is repaired**: on the next change anywhere in the workbench, nodes found
  outside their place are put back.

So a surface a product moved is emptied, hidden or pulled back, silently. `retain: 'always'` keeps
the instance alive, which is right, but does not stop any of the three.

NextPA raised this as F-016. The owner's decision is that the platform offers only the minimum that
makes it possible: a switch a surface turns on while it is shown elsewhere. Windows, styles, theme,
overlays and whether the browser can float anything at all stay the product's.

## What Changes

- A docked surface instance receives a hold switch from the workbench, beside the state storage it
  already receives.
- While the switch is on, the workbench does not take the instance's nodes out, hide them, move them
  or put them back, and does not destroy the instance for being hidden.
- When the switch is turned off, the workbench treats the instance as it would have all along: shown
  in its place if its place is visible, otherwise hidden or released by the ordinary rules.
- Closing stays closing. A held instance whose view is closed, whose plugin is turned off or whose
  arrangement is reset is ended exactly as today, and its nodes leave wherever they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: *A hidden surface is destroyed once it is clean* names being held as a
  further reason not to destroy. A requirement is added, *A surface may hold its nodes where it put
  them*.

## Impact

- The plugin SDK publishes one more instance-scoped handle, injected like the view state. Nothing
  existing changes for a surface that does not use it.
- The retention stash and the retained component consult the switch before hiding, releasing or
  repairing an instance.
- NextPA finding F-016. NextPA's float service turns the switch on before moving the chat's element
  and off after bringing it back, and may drop its own placeholder, since the workbench's repair puts
  the element in its current place.
- No legacy source is dissolved by this change.

## Non-Goals

- **A floating window, a float gesture or detection of one.** The product opens and closes its own
  windows; the workbench neither offers the gesture nor notices where the nodes went.
- **Mirroring styles, theme, language or text size into another window**, or opening the workbench's
  dialogs, menus and notices there.
- **Routable surfaces and isolated surfaces.** A routable surface has no instance handle, and an
  isolated surface cannot move its document into a window of the host without reloading.
- **Changing pop-outs**, which stay a second instance mirroring stored state.
