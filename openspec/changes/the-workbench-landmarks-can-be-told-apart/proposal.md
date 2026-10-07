> **Status:** approved.

## Why

NextPA found in 0.14.6 (finding F-044), with the audit's best-practice rules over three of its
distributions, that the workbench's landmarks cannot be told apart and that much of what it draws
lies outside all of them:

- the top bar and the status bar are both `banner`;
- neither side panel is named, and neither bar is;
- every tab strip lies beside the landmarks rather than inside one;
- with the content area split, only the first pane is `main`, and the second pane's surface lies
  outside every landmark;
- the strips are real tab lists, but no element is a tab panel, so a surface is not named by the tab
  it is opened under.

One of these fails a requirement the contract already states: *The workbench's structure is
announced, not just drawn* says that where two regions are of the same kind each is distinguishable
by name, and its scenario *Two sidebars are told apart* is not met. The rest is what a screen-reader
user meets when listing the regions of the interface, and what the audit reports for every
distribution.

## What Changes

- **The content area is the one `main`**, with all its panes and their tab strips inside it, however
  it is split.
- **Every pane body is a tab panel** named by its active tab, and every tab says which panel it
  controls. This holds for the panes in the side panels too.
- **Each side panel is a named complementary region**, with its tab strip inside it where the strip
  sits beside the panel. Where a panel's header floats in the top row, the strip stays outside; that
  limit is stated in the requirement.
- **The top row is one `banner` and the bottom row one `contentinfo`**, each named. The bars a
  distribution declares inside them are named groups, so several bars at one edge no longer make
  several banners.
- The skip link keeps its target, the body of the pane that carries the address, which is now a tab
  panel inside `main`.
- The requirement *The workbench's structure is announced, not just drawn* gains the scenarios that
  pin all of this, and the testbed's audit runs the landmark rules over a split content area.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: *The workbench's structure is announced, not just drawn* states which landmarks
  exist, that each is named, that the content area is one `main` however it is split, and that every
  pane body is a tab panel.

## Impact

- `platform/libs/core/shell/src/lib/shell.html`: the top and bottom rows as `<header>` and
  `<footer>`.
- `platform/libs/core/shell/src/lib/regions/bar/shell-bar.html`: a bar is a named group, not a
  landmark.
- `platform/libs/core/shell/src/lib/shell-edge.html` and
  `platform/libs/core/shell/src/lib/regions/panel/shell-panel.html`: the named complementary region
  around header and panel.
- `platform/libs/core/shell/src/lib/regions/content/`: the content grid carries `main`.
- `platform/libs/core/shell/src/lib/regions/pane/pane-view.html` and the pane tab strip: tab panels,
  `aria-controls`, and the address pane's body no longer `main` itself.
- `platform/libs/core/shell/src/lib/i18n/en.json`, `de.json`: the landmark names.
- `platform/apps/loom-testbed-e2e/src/a11y.spec.ts`: the landmark rules over a split content area.
- `docs/reference/accessibility.md`: the landmarks as the requirement states them.
- NextPA finding **F-044**.
- The `main` role moves from the address pane's body to the content area; `#lw-main-content` stays
  where it is. A consumer test that finds the pane body by the `main` role changes. Ships as a patch,
  with the move named in the release notes.
