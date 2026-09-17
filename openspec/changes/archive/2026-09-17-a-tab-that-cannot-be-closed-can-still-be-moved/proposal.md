> **Status:** approved.

## Why

The tab strip refuses to drag or reorder a tab that is neither closable nor pinned, so a surface
declaring that its tab may not be closed loses two gestures that have nothing to do with closing.
The contract promises the opposite in as many words: a tab declared unclosable "can still be moved,
split and dragged elsewhere; only closing is refused", and the workbench's own reordering guarantee
names no such condition. A pinned tab, which is guarded against closing just as firmly, keeps both
gestures, which shows that being fixed in place was never the reason.

It reaches further than a single surface. The strip folds the distribution's switch into each tab's
closability, so a distribution that switches closing off makes every tab unclosable and thereby
loses all dragging and all reordering, although it switched neither off. That is the case a product
is most likely to meet, and nothing in the contract prepares it.

This is a defect, not a missing capability: the requirements are already there and the
implementation does not meet them. What is added is the pair of scenarios that pin the edge which
slipped.

## What Changes

- Whether a tab may be dragged into another pane, and whether it may be reordered within its band,
  SHALL depend on the distribution's switches alone. Closability decides closing, and nothing else.
- Keyboard and mouse SHALL agree about the bands. The strip tells the pointer three bands apart
  (pinned, closable, fixed) and the keyboard only two, so a fixed tab made movable would jump a band
  from the keyboard that the pointer refuses. The band a tab is in becomes one statement read by
  both.
- A pane's remembered order SHALL carry its fixed tabs too, and keep behaving as the existing
  guarantee says: the order belongs to the pane, a new tab lands at its natural place, and gone tabs
  are forgotten.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: the reordering requirement gains two scenarios — a tab that cannot be closed is
  still reordered, and a distribution that switched closing off still reorders its tabs. No
  requirement text changes.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.ts` — `canDrag` and
  `canReorder` ask the switches alone; the band becomes one statement.
- `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.html` —
  `data-reorder-band` carries the same three bands the pointer path uses.
- `platform/libs/core/shell/src/lib/regions/content/content-area.ts` — the remembered order now
  receives fixed tabs as well; verified rather than assumed.
- NextPA finding **F-026** is what this answers. NextPA's chat distribution, whose released
  assistants each hold a fixed tab, gets dragging and reordering back with no change of its own.
- No breaking change: nothing that could be dragged before stops being draggable.
