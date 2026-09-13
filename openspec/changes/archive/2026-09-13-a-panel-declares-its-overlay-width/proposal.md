> **Status:** approved.

## Why

On a viewport narrow enough for a side panel to become an overlay, the panel is 288 pixels wide,
whatever it holds and whichever distribution composes it. The widths a panel region may declare since
the previous change apply only where the panel stands beside the content, so a chat docked in a panel
opens at a comfortable width on a desk and squeezed on a phone, exactly where the screen could give it
more.

NextPA added this to F-015 after the declared widths shipped. The owner decided the shape: the
distribution declares the overlay's width, as a number of pixels like the other widths, and a person
does not drag it.

## What Changes

- A panel region may declare `overlayWidth`, the width of that panel when a narrow viewport presents
  it as an overlay. It is optional; without it the overlay stays 288 pixels.
- The workbench never lets an overlay run off the screen: a declared overlay width is capped at the
  viewport's width, less a margin that leaves room to dismiss the overlay beside it.
- The overlay width is independent of the widths beside the content. It is not dragged, not stored and
  not changed by a width set from code, and the widths beside the content do not reach the overlay.
- A declared overlay width that is not a positive number is refused when the distribution is composed,
  naming the region.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: *A panel region may declare its own widths* lets a panel region declare its overlay
  width, capped to the screen, and refuses one that is not a positive number.

## Impact

- `PanelRegion` gains one optional field. Existing layouts compile and behave as before.
- The panel component sizes its overlay from the declaration instead of a fixed class.
- NextPA finding F-015, addendum of 2026-09-13.
- No legacy source is dissolved by this change.

## Non-Goals

- **Resizing the overlay by dragging.** A thin handle on a phone's edge is hard to hit, the overlay is
  open only briefly, and a width bounded by the screen always fits.
- **A CSS length for the overlay width.** A free string would make a typo a silent no-op; a number with
  the workbench's own cap gives the same result checked.
- **Changing when a viewport counts as narrow**, or the overlay's position, scrim or motion.
