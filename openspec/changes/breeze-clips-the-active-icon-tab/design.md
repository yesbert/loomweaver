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

## Goals / Non-Goals

**Goals:**

- Know the clipping box and the viewport before touching either stylesheet.
- A fix that holds for every look, not a Breeze-only patch, where the cause is the strip.

**Non-Goals:**

- No rethinking of the looks. Breeze may keep its circles.
- No change to how the strip scrolls or overflows beyond what the cut needs.

## Decisions

### Reproduce first, at the reporter's size

The report is a crop without a window size. The fix differs by cause: a header height that Breeze
outgrows is a look defect, a row that scrolls its first tab half out of view is a strip defect. A
guess at either would fix the wrong one. The reproduction is therefore the first task and its result
is written here before the fix task is started.

### Where the strip is at fault, the fix lives in the shell and the change gains a delta

The demo's looks may round what the shell draws; a strip that cuts a rounded tab cuts it in every
product that rounds. That is a guarantee about the strip, so it goes to the capability that carries
the strip, and the fix goes with it. `skip_specs` is then removed from this change.

## Risks / Trade-offs

- **The cut cannot be reproduced.** → Ask the reporter for their window size; until then the check
  is written for the narrowest viewport the demo supports, where the 40 px tabs make the cut most
  likely.
