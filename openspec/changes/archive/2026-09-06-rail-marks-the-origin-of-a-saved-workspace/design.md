## Context

See `proposal.md` — Why. What the approach stands on:

- **The rail already marks one thing and decides it in one place.** An entry is current when the
  workspace it carries is the active one; that comparison is the whole of it, and it serves declared
  and saved entries alike because both are plain entries carrying a workspace.
- **The origin is already kept and already read.** Saving records the nearest declared workspace,
  the dialog shows it as "variant of", and the workbench resolves it live against the declarations
  in force, so an origin that disappears reads as none.
- **Whether a saved workspace's entry is drawn is one fact with two inputs**: the product's switch
  over saved workspaces in the rail, and the user's placement, which is stored app-wide and names
  the rail it was placed in. Both are already reactive, and the placement is independent of which
  rail is asking.

## Goals / Non-Goals

**Goals:**

- The rail never goes blank for a saved workspace that has an origin the product offers.
- Never two marked entries: the variant's own entry, where drawn, wins over the origin's.

**Non-Goals:**

- No change to the entry's tooltip, name or icon while a variant is active. Whether the rail should
  say *which* variant is a separate change if wanted, and this one is written so it can be.
- No new way to reach saved workspaces, and no change to the product's switch or the user's
  placement.
- No marking for a variant without an origin. There is nothing that is its own.

## Decisions

### The origin is marked only while the variant has no entry of its own, anywhere

The rule is "mark the variant's own entry if it is drawn in any rail, else the origin's". The
alternative, marking the origin whenever a variant is active, would mark two entries at once for a
user who placed their variant, and a rail with two current entries answers the question "where am
I?" twice. The check is whether the variant's entry is drawn at all, not whether it is drawn in the
rail doing the asking, because a variant placed in the other rail is still marked there.

### The drawn-ness is read from the same facts that draw the entry

The rail reads the product's switch and the user's placement, the same two inputs the entry
registration reads, rather than looking for the entry among the registered items. The alternative
of asking the contribution registry whether an entry with that id exists would make the marking
depend on the order in which the registration effect and the rail's rendering run, and the two
inputs are signals already, so reading them is the cheaper and the deterministic choice.

### Reversing the earlier decision, and why it does not reopen it

The archived change `2026-08-27-saved-workspaces-need-not-reach-the-rail` decided that a saved
workspace may be active with nothing marked in the rail, because inventing an entry would
reintroduce what the product had turned off. Marking the origin does not invent an entry: the
entry is the product's own, and a product that turned saved workspaces off still wants its rail to
say where the user is. What that decision protected, that the product's rail holds the product's
entries and nothing else, holds unchanged.

### Choosing the marked origin switches to the origin

A click on the origin's entry does what it always does: switch to the declared workspace. The
alternative, returning to the variant the user was last in, would make the same entry do two
different things depending on history, and would contradict what an address does, which is to
activate the declared workspace and never a variant. The click is thereby also the short way back
from a variant to its original.

## Risks / Trade-offs

- **The user cannot tell from the rail that they are in a variant rather than in the origin.** →
  Accepted for this change; the dialog says so, and saying it in the rail is a decision deferred on
  purpose rather than skipped.
- **A variant placed in the other rail leaves the origin's rail unmarked.** → Correct by the rule:
  the variant's own entry is marked over there, and the user placed it there.
- **A product that turned saved workspaces off sees marking behaviour it did not have before.** →
  It is the behaviour the guarantee now states, changes nothing the product declared, and marks
  only entries the product put there itself.
