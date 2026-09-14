## Context

See proposal.md, *Why*. The strip that draws a pane's tabs builds each tab's menu context from the
tab and what it was handed: kind, id, region, pinned and closable for a content tab; kind, view id,
region and instance for a view's tab. A menu entry's condition is a subset match, every named key
equal to the context's, with no negation, so that a condition stays a serialisable predicate that
crosses the sandbox boundary. "Not alone" and "not in the main area" therefore have to be values
the context carries.

The three dead entries fail for three different reasons underneath, a refusal, a lookup that finds
nothing, and a copy under the wrong name, and none of those reasons is wrong in itself. What is
wrong is the drawing.

## Goals / Non-Goals

**Goals:**

- Each entry disappears exactly where it cannot act, through the mechanism every other entry
  already uses.
- The two facts the strip adds are facts about the tab, usable by a plugin's entry for its own
  reasons.

**Non-Goals:**

- Making the menu split duplicate a lone tab the way the toolbar does. That would be two behaviours
  under one name; the toolbar is one click away and already does it.
- A "move to a sidebar" entry for a view in the main area. Dragging and hiding cover it, and a new
  entry is more than the finding asks for.
- Teaching the pane tree to refuse a second copy of a view. Stacking is a deliberate copy and stays.
- A negated condition in the menu contract.

## Decisions

**Facts in the context, conditions on the entries, not checks inside the commands.** A command that
returns early leaves the entry visible and dead, which is the defect. The strip adds `sole`, true
when the tab is the only one in its strip, to every tab's context, and `inContent`, true when the
strip's region is the main area's dock, to a view tab's. The split entries ask for `sole: false`;
*Open in content* and *Move to other sidebar* ask for `inContent: false`.

**The fields name where the tab is, not what an entry may do.** `sole` and `inContent` are true of
the tab whatever menu reads them; a field named for an entry, such as "may split", would model the
reason, which the contract avoids.

**`sole` counts the strip's tabs, not the group's.** In the address-carrying pane the strip shows the
group, so the two agree; in any other pane the strip shows that pane, which is what the split would
empty. This is also what the split-pane menu of the other open change needs.

## Risks / Trade-offs

- [A plugin's entry that took the tab somewhere keeps appearing where it cannot] → it can now name
  `sole: false` or `inContent: false` itself; nothing forces it to, the same freedom as every other
  context field.
- [A person looks for *Split right* in the menu of a lone tab and does not find it] → the toolbar's
  split control stands in the same strip and is the documented way; the guide says which does what.
