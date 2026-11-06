> **Status:** approved.

## Why

Three places in the workbench decide something the user can see without a rule behind it.

A view opened in the content area also keeps its place in its sidebar. When a plugin brings that
view forward, the workbench makes current whichever copy it happens to find first, which can be a
copy the user has not looked at for a long time.

A tab hidden in the overflow of a strip is moved to the front of its band when it is activated. On a
strip the distribution does not let the user reorder, that is the workbench reordering it for them.

A click on a tab in a pane that does not carry the address moves the address there. A click on the
same pane's add-tab button, which opens content in it, does not.

## What Changes

- A surface that stands in several places is brought forward where it was current most recently.
  Where none of its copies was ever current, the copy in the pane that carries the address wins,
  and otherwise the first in reading order.
- On a strip the user may not reorder, a hidden tab that is activated keeps its place: the strip
  scrolls to show it, and the overflow list marks it as the active one. A strip the user may reorder
  behaves as before.
- A pane's own button that opens or activates content in that pane moves the address to it, as a
  click on its tab does. A button that only runs an action leaves the address where it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: bringing a surface forward chooses among its copies.
- `content-tabs`: a strip that may not be reordered keeps its order when a hidden tab is activated.
- `panes`: the add-tab button moves the address, and an action-only button does not.

## Impact

The shell's reveal path, the tab strip's overflow handling and the pane view. A product or plugin
author does not have to change anything; the behaviour a user sees changes in the three cases
above, so `docs/updating.md` notes them.
