## Context

See proposal.md, *Why*. What matters for the approach is that the workbench answers two questions
about a pane and an address, and they are close enough to be mistaken for each other.

**Can this item be duplicated into a sibling?** Asked when the user reaches for a split control, and
when the distribution splits from its own code. The item is on screen, so everything about it is
known, the parameter in its address included.

**Which items may be offered as targets for an empty pane?** Asked when the workbench builds the
picker. Here nothing is on screen yet, so an address that stands for one particular thing cannot be
offered: a menu entry cannot invent the identifier. That is why this one refuses an address with a
parameter or several segments, and it is right to.

One predicate answered both. The narrow answer is correct for the picker and wrong for the split.

## Goals / Non-Goals

**Goals:**

- Splitting depends on the item, not on the spelling of its address.
- The two questions are separately named, so the next reader picks one on purpose.
- The sixteen end-to-end tests that already cover this turn green without being edited.

**Non-Goals:**

- Changing what the picker offers. Its rule is unchanged, and the tests around it stay as they are.
- Changing how a tab moves between panes. A tab whose address carries a parameter still moves by
  handing over the address rather than by mounting off the router, which is what the drag path
  already does and what its own tests pin.
- Widening what may be duplicated beyond what the workbench could show. Gated content and the empty
  home screen stay out.

## Decisions

**Restore the older rule for duplication, rather than loosen the picker's rule.** The rule that
governed splitting before the regression asked whether a route matches the address and the user may
see it. That is exactly the question, and it was correct for as long as it stood. Loosening the
picker's rule instead would have made the picker offer entries it cannot fill in.

**Two predicates, side by side, each saying which question it answers.** The alternative was one
predicate with a flag. Rejected: a boolean argument at the call site says nothing about which
question is being asked, and this defect came precisely from a call site that looked reasonable.

**A scenario in the specification, not only a test.** The requirement already said the user can split
a pane. It did not say that the shape of an address is irrelevant, and the neighbouring scenario
about content that cannot be duplicated could be read as licence for the narrow rule. The scenario
closes that reading. This is a defect fix, so no requirement is added: the existing one is sharpened.

**Ship as a patch on the released line.** 0.8.0 carries the defect and sits on `latest`. A patch is
what a consumer on `^0.8.0` picks up without doing anything, which is what this needs.

## Risks / Trade-offs

- **The duplicate is host-mounted off the router, and a fabricated route carries no resolvers, query
  parameters or nested outlets.** That trade is not new, it is what retention has always done, and it
  is what the arrangement did before the regression.
  → The end-to-end tests that cover retention, following tabs and phantom tabs exercise exactly this
  path and are the check.
- **The end-to-end suite is outside the merge gate, so this fix could regress again unnoticed.** The
  nightly run is the only net, and its last green report predates the code it is supposed to cover.
  → Out of scope to change the gate, and that is the owner's call. The tasks require reading the next
  nightly rather than assuming it, so the fix is confirmed by the net that exists.
