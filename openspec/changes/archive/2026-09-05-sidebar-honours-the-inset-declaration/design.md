## Context

See proposal.md, *Why*. The mechanism already exists and has one shape: a token the composition sets
(`none` by default), a per-surface declaration that wins over it in both directions, and one
function that resolves the two. The content area calls it. The panel does not call anything.

## Goals / Non-Goals

**Goals:**

- The sidebar answers the inset question the same way the content area does, through the same
  function, so there is one answer rather than two that can drift.
- A test that fails if the sidebar ever stops asking.

**Non-Goals:**

- Changing what the default is. It is already *no inset*; the sidebar simply never read it.
- A new option, a token for the width, or a per-region default. The capability is explicit that how
  wide an inset is remains a styling question.

## Decisions

**The panel resolves the inset the way the content area does, not by copying the class.** Both read
the docked view's own declaration and fall back to the composition's default through the shared
resolver. The alternative, giving the panel its own rule, is how the two would come to disagree.

**The views that lose their free inset draw their own.** Where a docked view reads better with air
around it, it says so with `padded: true` rather than the panel handing it out. That is a per-view
decision made by whoever owns the view, which is the point of the declaration travelling with the
surface. The demo's navigation tree is the counter-example that started this: it wants none, and
until now could not say so.

## What the views decided

Going through them one by one, which is the part that cannot be done in bulk:

- **The testbed** had six docked views and not one of them drew its own edges; all six lived off the
  panel's inset. Five now ask for it (`padded: true`) and look exactly as before. The navigator asks
  to be flush, because a list of rows reads better against the edge and because the testbed should
  demonstrate both answers rather than only one. The docked frame is flush too: an isolated document
  is the content and owns its edges.
- **The demo** had two, and both already drew their own inset. They were therefore getting it twice,
  twelve pixels from the panel and twelve of their own, which nobody had noticed. They now declare
  that they own their edges, and the doubling goes with the defect.

That the demo was double-inset for as long as the panel has existed is the clearest evidence that
the hard-coded inset was never a decision anyone made.

## What it measured

In the testbed, on the container the sidebar mounts a view into:

- The navigator, which declares it owns its edges, resolves to `0px` and its rows run to the panel
  edge. The outline, which asks for an inset, resolves to `12px`. Before, both were `12px` and
  neither had a say.

In the demo, with the locally built package underneath it, every sidebar container resolves to
`0px`, and the twelve pixels each view draws for itself are now the only ones. Before, the quote
list and the agent chat sat inside twenty-four.

The end-to-end pair reads the resolved padding of the mounted container rather than a class name, so
it holds whether the inset arrives as a utility or any other way.

## Risks / Trade-offs

- Every sidebar view in both applications changes appearance at once, and a view that quietly relied
  on the free inset will look cramped. → Go through them one by one and decide per view, rather than
  restoring the inset globally and calling it fixed.
- A product outside this repository is affected the same way and will notice after an upgrade. →
  The proposal marks it breaking rather than filing it as a quiet fix.
