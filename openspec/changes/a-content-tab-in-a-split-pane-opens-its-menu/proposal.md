> **Status:** approved.

## Why

A content tab in the pane that carries the address offers a menu on the right-click: split right and
down, close, close others, close to the right, close all, pinned, open in new window, and whatever a
plugin adds. The same tab in any other pane of the main area, after a split, offers nothing at all:
the right-click opens an empty menu. Reproduced in the testbed on 2026-09-14 with the *Search* tab
after *Split right*. The panes capability says every pane is one kind of thing and the same gestures
apply wherever work sits; a tab whose menu depends on which pane it landed in fails that, and it is
the mirror of the gap the view tab had until #408.

The entries exist and act on the address-carrying group only: they know the tab, not the pane.

## What Changes

- A content tab offers the tab menu in every pane of the main area. Its entries act on the pane the
  tab stands in: closing, closing the others, closing to the right and closing all act on that pane's
  tabs and keep its pinned and unclosable ones; pinning anchors the tab in that pane; splitting makes
  the sibling beside that pane; opening in a new window is the same everywhere. A close that would
  lose unsaved work asks first, in every pane.
- A content tab's menu context names the pane the tab stands in and whether that pane carries the
  address, so that a plugin's entry can act on the right pane or restrict itself to the primary one.
- Nothing changes in the address-carrying pane: the same entries, the same behaviour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: the requirement *A pane is one kind of thing everywhere* gains the statement that a
  content tab offers its menu in every pane of the main area, acting on that pane, with a scenario
  for a tab in a split pane.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.ts` adds the pane and
  whether it is primary to a content tab's menu context.
- `platform/libs/core/shell/src/lib/regions/pane/pane-view.html` hands its strip the tab menu slot,
  as the root area does.
- `platform/libs/core/shell/src/lib/regions/content/tabs/tab-context-menu.ts` routes each entry by
  the pane in the context; `tab-closing.service.ts` and `pane-move.service.ts` learn to act on a
  named pane, with the address-carrying pane as the case they already handle.
- `docs/weaver/menus.md` names the two new context fields beside the ones a content tab carries.

No legacy source is dissolved by this change.
