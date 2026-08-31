## Context

See proposal.md for motivation.

Two things shape the approach. The first is that the mechanism already exists and only points the
wrong way: a surface carries a declaration, it is normalised into the registry alongside every other
surface field, it survives the sandbox boundary, and two places in the shell read it and apply the
inset. Nothing has to be invented.

The second is that this exact question was decided once before, for whether a hidden surface is kept
alive. That answer is a distribution-wide default plus a per-surface declaration that wins over it,
provided as an option to the shell and resolved by a single function that takes the declaration and
the fallback. Padding gets the same shape, because a second shape for the same kind of choice is a
second thing for a reader to learn.

## Goals / Non-Goals

**Goals:**

- The workbench applies nothing by default, and a product that wants the old look says so once.
- The declaration works in both directions, which it does not today.
- The demo demonstrates both halves rather than only the new default.

**Non-Goals:**

- Making the inset's width configurable. The specification already calls the width a styling
  question, and this change does not reopen it. A product that wants a different amount writes CSS.
- A per-pane or per-mount-point setting. The user decides where a surface lands, so a surface whose
  appearance depended on the pane would change as it was dragged, and its author could not predict
  the result.
- Scrollbar appearance. That the workbench styles no scrollbars at all is a separate gap.

## Decisions

**The distribution default is an option on the shell, named for what it does rather than for the
field it overrides.**

It sits beside the retention default in the same options object and is resolved the same way: one
function takes the surface's declaration and the distribution's fallback and answers whether this
surface is inset. That function is the only place the rule lives, so the content pane and the
secondary pane cannot drift apart.

*Alternative rejected — a design token.* A token would make the width configurable, which the
specification deliberately does not promise, and it would give no answer at all for a surface that
wants to differ from its product.

*Alternative rejected — reading the declaration where it is applied.* Two call sites already apply
the inset today. Leaving the resolution at those sites is how they would come to disagree.

**The declaration becomes two-way, and the sandbox boundary has to be widened to match.**

Today a sandboxed plugin can only send the declaration meaning "no inset"; any other value is
dropped. That was correct when it was the only useful direction and is a hole once the default
flips, because a sandboxed surface could then never ask for an inset while a host-rendered one
could. The sanitiser accepts both values, and a test pins that a sandboxed surface can ask for both.

**The published field keeps its name and its type.**

What changes is what it means when it is absent. Renaming it would force every consumer to edit code
that is still correct, on top of a visual change they already have to absorb.

*Alternative rejected — a new field and a deprecation period for the old one.* Two fields meaning
almost the same thing is the cost; the benefit would be a gentler migration for a field whose
absent-case is the only thing that moved. The release note is the cheaper instrument.

**Prose that states the old default is corrected, not appended to.**

Two reference documents and one guide describe the current behaviour in sentences that become false.
They are rewritten. A note saying "this changed" beside a paragraph that still says the old thing is
how a guide starts disagreeing with the contract.

## Risks / Trade-offs

- **Every existing product goes flush on upgrade, with no warning at build time.** → The change is
  marked breaking, the distribution default restores the previous look in one line, and that line is
  the first thing the release note says. There is no way to detect the intent from code, so this
  stays a documentation duty rather than a migration.

- **A product that never notices ships surfaces touching their pane edges.** → Visible immediately
  on first run, and cheap to fix. The opposite failure, an inset that cannot be removed, is the one
  that has no fix from the product side at all, which is the asymmetry that motivates the change.

- **The demo's own dashboard currently relies on the workbench's inset**, because it was just
  changed to stop supplying its own. → It gets its inset back as its own, which is also the more
  honest demonstration: the demo should show a product owning its look rather than inheriting one.

- **The two-way declaration invites a product to scatter the choice across surfaces** instead of
  setting it once. → The distribution default exists precisely so the common answer is stated once;
  the guide says so where it introduces the declaration.

## Migration Plan

For a product on `@loomweaver/shell`: pass the distribution default to keep the current look, or
accept the flush default and add whatever inset it wants from its own stylesheet. No stored data
changes, nothing to run, and rollback is the previous package version.

For the demo, in this change: the dashboard supplies its own inset again, and the payments frame
stops being inset twice without being edited, which is the change demonstrating itself.
