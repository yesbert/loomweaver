## Context

See proposal.md, *Why*. The address-carrying pane of the main area is drawn by the root content area,
which hands its strip the tab menu slot; every other pane of the main area is drawn by the split
pane view, which hands its strip only the view menu slot. The strip builds a content tab's menu
context from the tab and the region it was handed: kind, tab id, group, pinned and closable. Every
entry on the tab menu runs against the service that owns the address-carrying group, and the split
that two entries perform starts from that group's pane by name.

The pane tree already does per pane what the entries need: remove, pin, unpin and split by pane
id, and the split pane view already closes a tab through the unsaved-work guard and unpins one. The
closing service owns close, close others, close to the right and close all for the address-carrying
group, with the guard and the close hooks. The strip knows which pane it draws through its drag
source and whether that pane carries the address through its address-driven flag.

## Goals / Non-Goals

**Goals:**

- One slot, one set of entries, one set of commands. The pane in the context decides what they act
  on; nothing is registered twice and a plugin's entry lands on both panes without doing anything.
- Pinning works in a split pane because the tree and the strip already do it; it costs a branch,
  not a feature.

**Non-Goals:**

- The tab menu in a sidebar pane. A sidebar holds views, and a view's tab has its own menu.
- The tab menu inside a container. A container's panes keep no menus, as the view menu already
  does not there.
- Changing what any entry does in the address-carrying pane.

## Decisions

**The context carries the pane and whether it is primary; the commands branch on it.** The strip
adds `paneId` from its drag source and `primary` from its address-driven flag to a content tab's
context. Each command reads both: in the primary pane it does exactly what it does today, in any
other pane it acts on the tree for that pane. The alternative, a second slot with its own commands
for split panes, would double every entry and every plugin entry with it, and the alternative of
letting the split pane view handle the menu itself would put behaviour in a component, which the
contract's *the twin is the same code* rule forbids.

**The closing service learns a pane, keeping the primary as its default.** Close, close others,
close to the right and close all take the pane the context names; for a named non-primary pane they
compute the same sets over that pane's tabs, run the unsaved-work guard over the instances at that
pane's retention scope and remove through the tree, and run the close hook for a routable tab
exactly as the split pane view does today. For the primary pane the existing code path stays. The
split pane view's own close moves onto the same method so there is one close for a tab in a pane.

**Splitting names its source pane.** The move service's split from the address-carrying group becomes
the primary case of a split from any pane: the source is the pane in the context, the edge follows
the orientation, and the sibling lands beside that pane, which is what the pane toolbar does.

**Pinning goes through the tree in a split pane.** The tree pins and unpins by pane, the strip draws
the pinned band from the leaf, and the split pane view already handles the unpin gesture. The toggle
command routes by pane like the rest.

**`primary` is a plain boolean, like `inContent` on a view tab.** A plugin entry that belongs only
to the address-carrying pane declares `when: { primary: true }`; one that works anywhere declares
nothing. No negation is needed for either.

## Risks / Trade-offs

- [The address-carrying pane and the split pane drift again because two code paths compute "the
  others" and "to the right"] → the sets are computed by one function over a list of tabs, fed the
  group's tabs or the pane's tabs; only the removal differs.
- [A plugin entry on the tab menu that assumed the address-carrying group now runs in a split pane
  with a tab id it did not expect] → the entry receives `primary: false` and `paneId` and can decide;
  the entries the testbed contributes are checked in the split pane as part of the tasks.
- [Close all in a split pane empties it] → the pane shows its awaiting-content state, as it does
  after closing its last tab by the tab's own control today.
