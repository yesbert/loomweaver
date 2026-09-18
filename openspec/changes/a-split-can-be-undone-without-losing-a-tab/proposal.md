> **Status:** approved.

## Why

A split made by dragging cannot be undone cleanly, in two ways. Dragging a tab out of the pane that
carries the address and back into the pane it came from does nothing, because that pane's strip has
silently stopped being a drop target. And closing a pane closes every tab in it, including the ones
the arrangement declares unclosable and the pinned ones, although the contract already says a bulk
close spares exactly those. A distribution whose content is a fixed set of tabs loses one of them to
a single click on the pane's close control.

Both are defects against requirements that already exist. What is added is the wording that names
closing a pane and undoing a split as bulk closes, and the scenarios that pin the two edges that
slipped.

## What Changes

- A pane's strip SHALL stay a drop target for as long as the pane exists, whichever part of the
  workbench draws it and whether or not it carries the address. The registration of drop targets
  stops removing a pane's fresh registration when the component that drew the pane before goes
  away.
- Closing a pane and undoing a split SHALL spare what a bulk close spares: a tab the arrangement
  declares unclosable and a pinned tab. They are handed to the pane that takes the closed pane's
  space, keeping their instance; everything else closes as it does today, with the same question
  about unsaved work.
- A distribution that switches closing off gets the same rule applied to every tab, so closing a
  pane there joins its tabs to the neighbour rather than discarding them.

Assumption recorded here rather than asked: pinned tabs are spared as well as unclosable ones,
because the existing bulk-close requirement names both in one sentence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: *Closing in bulk spares what must not go* names closing a pane and undoing a split
  as bulk closes, says where the spared tabs go, and gains scenarios for both.
- `panes`: *Dropping decides between joining and splitting* states that a pane's strip stays a
  target for as long as the pane exists, with a scenario for the pane the address has just left.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-drag.service.ts`: `registerStrip` and
  `registerZone` unregister only their own registration.
- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-handover.ts` (new): the pure tree
  edits that hand spared tabs to the receiving pane and remove the closed one.
- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-tree.service.ts`: `closePane`,
  `collapsePrimary` and `unsplit` take the rule of what to keep.
- `platform/libs/core/shell/src/lib/regions/pane/pane-actions.service.ts`: `close` and `unsplit`
  pass that rule and ask about unsaved work only in the tabs that really close.
- `platform/libs/core/shell/src/lib/regions/content/tabs/content-tabs.service.ts` and
  `tab-closing.service.ts`: closing the pane carrying the address applies the same rule; the
  published `closePrimaryPane()` keeps its signature.
- `docs/distribution-api/panes.md`, `llms-full.txt` and the JSDoc on `PaneService.closePane` and
  `unsplit` say what a pane close spares.
- `platform/apps/loom-testbed-e2e/src/split-undo.spec.ts`: the reproduction of the drag defect,
  kept as its regression test.
- NextPA findings **F-028** and **F-029** are what this answers. NextPA's diagnosis of F-029 (a
  missing `acceptsTabs` binding) does not hold on `main`; the cause is the drop-target registration,
  and it affects every tab, not only unclosable ones.
- No breaking change: nothing that could be done before stops working, and no tab that closed
  before and could be closed survives it.
