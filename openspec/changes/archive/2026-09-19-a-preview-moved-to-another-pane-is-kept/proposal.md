> **Status:** approved.

## Why

A pane is promised one preview slot, but moving a preview between panes keeps or drops its preview
state depending on where it came from. Only a preview that leaves the pane carrying the address
becomes permanent; one dragged from any other pane stays a preview. Dropped onto a pane that already
shows a preview, it leaves that pane with two, and the next preview replaces only one of them while
the other stays italic until someone keeps it by hand.

The two descriptions a plugin author reads disagree as well: the brief says a preview opens in the
single slot "of the URL strip", the published type says "per pane". Both are half true, and neither
says that the pane receiving a preview is the one the person last focused.

This is a defect against *One preview slot per pane, promoted only on purpose*, reported by NextPA
as part of finding F-030.

## What Changes

- Moving a preview tab into another pane SHALL make it permanent, whichever pane it leaves and
  whichever it joins, by drag, by menu or by keyboard. Moving it within its own strip changes nothing.
- The requirement states where opening a preview lands: in the slot of the pane carrying the address.
  That is what the workbench does today; it was never written down.
- The brief, the published type's documentation and the weaver guide say the same thing: one slot
  per pane, filled in the pane carrying the address, and a move makes a preview permanent.

Assumption recorded here rather than asked: a move promotes rather than carrying the preview along.
It is the rule the editor this behaviour was modelled on follows, it is the rule the workbench already
applies to the most common move, and carrying the flag along would need a second rule for a pane
that already holds a preview.

Out of scope: opening a preview in a pane other than the one carrying the address. That is the other
half of F-030 and a change of its own, *a-tab-opens-beside-the-pane-carrying-the-address*.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: *One preview slot per pane, promoted only on purpose* says which pane's slot an
  opened preview fills and that moving a preview to another pane promotes it, with scenarios for
  both and for the pane that already holds a preview.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-move.service.ts`: the tab that departs
  loses its preview state on every move between panes, not only on one leaving the pane carrying
  the address.
- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-move.service.spec.ts`: the existing test
  for a preview leaving the address pane stays; tests for the other directions are added.
- `platform/libs/core/plugin-sdk/src/lib/content-route.ts`: the JSDoc on `OpenTabInput.preview`.
- `llms-full.txt` (the `OpenTabInput` comment) and `docs/weaver/content-area.md` (*Preview tabs*).
- NextPA finding **F-030**, first half: the preview that stops being one when it is moved. NextPA
  read the drop of the flag as the defect; the defect is that the drop happens in one direction only.
- No breaking change for a plugin: no call changes meaning. A person who dragged a preview between
  two panes that were both away from the address now gets a permanent tab, as they already did when
  dragging it out of the pane carrying the address.
