## Context

`regions/pane` grew one file at a time and was never cut, because no single addition ever looked
like the one that made it too big. That is how every flat folder of 31 reaches 31.

The themes are not invented for this change; they are already written in the file names. Seven files
begin with `retention-` or `retained-`, five begin with `container-`, and the exports of
`pane-node.ts` group by what they take and return without any interpretation being needed. The work
is to make the folder say what the names already say.

## Goals / Non-Goals

**Goals**

- Every folder under `regions/pane` reads as one theme and stays under the 12-concept threshold.
- `pane-node.ts` holds one concept, the node model, and nothing else.
- The published contract comes out byte-identical.

**Non-Goals**

- Changing behaviour. Not a single guard, timing, or rendering decision is up for revision here. If a
  move makes a test fail, the move is wrong, not the test.
- Resolving the `regions/pane` against `regions/content` slice pair. It is expected to shrink as a
  side effect; deliberately reducing it is a later decision that needs its own argument.
- Technical sub-folders. `tree/services/` and `tree/models/` are exactly what this cut is designed
  to avoid.
- Introducing a barrel file per theme. The shell has no barrels inside `lib/` today and imports
  resolve to the file that owns the symbol, which is what makes the cycle checker meaningful.

## Decisions

**Six themes, not three and not twelve.** Three would leave `tree/` at 20 concepts, which is the
same problem one level down. Twelve would produce folders of two, which is the over-splitting Nx
names as a failure symptom. Six is what the file-name evidence supports.

**`pane-node.ts` keeps its name and the model.** The alternative was to retire the name and
distribute all 50 symbols. Keeping it means the type everybody imports keeps its path, which removes
most of the churn from the split, and the name still describes what is left.

**`pane-queries.ts` and `pane-structure.ts` divide by command-query separation.** Reading the tree
and rewriting it are different jobs with different test shapes: a query has no fixture, a structural
rewrite needs one. The split is along a line the tests already draw.

**The remainder stays at the root of `regions/pane`.** `pane-view.ts`, `pane-surface.ts` and
`pane-tree-view.ts` are the composition of the themes, not members of one. Forcing them into a
seventh folder would name a theme that does not exist.

**Order of work: split the file first, then move the folders.** Splitting `pane-node.ts` while it
sits at its current path keeps every import path stable during the hardest step. Moving folders
afterwards is mechanical and the compiler finds every mistake.

## Risks / Trade-offs

**Large diff, low semantic content.** Roughly 56 files move and every importer changes. The
mitigation is that the change is verifiable mechanically: 1588 tests, seven guards, and byte-identical
packed declarations. Nothing here relies on judgement about behaviour.

**Deeper import paths.** `../pane-node` becomes `../tree/pane-node`, and from outside the slice
`regions/pane/pane-node` becomes `regions/pane/tree/pane-node`. That is the cost of the folder
telling the truth, and it is the cost `regions/content` already pays.

**Spec files split badly if split carelessly.** `retention.spec.ts` covers seven source files at
once, which is why it is 1034 lines. Splitting it by source file may cut through a scenario that
spans two of them. Where that happens the spec stays whole and the baseline keeps no entry for it,
since specs are not measured.

## What the split took out of the code

One explanation had nowhere left to sit, the same way the content tab split lost one. `healedPrimary`
carried a JSDoc block, tolerated while it lived in `pane-node.ts` only because the comment guard
permits a comment when any name in the declaration or its neighbourhood reaches the packed
declarations. In `tree/pane-restore.ts` none does, and the block became what the house rule always
called it. It is recorded here rather than deleted.

> The primary pointer a tree can honour: the candidate if a leaf by that id exists, else the first
> leaf. A tree always has a primary pane, so a pointer whose leaf disappeared, because the primary
> pane was closed or a hydrated tree never knew it, re-points instead of dangling.

## Open Questions

Whether `atomic-move.ts` belongs in `tree/` or in `drag/`. It is a tree operation used almost
exclusively by the drag machinery. Decided during implementation by which import direction ends up
shorter.
