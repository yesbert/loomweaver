## Context

See `proposal.md` — Why. What is known before the reproduction:

- **Breeze rounds icon buttons to circles.** `:root.look-breeze .lw-icon-btn { border-radius: 9999px }`
  in the demo's look stylesheet, and the active tab of an icon strip carries `lw-icon-btn`.
- **The icon strip's row clips.** The strip's tab row is `overflow-hidden`; the sidebar header host
  is a fixed `h-12` while Breeze sets the strip to `3.25rem`. At 1280 px on macOS the active tab
  measured 28 × 28 inside a 220 × 28 clipping row and was drawn whole; below the `md` breakpoint the
  tab is 40 × 40.
- **What the screenshot shows.** A circle cut at top and left, a divider, the collapse control, and
  the right rail's "Assistant" entry with its label on; beneath it the content pane's toolbar. That
  is the right sidebar's header on a viewport narrow enough for the 40 px tabs, or a strip whose row
  has scrolled.
- Screenshots taken while sizing the report are under `.claude/tests/breeze-*.png`.

## What the reproduction found (2026-09-07)

- **The element in the screenshot is not an icon tab.** The crop shows the top bar's end on a compact
  viewport: the pressed "System" option of the scheme toggle (a monitor glyph, drawn as a circle by
  Breeze's rounding of `.lw-segmented-item`), the bar's edge, the right sidebar's hamburger, the rail's
  "Assistant" entry with its label on, and the content pane's toolbar beneath. The crop's own top-left
  corner runs through that circle, which is what reads as a cut.
- **Nothing clips on macOS.** Measured in Chromium, Firefox and WebKit at 390, 480, 600, 700, 767, 768,
  900, 1024 and 1280 px, with the rail labels on and off, in Breeze and in the default look: the
  pressed option is 28 × 28 at 3,3 inside a 94 × 34 control with `overflow: visible`, and no ancestor
  with a clipping overflow cuts it. The sidebar headers' icon tabs (28 × 28 from 768 px up) are drawn
  whole as well; below 768 px the panels are overlays and carry no icon strip.
- **What is left.** Either the reporter's browser on Windows paints the fieldset differently, or the
  cut is the crop. The change waits for the reporter's browser and an uncropped screenshot before any
  stylesheet is touched. Screenshots of the runs are under `.claude/tests/repro*.png`.

## What the second look found (2026-09-07, with the owner's reproduction in Chrome)

The owner saw it at once: in Breeze the header bar is taller than in the other looks, and the rows
beside it are not. Measured: top bar 56 px; sidebar heads 52 px on a wide window and 48 px as
hamburger boxes on a narrow one; the content strip 52 px. In the default look and in Aurora every
one of those is 48 px. Breeze's stylesheet sets the bar to 3.5rem and the tab strips to 3.25rem and
leaves the hamburger and expand boxes alone, so the header line steps at both edges of the bar.

## Goals / Non-Goals

**Goals:**

- One bottom edge along the whole header line in Breeze, wide and narrow.
- A check that keeps it so for every look the demo ships.

**Non-Goals:**

- No dimension token in the workbench. The guide says why there is none, and this defect is the look
  not doing what the guide describes, not the workbench lacking a lever.
- No change to Breeze's circles.

## Decisions

### The look sets one height for every row on the header line

Breeze sets its 3.5rem on the top bar, on the sidebar heads' hamburger and expand boxes, and on the
icon strips the heads hold, with selectors on the workbench's elements as the guide describes. The
content pane's tab strip stays at Breeze's 3.25rem, because it hangs below the header line rather
than standing on it, and its height is a matter of the look's rhythm rather than of alignment.

The alternative, a workbench token for the row height, was rejected: the guide's position that
dimensions are not tokens is a decision with a reason (every tokenised number becomes a promise no
release can revise), and one look that forgot two rows is not the case that overturns it.

### The check measures edges, not pixels

The demo test reads the bottom edge of the top bar and of each sidebar head and asserts they are
equal, per look, at a wide and a narrow width. It does not compare screenshots, which would fail on
every font.

## Risks / Trade-offs

- **A future workbench change adds another element to the header line.** → The check catches a
  step in Breeze the next night, which is the point of it.
