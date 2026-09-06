## Context

See proposal.md, *Why*. What matters for the approach is the shape a bar has today. It is one
horizontal flex row with three groups, start, centre and end, each holding the entries that named
that slot in declared order. The start group may shrink; the centre and end groups may not. Every
entry, whether the workbench draws it from a declaration or a product renders it as a component of
its own, sits in one host element the bar renderer wraps around it, and that host has no permission
to shrink, which is why an entry that truncates itself never does.

The frame already knows when the viewport is narrow. One reactive value, derived from a media query
at the width below which the side panels become overlays, drives the sidebar header and the panels.
Nothing in a bar reads it yet.

The entries a product puts in a status bar are mostly components, not buttons: in the demo the look
switch, the preview badge, the version and the legal link are all rendered by the product. Only the
search entry is a declared button with a command. Any folding has to carry a component entry as it
is, because the workbench cannot turn it into a menu item.

The rail met the same problem in its own direction a day earlier, when labels made it taller than
the window, and the answer there was to let it scroll with the bottom band pinned. A bar cannot
scroll: an entry the user has to find by scrolling a status bar sideways is an entry they will not
find.

## Goals / Non-Goals

**Goals:**

- One threshold for "narrow", read from the value the frame already has, so that the bar, the
  panels and the sidebar header change together.
- Folding that works for a component entry the workbench knows nothing about, since that is what a
  status bar holds.
- No change on a bar that fits, down to the markup: the fold control does not exist until it is
  needed.

**Non-Goals:**

- A compact form for entries a product contributes. The workbench compacts what it draws itself; a
  product that wants its own entry smaller on a phone reads the same narrow value and decides.
- Abbreviating a folded entry. It is presented as it is.
- A second row for the bar. Height on a phone is the scarcer dimension.

## Decisions

**The compact forms read the frame's narrow value, not a stylesheet breakpoint.** The brand's
tagline already hides itself through a stylesheet breakpoint, and the name could have followed it
with one class. It does not, because that would give the frame two definitions of narrow, one in a
media query in code and one in a stylesheet, equal today by coincidence and free to drift. The brand
and the language switcher read the same reactive value the sidebar header reads. The tagline's
existing breakpoint is left alone, since it hides earlier than the name and that ordering is what
the identity capability now states.

**The name stays in the accessible name.** The brand's mark already has an empty alternative text
because the name stands beside it. When the name is not drawn, the entry carries the product's name
as its accessible name instead, so the compact form changes what is seen and not what is announced.
The language switcher already names itself; it keeps that name and drops only the visible text.

**The bar host may shrink.** The element the bar renderer wraps around every entry gets permission
to shrink, which is the one-line defect that stops the product name truncating today. This is
independent of folding and stands on its own.

**Folding is measured, not styled.** A stylesheet can hide an entry below a width, but it cannot
know how many entries a product contributed or how wide each turned out to be after translation.
The bar observes its own width and the natural width of each entry, and decides what fits. Widths
are read from the entries as rendered, so an entry a product renders itself is measured like any
other, and a language change that makes a label longer is picked up because the entry's width
changes.

**A folded entry keeps its last measured width.** An entry taken out of the bar cannot be measured
any more, and the bar has to know when it would fit again. Each entry's natural width is remembered
from the last time it was in the bar, and a folded entry returns when the bar has room for that
width plus the width of the fold control. If it turns out wider on return, the next measurement
folds it again; the loop settles because every step is monotonic in the bar's width.

Rejected: rendering every entry a second time off screen to measure it. That would double every
component entry, including ones that fetch or subscribe, for the sake of a measurement the bar can
take from the entry it already renders.

**Folded entries are presented as themselves, in a tray, not as menu items.** A menu of command
items would cover the declared buttons and none of the component entries, which are the ones a
status bar is made of. The fold control opens a popover that hosts the folded entries with the same
renderer the bar uses, stacked vertically, each in the form it had. A declared button is still a
button and runs its command; a component is still that component. The popover uses the positioning
the workbench's menus already use, so it opens from the fold control and dismisses as a menu does.

Rejected: a menu that lists the folded entries by name and activates them. It would need a name
for a component entry, which a component does not declare, and would turn the version badge into
a menu item that does nothing.

**The fold order is spatial.** Entries fold from the far end backwards: the end slot's highest
order first, then down that slot, then the centre slot the same way, then the start slot from its
highest order down. That matches where the fold control sits, so what disappears is what was next
to it, and it makes the brand, at the start of the top bar with order zero, the last entry standing.
No new field is added to a bar entry; the order it declares already says how important it is.

**The fold control is a bar entry the workbench adds, not a product contribution.** It is drawn by
the bar renderer at the end of the end group, only while something is folded, with an icon and an
accessible name, and it is never itself folded. It does not appear in the registry, so a product
cannot remove it, reorder it or contribute beside it, which is right because it exists only when
the product's own contributions do not fit.

## Risks / Trade-offs

- [A measurement loop: fold, remeasure, unfold, remeasure] → Folding decisions are made from the
  bar's width and the remembered natural widths, never from the width the entries happen to have
  after a fold, and an entry only returns when its remembered width fits with margin. Pinned by a
  unit test that widens and narrows the bar across the threshold of one entry.
- [An entry that changes its own width while folded, a badge that appears] → It returns at its old
  width and is folded again on the next measurement if it grew. One extra layout pass, no visible
  flicker, because the fold decision is applied before paint.
- [A component entry that misbehaves inside a popover, the look switch's own dropdown] → The tray
  uses the same positioning as nested menus, which already open from within a popover. Checked by
  hand in the demo before the slice is called done, since it is the one component entry with a
  popover of its own.
- [The demo's end-to-end test lands before the demo has the fix] → The nightly suite runs against
  the published package, so a test at 390 pixels would fail until the demo adopts a release with
  this change. The end-to-end tests are written here but land with the adoption pull request.
