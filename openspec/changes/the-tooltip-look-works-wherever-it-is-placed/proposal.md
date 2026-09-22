> **Status:** approved.

## Why

A product that shows structured content on hover, such as every tag of a knowledge base entry as a
badge, cannot give it the workbench's tooltip look. `<lw-tooltip>` carries text only. Its look,
`.lw-tooltip-bubble`, cannot be put on an element of the product's own, because the class also
places the bubble in the browser's top layer (fixed position, no pointer events), which fights a
host that places its own tooltips, such as a data grid. And a `.lw-badge` inside the bubble is drawn
for ordinary surfaces, while the bubble is inverted: dark in the light appearance, light in the dark
one. NextPA reported this as finding F-031 and drew its own bubble with other tokens.

## What Changes

- **`.lw-tooltip-bubble` becomes a class contract for the tooltip's look alone.** Background, text,
  radius, padding, shadow and type size stay on the class; the placement moves to the bubble that
  `<lw-tooltip>` creates itself. A product puts the class on its own element, inside whatever
  container places it, and gets the workbench's tooltip look without being moved.
- **A badge inside a tooltip bubble adapts to it.** The neutral `.lw-badge` takes its colours from the
  tooltip tokens there, readable at AA in both appearances. The tone modifiers keep their own fills,
  which are readable on any background. No new class name.
- `<lw-tooltip>` itself looks and behaves exactly as before.
- The design-token guide, the brief and the element's documentation say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `theming`: a requirement is added that the tooltip's look is available as a named class apart from
  its placement, and that a badge inside it stays readable in both appearances.

## Impact

- `platform/libs/core/shell/src/lib/styles/theme.css`: `.lw-tooltip-bubble` is split into its look and
  the placement of the element's own bubble; a contextual rule for `.lw-badge` inside it.
- `platform/libs/core/shell/src/lib/elements/tooltip/lw-tooltip.element.ts`: its doc comment.
- The frame kit's precompiled styles pick this up from the same file; an isolated surface gets the
  same classes.
- An end-to-end test in the testbed; `docs/reference/design-tokens.md`, `llms-full.txt`.
- NextPA finding **F-031**, whose fix direction named a class contract; this keeps the existing name
  instead of adding one.
- No breaking change: nothing that uses `<lw-tooltip>` changes. An element that already carried
  `.lw-tooltip-bubble` by hand stops being fixed-positioned, which is the point.
