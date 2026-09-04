## Context

See proposal.md, *Why*. What shapes the approach here is that a region id is an ordinary string on
both sides of a seam nobody type-checks. A distribution declares ids in its layout; a weaver names
them in `docks`, `rail` and `bar`. A contribution aimed at an id nobody declared renders nothing and
reports nothing, which is exactly how the previous defect stayed hidden.

Two guards already exist and constrain the rename. `platform/tools/check-region-ids.mjs` pins the
shell defaults and the weaver recipe against the ids the scaffold emits, reading
`platform/libs/tooling/devkit/src/recipes/shell-regions.ts` as the source. A unit test in
`layout.spec.ts` holds the bare `DEFAULT_LAYOUT` to the same set. Neither reads the testbed, so
neither will catch a half-finished rename there. The testbed's own coverage is the unit spec beside
it and the end-to-end suite.

The testbed declares three regions the scaffold does not: a right rail and two side footers. They
have to be named by the same convention as everything else, and the convention has to be decided
rather than improvised.

## Goals / Non-Goals

**Goals:**

- One set of region ids across the repository, so a snippet read anywhere pastes anywhere.
- The rename is complete in one commit: no window in which the testbed declares one id and
  contributes to another.
- The deviation sentence in the reference documentation disappears rather than being updated.

**Non-Goals:**

- Renaming anything in the scaffold. Every product generated so far carries those ids in its own
  composition root, so a rename there is a breaking change for other people's code.
- Introducing validation that a contribution names a declared region. That is worth doing and is a
  separate change, because it needs a decision about whether an unknown id warns or fails.
- Touching the demo product. It already uses the scaffold's ids.

## Decisions

**The scaffold wins, not the testbed.** The alternative was to rename the scaffold to the testbed's
vocabulary, which reads better in isolation: `activity` says what the rail is for, and `primary` and
`secondary` pair naturally. It was rejected because the scaffold's ids are already in other people's
repositories. A scaffolded product owns its composition root, so the platform cannot migrate it,
and a rename would show up as a silent loss of chrome exactly like the defect this change is meant
to end. The testbed is ours alone.

**The right rail becomes `secondary`, not `right-rail`.** The scaffold names its one rail `primary`,
so the second rail of the same kind takes the next word in that series. Naming it `right-rail`
would be more literal but would then sit beside a left rail called `primary`, which reads as two
different schemes in one array. The footers stay `left-footer` and `right-footer`: they are bars,
the scaffold has no bar beyond `top-bar` and `status-bar`, and the dock-prefixed form is already
what they use.

**The scheme's own inconsistency stays.** The scaffold mixes a role name for the rail (`primary`)
with position names for the panels (`left-panel`, `right-panel`). That is not the shape one would
choose on a blank page. Making it consistent means changing the scaffold, which the first decision
rules out. Recording it here so the next reader knows it was seen and not overlooked.

**One commit, not a compatibility period.** A layout could declare both the old and the new id for
a while and let contributions migrate gradually. Rejected: the testbed is a single application in
this repository with no external consumer, so the only thing a transition period would buy is a
longer window in which the two vocabularies coexist, which is the problem being removed.

## Risks / Trade-offs

- **A half-finished rename renders nothing and says nothing.** No guard reads the testbed, so the
  build would stay green with a rail item pointing at a region that no longer exists.
  → The tasks require a repository-wide search for each old id after the edit, and an end-to-end run
  plus a manual look at the running testbed. The end-to-end suite drives the rails and the panels,
  so an orphaned contribution surfaces there.
- **Persisted layouts in a developer's browser key on region ids.** An existing testbed profile
  will not find its panels after the rename, and the workbench cannot tell that apart from a
  user who closed everything.
  → *Reset app layout* restores it. Noted in the tasks so whoever runs the suite locally is not
  surprised by an empty-looking testbed.
- **`secondary` changes meaning rather than disappearing.** Today it is the right panel; after this
  change it is the right rail. A search for the word during review will find hits that look correct
  and are not.
  → The rename is applied as one ordered pass with `secondary` handled last, and the tasks call for
  reading each hit rather than trusting a global replace.
