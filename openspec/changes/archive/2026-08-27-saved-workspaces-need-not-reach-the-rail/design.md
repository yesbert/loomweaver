## Context

See `proposal.md` — Why. Two things about the ground it stands on:

- **The switches already exist and are already shaped this way.** A distribution composes what the
  workbench offers, field by field, and the workspace group holds exactly one today: whether named
  workspaces exist at all. This is the second field in that group, not a new mechanism.
- **A saved workspace is already hidden from the rail until the user places it.** The workbench
  registers an entry only for one the user put somewhere, from the curation dialog; the dialog is
  where the offer is made, and the entry registration is where it takes effect. Both have to answer
  to the switch, or the user finds an offer that does nothing, or an entry that outlives the offer.
- **Placement is stored app-wide**, not per workspace, and stays valid whether or not it is being
  honoured — which is what makes keeping it while ignoring it the cheap option rather than a
  special case.

## Goals / Non-Goals

**Goals:**

- A product decides what stands in its rail beside its own entries.
- Nothing else about a saved workspace changes, so the switch is safe to flip in either direction at
  any time.

**Non-Goals:**

- No say over whether a user may save workspaces. That is a different question and would need its own
  argument.
- No new way to reach saved workspaces. The dialog is what a product falls back to, and improving it
  is not this change.
- No change to declared workspaces, which a product offers itself.

## Decisions

### The switch governs the offering, not the saving, and is named for it

Turning it off must not silently remove the ability to save, because a product that wanted that would
say so and the two would then be impossible to tell apart in a bug report. Naming the field for the
offering keeps the smaller promise readable, and leaves the larger question free to be asked later
with its own name.

The alternative, one field meaning "workspaces the user saved, on or off", was rejected for exactly
that: a reader could not tell from the name whether their saved arrangements still existed.

### The existing report keeps its meaning

The workbench warns a developer when a **declared** workspace is reachable only through the dialog,
because that is almost always a forgotten rail item. Saved workspaces were never part of that report
and must not join it now: with the switch off their absence from the rail is the product's decision,
and a warning would be the workbench arguing with a choice it just offered.

### The offer and the entry are both switched, and the placement is kept

Two places decide whether a saved workspace reaches the rail: the curation dialog, which offers it,
and the entry registration, which draws it. Switching only the first would leave an entry a user
placed earlier standing forever with no way to remove it; switching only the second would leave an
offer in the dialog that does nothing. Both answer to the switch.

What is **not** touched is the stored placement. A product may flip the switch while trying a layout,
or between releases, and a user who had arranged their rail should find it as they left it rather
than having to rebuild it. Keeping a placement that is not being honoured costs nothing, since it is
already stored app-wide and independently of what is currently registered.

### A saved workspace may be active with nothing marked in the rail

With the switch off, a user who is in a saved workspace sees no current entry in the rail, because
none of the product's own entries is theirs. That is accepted rather than papered over: the rail
marks where you are among the things it offers, and inventing an entry for the active one would
reintroduce exactly what the product turned off, at the least predictable moment.

## Risks / Trade-offs

- **A product turns it off and its users cannot find their saved workspaces.** → They are still in
  the workspace dialog, which is the same place they are managed from, and the product made the
  trade deliberately.
- **The switch is read as "no saved workspaces at all".** → Answered by the name and by the
  guarantee stating what still works; the alternative naming was considered and rejected above.
