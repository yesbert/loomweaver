> **Status:** approved.

## Why

Every side panel opens 256 pixels wide and can be dragged between 180 and 480, in every distribution
and whatever it holds. A navigation tree is comfortable at that width. A chat docked in a panel is
not: it wants to start wider, and a person reading a long answer may want more than the maximum.

A distribution cannot say so. A layout region carries its identity, kind and dock and nothing else,
and the three numbers are constants inside the workbench. A stylesheet cannot override the width,
because the width is set inline and a forced rule would pin it against the splitter and against
collapsing. Setting the width from code on every start is no substitute either. The workbench does
not store a width equal to its default, so it cannot tell a person's deliberate choice from no choice
at all; the product would overwrite that choice on every load, and the app reset would show the
default until the next reload.

NextPA raised this as F-015, for the panel that now holds its docked chat.

## What Changes

- A panel region can declare its own default, minimum and maximum width. Each is optional and falls
  back to today's value, so a layout that declares none is unchanged.
- The default is what the panel shows until a person resizes it and what the app reset returns it
  to. The minimum and maximum bound dragging, keyboard resizing, a width set from code and a stored
  width, for that panel only.
- Every width a person releases, or a distribution sets from code, is remembered, including one equal
  to the default. A person's choice therefore survives a distribution later changing its default.
- Widths can only be declared on a panel region. A declaration whose minimum exceeds its maximum, or
  whose default lies outside its own bounds, is refused when the distribution is composed.
- On a viewport narrow enough for panels to become overlays, the overlay keeps its own width; the
  declared widths apply beside the content only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: *A panel can be collapsed and resized, and remembers both* constrains the width to
  the panel's own range and remembers every released width. *The sidebars are reachable to the
  distribution* brings a width set from code into that panel's range. A requirement is added, *A
  panel region may declare its own widths*.

## Impact

- The layout region type gains optional width fields, available on panel regions only. Existing
  layouts compile and behave as before.
- Stored widths keep their storage key and format. A stored width is clamped to its panel's current
  bounds when read, so a width stored under older bounds is corrected rather than kept.
- NextPA finding F-015.
- No legacy source is dissolved by this change.

## Non-Goals

- **Heights, or widths for bars, rails and the content area.** Only side panels are resized by a
  person today.
- **The overlay's width on a narrow viewport.** It stays as it is; a declared maximum larger than a
  phone is not a concern there because the declaration does not apply.
- **A width expressed relative to the window.** Pixels are what the splitter, the keyboard step and
  storage already use.
