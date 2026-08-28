## Context

See proposal.md — Why. The measurement that shaped this design is that the two tangles are different
sizes, and conflating them would have produced the wrong tool.

A first look counted 32 mutually dependent slice pairs and suggested a large exception list. Running
Tarjan's algorithm over the actual file graph gave a much smaller number: **5 strongly connected
components covering 19 of 209 files.** The 32 pairs are real, but most are not cycles at all. Slice
A has a file importing from slice B, and slice B has a *different* file importing from slice A. At
file level that is a perfectly acyclic graph. At slice level it is a cycle, and it is the slice
level that decides whether an Nx library split is possible.

So there are two facts to guard, with different sizes and different urgencies:

- **File cycles: 5, and they are defects today.** They can be resolved now, so the baseline can be
  zero rather than a list.
- **Slice cycles: 32, and they are not defects.** They are the distance to a possible library split.
  They get a baseline that may shrink.

## Goals / Non-Goals

**Goals:**

- Both numbers are printed by one command and checked by CI.
- Neither number can grow without someone deciding to let it.
- The shell's file graph is acyclic when this change lands.

**Non-Goals:**

- Untangling the slices. That is the next change, and it is where the design work is. Here the 32
  pairs are only recorded.
- Splitting the shell into libraries. The agreed direction is enforced boundaries inside one
  library, with a real split left open.
- Guarding anything outside `platform/libs/core/shell`. The other libraries are small enough that
  the tangle has not arisen; extending the checker to them is a one-line change when it does.

## Decisions

**A house checker, not `eslint-plugin-import`.** `import/no-cycle` would catch the 5 file cycles and
would be blind to all 32 slice pairs, because ESLint has no notion of a slice. Guarding both would
mean one plugin plus a second mechanism, and a new dependency in the bargain. A single checker in
`platform/tools/` does both, matches the four checkers already there, and keeps the slice definition
in one readable place. The cost is that we maintain a graph walk; it is about forty lines and the
algorithm is not in dispute.

**Baseline as a checked-in file, not a threshold.** A count ("no more than 32") lets one pair be
resolved and another appear with the total unchanged. The baseline is therefore the explicit list of
pairs. The checker fails on a pair that is not in the list, and fails equally when a listed pair no
longer exists, which forces the list to be trimmed as the work proceeds rather than rotting into a
list of things that used to be true.

**Resolve the file cycles in this change rather than baselining them.** Nineteen files is small
enough to fix now, and a file-level baseline of zero is worth far more than one of five: the next
change moves a lot of code between slices, and it needs a guard that is already tight. The two-file
cycles are the familiar service-plus-dialog and service-plus-policy shapes and should fall out
easily; the seven- and six-file components need real thought and are the reason this change is not
trivial.

**Slice definition mirrors the folder layout, with two adjustments.** A slice is a direct child of
`src/lib/`, except that `regions/*` counts one level deeper (`regions/pane` is a slice, not
`regions`) because that is where the fachlichkeit actually sits, and `elements/*` collapses upward
(`elements` is one slice) because the `<lw-*>` kit is one cross-cutting unit. Files directly in
`src/lib/` form the composition root. Any other definition would produce numbers that do not match
how the code is discussed.

## Risks / Trade-offs

**The seven-file cycle resists a clean fix** → it spans the content-tabs and pane-drag machinery,
which is the most-tested area of the shell (`content-tabs.service.spec.ts` at 1,040 lines,
`retention.spec.ts` at 1,034). Fix it behind those tests, and if it does not come apart cleanly,
baseline that one component with a stated reason rather than forcing a bad cut. Four of five
resolved with one named exception is a better outcome than five contorted files.

**Resolving a cycle changes the published surface by accident** → the shell's consumers import from
the barrel only, so moving a symbol between files is invisible as long as `index.ts` still exports
it. Verify the way this repository already verifies it: build the packed `.d.ts` and diff it against
the same artefact built from `main`. Byte-identical or the change is not done.

**The baseline file becomes a place to hide** → it is reviewed like code, one line per pair, and the
checker rejects stale entries. A growing baseline is visible in a diff.

**The checker disagrees with reality and blocks work** → calibrate it before trusting it, the way
this repository has learned to: it must report exactly the 5 components and 32 pairs measured here
before it is wired into CI. A checker that reports a different number is wrong until proven
otherwise, and the documentation of that failure mode is not hypothetical here.

## Open Questions

None that change the approach. Whether the seven-file component ends up resolved or baselined is
settled during the work, and the task list carries both outcomes.
