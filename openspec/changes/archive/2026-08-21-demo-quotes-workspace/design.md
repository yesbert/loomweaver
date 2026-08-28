## Context

The demo composes a layout with six regions, among them `left-panel` and `right-panel`. The quote
list docks into the left panel; every other surface of the quotes plugin declares `docks: []`
because it exists to be a child of the `quotes.document` container. Nothing has ever docked into the
right panel, which is why it is drawn and empty.

This is the first of four workspace changes. What is decided here sets the pattern the other three
follow, which is the reason a design note exists for a change this small.

## Goals / Non-Goals

**Goals:**

- Establish how the demo declares a workspace, so the remaining three are variations rather than
  new decisions.
- Show two platform properties in one arrangement: a declared layout with proportions, and one
  surface living in two places at once.

**Non-Goals:**

- Building out the domain. No new entity, no new seed data, no new view.
- Deciding the arrangement of the dashboard, customers or invoices workspaces. Each is its own
  change, and each is meant to demonstrate something the others do not.
- Making the demo a quoting application. Every addition has to earn its place by showing a platform
  capability; a feature that only makes the demo more complete is out of scope.

## Decisions

**The workspace opens on a concrete quote rather than an empty content area.** A workspace whose
content area is empty demonstrates the declaration but shows nothing, and the first impression stays
what it is today. The declared tab is `quotes/q-0005` — an accepted quote, so it carries positions
worth looking at, and it is the one that becomes an invoice in the fourth change, which lets the two
workspaces tell one story. The tab is declared non-closable, which is itself a property of the
grammar worth demonstrating; a reset restores it either way.

*Alternative rejected:* leaving `content` out and letting the user pick from the list. Honest as an
everyday state, but it wastes the one screen a visitor is guaranteed to see.

**Quotes is the workspace a first visit starts in.** `initial: true` applies once, on a first boot
with nothing stored; a returning user keeps their own last choice and a deep link still wins. That
removes the empty opening state now rather than after the dashboard is built. The second change
moves the flag to the dashboard — one line, and the reasoning is recorded here so it is not
relitigated then.

*Alternative rejected:* waiting for the dashboard. It leaves the demo opening into an empty
workspace for the length of two changes, for no gain.

**The right panel stays empty in this workspace, and its occupant is left to the customers change.**
It was first decided the other way: the customer surface would gain `right-panel` as a dock and the
workspace would put it there, on the argument that a surface can be a container child and a sidebar
view at once. Building it refuted the argument. That surface reads the quote it shows from the `:id`
of the address; a sidebar view lives outside the content route and has no such parameter, so the
panel rendered its heading above nothing — worse than the empty region it replaced.

The property is real for a surface that stands on its own, and false for one that takes its subject
from the address. This workspace has no surface of the first kind, so it does not demonstrate the
property; the customers workspace will, with a list that needs no address.

*Alternative rejected:* teaching the customer surface to read the active quote when it has no route
parameter. It would put a second way of finding the subject into a demo view to work around the
first, and the thing being demonstrated would then be the workaround.

*Alternative rejected:* removing the region from the layout. It would make the demo tidier and
poorer — the customers workspace wants it.

## Risks / Trade-offs

**A hard-coded quote id in the declaration goes stale if the seed data is renumbered** → the seed
ids are fixed literals in `accounting/quotes.ts` and the end-to-end case fails loudly if the tab
does not open, so a rename cannot pass silently.

**The margin child is gated to the `accounting` role** → the demo's first account holds that role,
so the opening screen is complete; switching to the sales account hides it, which is the gating
working and is worth seeing rather than a defect.

**Declaring an initial workspace changes what a returning user sees only on a fresh profile** →
anyone who has used the demo before keeps their stored workspace, so the improvement is invisible to
them. That is the guarantee, not a shortcoming, and the end-to-end case runs on a fresh profile.
