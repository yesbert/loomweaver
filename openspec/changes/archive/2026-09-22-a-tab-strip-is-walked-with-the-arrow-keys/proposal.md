> **Status:** approved.

## Why

Every tab in a strip is announced as a tab in a tab list, and every one of them is a tab stop of its
own. A keyboard user who hears "tab 2 of 5" presses the arrow keys, as the tabs pattern teaches, and
nothing happens; a strip with ten tabs costs ten presses of Tab before the next control. Nothing is
out of reach, so this is not a failure of the accessibility bar, but it is not what the announced
structure promises. NextPA reported it as finding F-033.

## What Changes

- **A tab strip is one tab stop.** Tab enters a strip on its selected tab and the next Tab leaves the
  strip. Shift+Tab back into the strip lands on the selected tab too.
- **The arrow keys walk the strip.** Left and Right move the focus to the previous and next tab,
  wrapping at the ends; Home and End jump to the first and the last tab.
- **Moving the focus does not choose.** Enter or Space chooses the focused tab, as a click does today.
  Choosing a tab navigates and may load content, so walking past five tabs does not open five.
- Keys with a modifier keep their current meaning: Alt with an arrow still reorders, Alt+Shift with an
  arrow still moves a view to the other side, Delete still closes.
- This holds for every strip the workbench draws: the panes of the main area, the sidebars and a
  container's inner strip.

No new call, option or type. It is a behaviour change for keyboard users, and it is fixed: a
distribution cannot switch it off or choose that the focus selects.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: *A tab strip stays a valid tab list* gains the tabs keyboard pattern: one tab stop
  per strip, arrow keys and Home/End to move, Enter or Space to choose. Its scenario that focus lands
  on each tab is restated for the arrow keys.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/chrome/`: a new directive on the tab list that keeps
  one tab focusable and moves the focus on the arrow keys; `pane-tab-strip.html` applies it.
  `pane-tab-strip.ts` stays as it is, because it is close to the 400-line limit.
- Unit tests beside the directive; an end-to-end test in the testbed for a pane strip and a container's
  inner strip.
- `docs/reference/accessibility.md`, `llms-full.txt`.
- NextPA finding **F-033**.
- Behaviour change without an API change: a keyboard user reaches the controls after a strip with one
  press of Tab instead of one per tab, and walks the tabs with the arrow keys.
