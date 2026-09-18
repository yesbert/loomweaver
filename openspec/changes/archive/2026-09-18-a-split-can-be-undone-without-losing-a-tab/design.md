## Context

See proposal.md, *Why*. The two defects have separate causes and share only the situation that
exposes them: a split made by dragging.

**The drop target.** Every tab strip registers its list id with the pane drag service while it is
alive, and every strip connects its drag list to all registered ids. The id is derived from dock and
pane (`pane-strip:<dock>:<paneId>`), so it is stable per pane rather than per component. The
unregister function removes every entry equal to that id. When a tab is dragged from the pane
carrying the address onto an edge, the new sibling takes the address. `ContentArea` now draws the
new pane, and the pane it drew before is drawn by a fresh `PaneView`. The `PaneView` strip registers
`pane-strip:content:main`, then the old `ContentArea` strip's effect cleans up and removes the same
id, taking the new registration with it. Measured in the testbed: during the drag back, every edge
zone of `main` is registered and its strip is not, and no placeholder appears.

**The close.** `PaneActions.close` removes the whole leaf through `PaneTreeService.closePane`, or
through `TabClosingService.closePrimaryPane` for the pane carrying the address, which collapses it
and promotes a neighbour. `PaneActions.unsplit` replaces the tree with the remaining leaf. None of
the three looks at a tab's `closable`, at `pinned`, or at the distribution's `content.close`
switch. The unsaved-work guard receives every instance in the leaf.

## Goals / Non-Goals

**Goals:**

- A strip is a drop target exactly while some component draws it.
- Closing a pane and undoing a split spare the tabs a bulk close spares, and keep their instances.
- One rule for all three routes: the close control, the distribution's pane service, undoing a split.

**Non-Goals:**

- A switch that hides the pane's close control. The panes capability says the distribution decides
  which controls exist, and there is no switch for this one; that is a separate question nobody has
  asked yet.
- Changing which neighbour takes a closed pane's space. That rule exists and stays.
- Sidebar-specific behaviour. The rule is stated for tabs, and a sidebar pane's view tabs carry
  their own closability; they fall under it without further work.

## Decisions

### Unregister removes one registration, not every equal id

`registerStrip` and `registerZone` keep appending, and the function they return removes one
occurrence, the first equal entry, instead of filtering all of them out. Two components drawing the
same pane for a moment then leave one registration behind when the old one goes, which is the
correct count.

Rejected: registering under a per-component id. The id is how `onDrop` and `stripSourceOf` map a
list back to a pane, so it has to stay derived from the pane.

Rejected: ordering the effects so the old strip always unregisters first. It depends on Angular's
teardown order, which is not ours to rely on.

### Spared tabs are handed over in the same tree edit that removes the pane

The guard is asked first, about the instances of the tabs that really close. Only when it lets the
close go ahead is the tree changed, in one commit: the spared tabs are appended to the receiving
pane, then the closed leaf is removed. That is the same kind of edit a drag makes when it empties a
pane, so retention treats a spared tab exactly as it treats a dragged one. The receiving pane keeps
the tab it was showing; only a receiver that held nothing shows the first tab it is handed. A tab
the receiver already holds, as after a toolbar split that duplicated it, is not added twice.

The receiving pane is chosen by the tree: for a pane that does not carry the address, the adjacent
leaf of its sibling (the first leaf when the closed pane was the first child, the last leaf when it
was the second); for the pane carrying the address, the leaf the tree promotes, which is the one it
promoted before; for undoing a split, the remaining pane. These functions live in the tree slice
beside the other pure tree operations, and the tree service's `closePane`, `collapsePrimary` and
`unsplit` take the rule as an optional argument that defaults to keeping nothing.

Rejected: moving each spared tab through the drag's move service. It navigates after every arrival
and, for a tab bound to the router, moves the address to the receiving pane, so closing a pane would
change what the address shows. The specification says it does not.

Rejected: withholding the close control while the pane holds anything that cannot close. It would
leave a split made of fixed tabs undoable only by dragging, and the owner chose handing over.

### What counts as spared is read from one place

A tab is spared when it is pinned or declared unclosable; the bulk close of the tab menu used exactly
that test as a private function, and now both it and the pane close read one exported predicate. On
the content side, a distribution that switched closing off spares every tab; that switch is folded
in by one function the pane actions and the content tabs service both call.

The content tabs service is published, so its `closePrimaryPane()` keeps its signature and applies
the rule itself rather than taking it as a parameter; the internal rule type does not reach the
packed declarations.

## Risks / Trade-offs

- **A closed pane leaves more behind than before.** A distribution with pinned tabs in a secondary
  pane sees them survive a pane close. → That is what the bulk-close requirement already promised
  for pinned tabs; the pane close was the one route that broke it.
- **The unsaved-work guard asks less often.** Work in a spared tab no longer triggers the question.
  → Correct, since that work is not lost; covered by its own scenario.
- **The drag fix changes a shared service.** Every strip and zone registers through it. → The
  change is from "remove all equal" to "remove one"; for ids registered once, the two are
  identical, and the existing pane drag tests run unchanged.
