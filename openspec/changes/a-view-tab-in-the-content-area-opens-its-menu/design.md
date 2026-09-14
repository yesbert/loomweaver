## Context

See proposal.md, *Why*. The strip that draws a pane's tabs takes two menu slots, one for content tabs
and one for view tabs, and chooses per tab by the tab's path. A split pane hands it the view slot
and the dock it stands in as the region; the sidebar header does the same with its region. The root
main area hands it the content slot only and an empty region, because for a content tab the empty
region names the address-carrying group. So a view tab in the root area is given an empty slot, and
the menu trigger opens nothing for an empty slot.

Two of the workbench's view entries read the region from the menu context: moving the view to the
other sidebar, and stacking it below. With an empty region both would be silent no-ops.

## Goals / Non-Goals

**Goals:**

- The root main area hands its strip the same view slot and the same region a split pane in that
  area hands it, so a view tab is given a menu wherever it stands.
- A test pins it in the root area, where nothing pinned it before.

**Non-Goals:**

- A content tab in a split pane has no menu today either, since its entries act on the
  address-carrying group; that stays as it is and is not this finding.
- *Open in content* appears on a view tab that already stands in the main area, in a split pane
  today and in the root area after this change. Whether that entry should hide itself there is a
  question of its own, not of this change.
- A view inside a container keeps no view menu, as today.

## Decisions

**The root area reports the content dock as its region, for both tab kinds.** The strip has one
region input serving the content tab's `group` and the view tab's `region`. The alternative, a
second input so that content tabs keep the empty group while view tabs get the dock, adds a seam for
a value nothing reads: no command reads a content tab's `group` from the context, no guide states
its value, and a split pane in the same area already reports the dock for both kinds. Reporting the
dock in the root area makes the two panes of the main area agree, which is what the requirement
asks for.

**No new spec language beyond a scenario.** The requirement already says the same gestures apply
wherever work sits; the implementation failed it. The scenario names the case it missed, the
unsplit main area, so the test that pins it has a sentence to point at.

## Risks / Trade-offs

- [A plugin entry declared `when: { group: '' }` on the content tab menu stops matching in the root
  area] → nothing documents the empty group, nothing in the workbench or its guides sets that
  condition, and the content tab's context is documented as carrying a group without naming a
  value; the split pane already reports the dock. Accepted.
- [The view menu in the root area offers *Open in content* for a view already there] → identical to
  the split pane today, named above as a question of its own.
