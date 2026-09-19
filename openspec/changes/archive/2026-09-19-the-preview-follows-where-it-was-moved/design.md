## Context

See proposal.md, *Why*.

Opening content as a preview works on the pane carrying the address alone: the content tabs service
reads that pane's tabs, replaces the first preview among them or appends one, and navigates. Which
pane carries the address follows focus, and a click into a pane hands it the address, so a list the
user clicks into always receives the next preview in its own pane.

Moving a tab goes through two functions of the move service, one for a drop on a strip and one for a
drop on an edge; the tab menu's split-out and its keyboard equivalent go through the second. Both
drop the preview state when the tab leaves the pane carrying the address for any pane that does not
carry it, and keep it otherwise. When a tab bound to an address arrives in another pane of the main
area, that pane takes the address and the address keeps naming the tab, which is the behaviour the
user wants kept.

A pane that gives up the address keeps its tabs as they are, preview flags included. A toolbar split
duplicates the shown tab without its preview state, so it never creates a second preview.

## Goals / Non-Goals

**Goals:**

- One preview in the main area, and it stays one wherever the user puts it.
- The next preview lands where the preview is, and the address follows it there.

**Non-Goals:**

- Previews in sidebars or in a workspace's container panes. Those are not the main area; a preview
  moved there is promoted.
- Normalising an arrangement saved while several panes held a preview. See *Risks*.

## Decisions

### A move keeps the preview while the tab stays in the main area

The departing tab keeps its preview state when the target pane belongs to the main area, and loses it
when it does not. The rule depends only on where the tab goes, so it is the same for every route and
every source pane. The existing test for a preview moved into a sidebar stays as it is.

Rejected: keeping the preview state everywhere. A sidebar has no preview and nothing that would ever
replace one there, so the tab would stay italic for good.

### Opening a preview replaces the one preview where it stands

When content is opened as a preview and is not already open, the service looks for the preview across
the panes of the main area. In the pane carrying the address, the existing replacement runs
unchanged. In another pane, the preview tab is replaced in place in that pane's strip by the new one,
the replaced content's close hook runs, the pane takes the address the same way a tab dragged there
takes it, and the service navigates to the new content. Without a preview, the new one is appended to
the pane carrying the address as today.

Handing the address over reuses the focus step the move service already performs after a drop, so a
preview replaced in another pane and a tab dragged into it leave the arrangement in the same state.

Rejected: leaving the address with the list. The user wants the address to name what the preview
shows, as it does after the drag.

Rejected: one preview per pane, filled in the focused pane. That is today's behaviour and the reason
the list is covered: the click into the list focuses the list's pane.

### The one preview is found, not tracked

There is no separate record of where the preview lives. The tree already holds the flag on the tab,
and every move, close and restore keeps the tree right; a second record would have to follow all of
them. The search visits the leaves of the main area only, which is a handful of panes.

## Risks / Trade-offs

- **A saved arrangement may hold previews in several panes.** Under the old rule each pane could keep
  one. → The next preview replaces the first one found, preferring the pane carrying the address;
  the others stay italic until kept or closed, which is visible and loses nothing.
- **The next preview can land away from where the user is looking.** A user who dragged the preview
  far away sees the next one appear there. → That is the requested behaviour; keeping the preview
  (double-click, or the plugin's own keep) ends it.
