## Context

See `proposal.md`, Why. What already stands, established by reading the code on 2026-09-13:

- **The panel component already knows the viewport is narrow.** On a compact viewport it returns no
  inline width, binds a fixed width class of 288 pixels, and shows no splitter. The overlay itself is
  positioned by the frame around it; the panel only sizes its own box.
- **Panel widths are resolved from the layout** in one place that fills undeclared values with the
  workbench's, and providing the layout refuses contradictory widths naming the region.
- **`PanelRegion` is the only region type that carries widths**, so a new field there stays off bars,
  rails and the content area by type.

## Goals / Non-Goals

**Goals:**

- A panel's overlay width comes from its declaration, with today's 288 pixels as the fallback.
- An overlay never runs off the screen and always leaves room to dismiss it.
- A wrong declaration fails where it is written.

**Non-Goals:**

- Dragging, storing or setting the overlay width from code.
- Any change to the frame's overlay position, scrim, motion or the narrow breakpoint.

## Decisions

**The overlay width is a number of pixels.** The owner chose it over a CSS length: every other width
on the region is a number, and a free string would turn a typo into an overlay that silently keeps its
default. The screen bound a CSS length would have expressed is applied by the workbench instead, so a
product gets the same result without writing it.

**The cap is expressed in the panel's style, not measured.** The panel binds its overlay width as
`min(<declared>px, 100vw - 3rem)`. The browser applies it on every resize without a listener, the
margin follows the user's text size because it is in `rem`, and 3rem is the room a thumb needs to
reach the scrim beside the overlay. Measuring the viewport in script would duplicate what the style
engine already does and lag a rotation by a frame.
*Alternative considered:* capping in the size resolution with the window's width. It needs a resize
listener for a value that is purely presentational.

**The fallback keeps today's look.** Without a declaration the overlay is 288 pixels, which is what the
fixed class gives now; the class is replaced by the same style binding so there is one path.

**It is validated beside the other widths.** Providing the layout refuses an overlay width that is not a
finite number above zero, with the region named, in every build. It is not related to the narrowest or
widest width beside the content, because the overlay is a different presentation and a phone-sized
overlay may well be narrower than the desk panel's minimum.

## Risks / Trade-offs

- **A declared overlay width wider than a small phone is quietly capped.** → That is the intent; the
  guide says so, and the cap only ever narrows.
- **The 3rem margin is a fixed choice.** → It can be revisited without changing the contract, which
  states only that room to dismiss remains.
