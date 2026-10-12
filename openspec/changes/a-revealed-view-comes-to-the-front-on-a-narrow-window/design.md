## Context

`SurfaceRevealService.reveal` searches every dock's pane tree for the view's tab, activates it, and
expands the dock's panel through `PanelState.expand`. Two facts defeat it on a narrow window:

- A side panel's tree is filled from the views declared for it by `PanelGroupService.seed`, which
  `ShellPanel` runs when it is drawn. A tree still in its default shape is not stored at all. On a
  narrow window the panel is drawn only inside its open overlay, so in a fresh session its tree does
  not hold the view.
- The narrow window's overlay is a state of its own in `PanelState` (`openOverlay`), separate from
  the collapsed flag that `expand` clears.

## Goals / Non-Goals

**Goals:** a reveal puts the view in view on every width, and finds a view in a panel never drawn.

**Non-Goals:** revealing a hidden view (that stays the person's decision, and `showView` exists for
a distribution); routable surfaces and container children, as documented.

## Decisions

**Seed the declared panel when the view is in no tree.** When no tree holds the view's tab, the
service looks up the region the view is declared for and, unless the view is hidden there, seeds that
region the way drawing it would, then searches again. Seeding is what drawing does, so the arrangement
the person later sees is the one they would have got anyway. Rejected: seeding every panel at
start-up regardless of whether it is drawn, which would write arrangements for panels a distribution
never shows.

**Open the overlay on a narrow window.** After activating a tab in a side dock, the service opens
that dock's overlay when the viewport is compact, and still clears the collapsed flag as today, so the
panel is also expanded once the window is widened. Rejected: leaving the overlay closed and only
making the view current, which is today's behaviour and the one that shows nothing.

## Risks / Trade-offs

- [An overlay opening over the content surprises someone] → a reveal is always the consequence of an
  action the person took, and the overlay is dismissed like every other.
