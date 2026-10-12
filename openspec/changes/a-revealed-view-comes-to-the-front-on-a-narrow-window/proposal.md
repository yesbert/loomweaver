> **Status:** approved.

## Why

`ctx.revealSurface(id)` brings a docked view to the front, and its documentation promises it does so
"wherever the user has placed it", expanding a collapsed sidebar. On a wide window it does. On a
window narrow enough for the side panels to be overlays it does not, found on 2026-10-12 with the
testbed's "Open the entry list" (tried at 700 and 500 pixels, in Chromium and WebKit):

- **Nothing happens at all in a fresh session.** A sidebar fills its arrangement from the views
  declared for it only when it is drawn, and on a narrow window it is drawn only while its overlay is
  open. The view is in no arrangement yet, so the call finds nothing and does nothing; even opening
  the panel afterwards shows the first view, not the one asked for.
- **Once the panel has been drawn, the view is made current but stays out of sight.** Revealing
  expands a collapsed panel; a closed overlay is not collapsed, so it stays closed.

Revealing always follows something the person did, a command or a button, and the person then sees
nothing. Nothing in the contract states this guarantee, so it is written now, for both widths. The
owner decided on 2026-10-12 that a reveal opens the overlay.

## What Changes

- Revealing a view that sits in a side panel brings that panel into view on a narrow window too, by
  opening its overlay, as it expands a collapsed panel on a wide one.
- Revealing a view finds it where it is declared even when its panel has never been drawn.
- A view that is hidden, unknown or placed nowhere stays a no-op, as documented.
- A requirement in `surfaces` states what revealing guarantees.

No API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: a plugin can bring a docked surface to the front, and it is then in view on any width.

## Impact

- `platform/libs/core/shell/src/lib/regions/reveal/surface-reveal.service.ts` and its spec.
- `platform/libs/core/plugin-sdk/src/lib/plugin/plugin-context.ts`: the JSDoc of `revealSurface`.
- A testbed e2e test at a narrow width.
- `llms-full.txt` where it describes `revealSurface`.
