> **Status:** approved.

## Why

A docked view can be dragged into the main area, and its tab there is the same tab it had in a
sidebar. When the main area is a single pane, right-clicking that tab opens nothing at all. When the
area has been split, the same tab in a split pane opens the view menu with the workbench's entries
and any entry a plugin contributed for that view. The same tab and the same gesture give a menu or
nothing depending on whether the area happens to be split, and the workbench's own entries for a
view, moving it, stacking it, resetting it, opening it in a window, hiding it, are unreachable there.

NextPA found this dragging its chat into the Studio's unsplit main area (finding F-020): a plugin
entry it registered on the view menu never appears there, while it does in a sidebar and in a split
pane.

## What Changes

- A view's tab in the main area offers the view menu on the right-click whether or not the area is
  split, with the workbench's entries and any plugin entry for that view, exactly as it does in a
  split pane. The entries that act on the view's region, moving it to a sidebar and stacking it, act
  from the main area as they already do from a split pane in it.
- Nothing changes for a content tab in the main area, which keeps its own menu, or for a view's tab
  in a sidebar or in a split pane, which already behave as required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: the requirement *A pane is one kind of thing everywhere* says the same gestures apply to
  work wherever it sits. A scenario is added saying a view's tab offers its menu in the main area
  whether or not the area is split, which is where the implementation fails it today.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/content-area.html` hands its tab strip the view
  menu slot and the region a view tab stands in; its spec pins it.
- `docs/weaver/menus.md` already says the view-tab menu is one mechanism in every region, and
  `docs/the-workbench.md` already says the shell draws its menu on a sidebar view; neither needs a
  word changed, because the guides describe what the specification required all along.
- NextPA's `loomweaver-findings.md` marks F-020 fixed once a release carries this; that happens in
  a NextPA session, not here.

No legacy source is dissolved by this change.
