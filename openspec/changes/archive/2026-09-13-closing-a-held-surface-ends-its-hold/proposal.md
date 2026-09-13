> **Status:** approved.

## Why

A review of the changes merged without an automated review found two faults, one in each of the last
two capabilities touched.

A docked surface that holds its nodes and is then closed is ended, as the contract requires, but its
hold is not. The hold belongs to the view instance rather than to the component, so when the view is
opened again the new component finds itself already held. The workbench then never puts its nodes in
their place and never lets go of it for being hidden, and the view stays blank until something
releases a hold the new component never asked for. That breaks the promise that closing closes a held
surface and that a surface which never holds is unaffected.

A panel region's start, narrowest and widest widths are checked against each other but not for being
numbers. A width that is not a number passes every comparison, so a layout built from a missing
configuration value is accepted and the panel is drawn with a width the browser cannot use. The
overlay width, added a change later, is already refused in that case.

## What Changes

- Ending a held instance also ends its hold. A view opened again after it was closed starts unheld
  and is placed like any other, until it switches holding on itself.
- A panel region's start, narrowest or widest width that is not a positive number is refused when the
  distribution is composed, with a message naming the region, exactly as the overlay width is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: the requirement *A surface may hold its nodes where it put them* states that
  ending an instance ends its hold, with a scenario for opening the view again.
- `shell-layout`: the requirement *A panel region may declare its own widths* refuses every declared
  width that is not a positive number, not only the overlay width.

## Impact

- A product that closes a held view and opens it again sees it, where today it sees an empty panel.
- A distribution declaring a width of zero, a negative number or something not finite beside the
  content fails at composition. Such a layout never drew a usable panel, so nothing working breaks.
- Found by review of pull requests 380 to 388.
- No legacy source is dissolved by this change.

## Non-Goals

- **One hold shared by the same instance shown in two places.** The review suspected it and could not
  show it happens; nothing here changes how an instance is shared.
- **The fallback language for a product serving no English.** It predates these changes and English is
  the agreed fallback for missing shell strings.
