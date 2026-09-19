## Context

See proposal.md, *Why*. This change builds on *a-preview-moved-to-another-pane-is-kept*: its
MODIFIED requirement is written against that change's text, and its behaviour assumes that a move
between panes promotes a preview.

Opening content today works only on the pane carrying the address. The content tabs service reads and
writes that pane's tabs, fills its preview slot and then navigates, which is what keeps the address
and the shown content in step. Which pane carries the address follows pointer focus, so a list in
the main area always hands the address to its own pane the moment it is clicked.

The shell cannot tell which surface a call to open content came from. The plugin context exists once
per plugin, in-process surfaces reach it through the plugin's own module, and a sandboxed plugin's
calls travel over its single hidden logic frame, not over the channel of the surface that asked.
Per-mount handles exist (a container's handle is the precedent), but none reaches an ordinary
surface, and none crosses the sandbox boundary.

## Goals / Non-Goals

**Goals:**

- A list in the main area can open items beside itself, as previews or not, on both runtimes, with
  the same call a plugin already makes.
- The distribution's tab service gets the same ability without a second implementation.

**Non-Goals:**

- Knowing the calling surface. See the first decision.
- A choice of side or direction. The neighbour is whichever pane the tree already names; a split it
  creates goes to the right.
- Opening beside a docked view in a sidebar. The address never sits there.

## Decisions

### "Beside" is relative to the pane carrying the address, not to the calling surface

The request names no pane. It means "beside the pane the person is working in", and that is the pane
carrying the address, because a click into a surface in the main area hands that pane the address.
The owner chose this over a per-surface handle on 2026-09-19.

Rejected: beside the calling surface. It is robust against focus, but the shell cannot identify the
caller. It would need a new injectable handle provided at every place a surface is mounted, plus a
new, capability-checked method on the channel of every sandboxed surface: a second door next to the
plugin context, for one ability.

Rejected: NextPA's direction, filling the slot of whichever pane last held a preview. It is implicit
state the person cannot see, it is ambiguous once two panes hold a preview, and it would make a plain
open land away from the pane that has focus.

Limits, accepted: a list reached only by the keyboard, never clicked, has not taken the address, and
its items open beside whichever pane does carry it. The same holds for a surface without an address
shown in a pane of its own, such as a docked view opened in the main area: focusing such a pane never
moves the address, so its items open beside the pane that carries it, which may be the list's own.

### The address stays where it is

Opening beside activates the item in the neighbouring pane and does not navigate. The pane carrying
the address keeps it, so the address still shows the list and the next open beside goes to the same
neighbour. This is the editor's "open to the side" without moving focus.

Rejected: letting the address follow the opened item, as an ordinary open does. The next item opened
from the list, without a click in between, would then go beside the neighbour instead of beside the
list.

### The neighbour is the pane that would take the address pane's place

The tree already answers that question for closing the pane carrying the address: the leaf it
promotes. Opening beside reuses that query, so "the pane beside" means the same thing in both
directions and works in any nesting of splits. With no split, the address pane is split to the right
with a new, empty sibling that receives the item, which is the same tree edit dropping onto the right
edge makes.

### Opening beside is a tree edit on the neighbour, as closing in another pane is

The address pane keeps its own tab state: the open set with its close hooks, the router's reuse and
the navigation that keeps the address in step. Every other pane is held in the tree alone, and the
workbench already treats the two differently where it matters: closing a tab in the address pane
goes through that state, closing one in another pane is a tree edit followed by the close hook. Opening
beside follows the same line. It writes the tab into the neighbouring leaf, replacing that leaf's
preview in place when the item is a preview, runs the replaced preview's close hook, and makes the tab
the leaf's active one. The pure edit lives in the tree slice beside the other tab edits.

Rejected: generalising the address pane's opening to take any pane. It would move the open set, the
reuse eviction and the navigation behind a pane parameter on the path every tab open takes, for a
second caller that needs none of the three.

An item the neighbour does not hold but another pane does is opened as an ordinary open would open
it, so the rule that content is never duplicated stays in one place.

A neighbour that is minimised is brought back, and a blow-up of any other pane ends, so that what was
opened is visible.

### The sandboxed runtime is verified at its boundary

A sandboxed plugin opens content from its hidden logic frame; its surfaces have no way to open a tab
at all. A sandboxed list therefore needs its surface to hand the click to the logic frame through
shared state before the request can be made, which the testbed does not model. The difference
between the runtimes is the boundary itself: the sanitiser has to let the wish through, and the
runtime has to hand it to the same opening. Both are tested there, and the opening behind it is the
one the in-process end-to-end test drives.

### Switches decide whether a pane may be created, not whether the request is honoured

A distribution that has switched splitting to the right off has decided the shape of the area. A
plugin's request does not override that: an existing neighbour is used, none is created, and without
one the request falls back to an ordinary open. This mirrors how the switches treat the user's
gestures, and the distribution's own code can still split through its pane service.

## Risks / Trade-offs

- **The address shows the list, not the item read beside it.** A reload or a shared link brings back
  the list; the item beside it comes back through the persisted arrangement, not through the address.
  → The same holds for every pane that does not carry the address today.
- **A keyboard-only path opens beside the wrong pane.** → Recorded as a limit under the first
  decision; a per-surface handle can be added later without changing this request's meaning for the
  clicked case.
- **Two ways into a pane.** The address pane and the neighbour are written by different code. → The
  same division already exists for closing; the tab shapes are the ones every pane holds, and the
  neighbour's tabs render through the same off-router mounting a dragged tab uses.
