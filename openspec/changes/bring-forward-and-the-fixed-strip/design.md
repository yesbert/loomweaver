## Context

The owner decided three questions on 2026-11-06. Each is a place where the workbench did something
visible that no requirement asked for: the reveal path took the first copy of a view it found in
iteration order, the overflow handling reordered strips the user may not reorder, and the add-tab
button of a pane outside the address opened content there without moving the address.

## Decisions

**The copy current most recently wins, then the address pane, then reading order.** This is the
owner's rule. A copy is current while it is the tab its pane shows: the address pane's current view
tab, or the current tab of any other pane, including that of a collapsed sidebar. A copy that is
current now ranks above one that stopped being current; between two that are current, the one that
became current later wins; between two that are not, the one that stopped later wins. The record
lives for the session and is not stored, so after a restart the copies current at start count as
current from the start.

**"The focused pane" is the pane that carries the address.** The prompt named the focused pane
without saying which focus. Keyboard focus moves with every click and is lost to a dialog, while the
pane carrying the address is the content area's own notion of focus and is what a click on a pane
moves. A sidebar never carries the address, so this tier only ever favours a copy in the content
area.

**Reading order is by dock: top, left, centre, right, bottom.** Within a dock, panes are taken in
the order of the split tree, which is left to right and top to bottom. A dock the layout does not
name comes last.

**The strip scrolls, it does not swap.** The strip clips its tabs, but it can be scrolled from code,
so the owner's main form applies: on a strip the user may not reorder, the hidden tab keeps its place
and the strip scrolls just far enough to show it. The fallback the owner named for a strip that cannot
scroll, showing the active tab in place of the last visible one, is not needed and is not built. The
overflow list already marks the active entry, so it marks the scrolled-to tab with nothing added.

**Whether a strip may be reordered is decided per strip.** A strip the user may reorder keeps
today's behaviour even when the hidden tab is one that cannot move, such as a pinned tab. The rule
reaches the sidebar strips too: with view reordering switched off, a hidden view tab that becomes
current is scrolled into view, where before nothing answered the request to bring it forward.

**The record starts with the shell.** It watches which copies are current from the first moment, so
a plugin that asks late still gets the person's history, and a test that builds the reveal path
alone does not start it.

**Only the add-tab button changes what a pane shows.** The pane toolbar's other buttons split,
minimise, maximise, restore and close; none of them changes the item the pane shows, so each stays
an action that leaves the address alone. Adding a tab takes the address only once the user has chosen
something to open, and only where clicking a tab would: a content pane outside the address, and the
pointer inside a container.

## Alternatives rejected

- Recording only the moment a copy became current. A copy still current would then lose to one that
  was opened later and has since been left, which contradicts "current most recently".
- Keeping the recency in stored working state. Nothing else about which tab was current is kept
  across a restart in that form, and the rule already falls back when there is no history.
