> **Status:** approved.

## Why

A surface is mounted in a pane, and the user decides how wide that pane is. Splitting the content
area halves the pane while the window stays exactly as wide as it was. Any surface that sizes itself
against the window therefore keeps a layout that no longer fits, and its content runs out of the
cards that were meant to hold it.

Two surfaces do exactly that, and they are the two dashboards: the testbed's and the demo's. They
are also the last two view templates in the whole weaver code that still size against the window.
Every other view was converted to container-relative sizing already, so this is a gap left behind
rather than a decision being revisited.

That the gap survived in the two views most likely to be shown side by side is the argument for the
second half of this change. Nothing in the workbench tells an author that a surface lives in a pane
rather than in the window, and nothing gives the author the pane's width to size against. Each view
has to establish that context for itself, at its own root, and a view that forgets gets a layout
that looks correct in every test run at full width. We forgot it twice.

## What Changes

- The workbench gives every surface a named sizing context that tracks the pane it is mounted in.
  An author can size against the pane without arranging anything, and a surface keeps sizing against
  its pane when the user drags it somewhere else.
- Both dashboards size against their pane instead of the window: the testbed's and the demo's
  insights dashboard.
- Both dashboards stop being held open by their own content. A card whose contents cannot shrink,
  the chart canvases in particular, keeps its column from ever narrowing, so the columns are allowed
  to shrink and the contents to reflow.
- Fixed measures that only work at one width give way: the deadline column, the two chart heights
  and the row of seven weekday labels.
- End-to-end tests open a narrow pane and pin that neither dashboard overflows it horizontally.
- The tour recording becomes a committed tool rather than a session artifact. Today
  `assets/media/tour-*` exists and nothing in the repository can reproduce it; the script that
  produced it was never checked in and is not recoverable from any tree, branch or stash.
- The tour is recorded again, because a split pane is one of the four things it shows and the
  overflow is at its most visible there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: a new requirement stating that a surface is given the pane as the thing it sizes
  against, and that this holds at every mount point. It sits beside *A surface owns its edges unless
  something asks otherwise*, which settles the other question about a surface and its pane edges.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/content-area.html` — the content host that must
  establish the sizing context, alongside the secondary pane and the sidebar hosts that mount a
  surface.
- `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-dashboard-view.html` and its component,
  which computes the weekday rows the template lays out.
- `demo/src/insights/dashboard-view.html` and the chart wrappers in it.
- `platform/apps/loom-testbed-e2e/src/` and `demo/e2e/` — a narrow-pane test each.
- `platform/tools/` — the new recording tool, beside the other checked-in tools.
- `assets/media/tour-light.*`, `assets/media/tour-dark.*` and both posters, replaced. The website
  copies them through `website/tools/sync-docs.mjs`, which fails on a missing file, so the set has
  to stay complete.
- `docs/reference/design-tokens.md` — the page a template author reads before writing one, which
  today says nothing about the pane being the thing to size against.

No legacy source is dissolved by this change.
