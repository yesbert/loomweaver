> **Status:** approved.

## Why

Three entries of the workbench's own tab menus are drawn where they cannot do anything, established
in the testbed on 2026-09-14:

- *Split right* and *Split down* on a content tab take the tab out of its group into a new pane.
  When the tab is the only one in the address-carrying group, that would leave the group empty, so
  the command refuses and the entry does nothing. The pane's toolbar beside it duplicates instead and
  works; the menu entry looks the same and is dead.
- *Move to other sidebar* on a view's tab in the main area looks up the region the tab stands in
  among the layout's regions. The main area is a dock of the pane tree, not a layout region, so
  nothing is found and the entry does nothing.
- *Open in content* on a view's tab that already stands in the main area lays a second copy of the
  view beside it. Copying a view is a deliberate gesture the workbench offers as *Stack below*,
  which stays; this entry only repeats it under a name that says "open", so a person choosing it
  expects the view to be brought somewhere and gets a second one instead.

The menus capability says an entry that cannot work is not drawn. These three are.

## What Changes

- A content tab's split entries are offered only while the tab has company in its pane. A tab alone
  in its pane keeps the pane toolbar as its way to split.
- *Open in content* and *Move to other sidebar* are offered on a view's tab only while the tab
  stands outside the main area. *Stack below*, *Reset view*, *Open in new window* and *Hide* stay
  where they are.
- A tab's menu context says whether the tab is alone in its pane and, for a view, whether it stands
  in the main area, so that an entry a plugin contributes can make the same distinctions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: a requirement is added saying that the entries of a tab's menu that take the tab
  somewhere are offered only where they can, with the three cases as scenarios. It is added rather
  than folded into *A pane is one kind of thing everywhere*, which another open change extends.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.ts` adds `sole` to every
  tab's menu context and `inContent` to a view tab's.
- `platform/libs/core/shell/src/lib/regions/content/tabs/tab-context-menu.ts` gives the two split
  entries the condition `sole: false`; its spec pins it.
- `platform/libs/core/shell/src/lib/regions/panel/view-context-menu.ts` gives *Open in content* and
  *Move to other sidebar* the condition `inContent: false`; its spec pins it.
- `docs/weaver/menus.md` names the two context fields beside the ones a tab already carries.

No legacy source is dissolved by this change.
