## Context

The file grew because every one of the three jobs legitimately needs the tab list, and the tab list
lived in the class. So each new close rule, each new navigation case and each new projected signal
landed in the same place, and no single addition was the one that made it too big.

Eleven injected dependencies is the symptom that names the cause. Angular's own guidance is to
design a service around a single responsibility; a constructor that reaches eleven ways has three.

## Goals / Non-Goals

**Goals**

- Each unit has one job, and the dependencies it needs are the dependencies it declares.
- `ContentTabsService` keeps every published member with the same name, signature and behaviour.
- The packed declarations come out byte-identical.

**Non-Goals**

- Changing what a close does, when a tab is kept, or which neighbour gets focus. Not one rule is up
  for revision. If a test fails, the move is wrong.
- Removing the delegation later. `ContentTabsService` staying as the published face is the point,
  not a temporary shim.
- Splitting the navigation job as well. It is the smallest of the three and the least entangled; if
  the two other extractions leave it under the threshold, it stays where it is.

## Decisions

**Extract the read side and the close side; leave navigation in place.** The read side is pure
derivation and has no dependency on the close guard or the router's imperative surface, so it lifts
cleanly. The close side is the largest and the only one with an external collaborator of its own.
Navigation is what remains, and what remains is the thing the class is named after.

**Delegation, not re-export.** `ContentTabsService` keeps its methods and forwards. The alternative,
publishing the new units and deprecating the old members, would change the contract for a gain
nobody asked for, and this repository does not deprecate and keep.

**The read side becomes signals owned elsewhere, not recomputed.** Every projected signal must have
exactly one definition. Two `computed()` calls over the same source would be a correctness risk
disguised as a refactor, since consumers compare identities.

**Split the spec along the same three lines.** A 1040-line spec is the safety net for this change and
splitting it afterwards is what proves the seam is real: a test that cannot be assigned to one of
the three units names a responsibility that was not actually separated.

## Risks / Trade-offs

**The published surface is the acceptance criterion and it is easy to break silently.** Vitest does
not type-check, and this repository has already shipped a broken re-export that 1288 green specs did
not catch and only `nx package shell` found. Packaging is the type check, and it runs before anything
here is believed.

**Delegation adds a hop.** Every published call now passes through one forwarding method. That is one
frame in a stack trace and no measurable cost, against a file that can be read in one sitting.

**Three units can drift back together.** If the close side starts reaching for a private of the read
side, the seam was wrong. The import cycle checker catches the worst form of that, and review catches
the rest.

## What the extraction took out of the code

One explanation had nowhere left to sit. `somewhereToGo` carried a JSDoc block, tolerated until now
only because the comment guard reads the packed declarations and a private member of a published
class leaks its name into them. Once the helper moved to an unpublished unit the name left the
contract and the block became what the house rule always called it: a comment. It is recorded here
rather than deleted.

> Whether an address is a place. Truncating before an unknown value normally lands on a shorter
> address another surface owns; where it does not, the facet has nothing to point at yet. A route
> counts only when it consumes the whole address, because `matchRoute` is prefix-tolerant and the
> home route would otherwise answer for everything.

Three sibling blocks on `addressOf`, `focusHolderOf` and `navigateAfterClose` survived the same move,
and that is luck rather than judgement: the guard permits a comment when **any** name in the
declaration or its descendants is published, and those three happen to mention one. Anybody tidying
that guard should expect to find them.

## Open Questions

Whether `QuickOpenTarget` is part of the published contract. It is exported from the service file;
whether it reaches the packed declarations decides whether its move is free or needs the same
byte-identity check as the class. Answered by reading the packed `.d.ts` before the move, not after.
