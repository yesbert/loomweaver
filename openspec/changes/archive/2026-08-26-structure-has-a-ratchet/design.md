## Context

The engineering standards say folders are cut by feature and a file holds one concept, and
`openspec/config.yaml` repeats both for every OpenSpec run. Both statements are true as intent and
false as description, and nothing in the repository could tell the difference.

The research behind this change is recorded here because it decided the shape of the whole series.
Angular's own style guide states the two rules we are enforcing: *"Organize your project into
subdirectories based on the features of your application"* and *"Avoid creating subdirectories based
on the type of code that lives in those directories. For example, avoid creating directories like
`components`, `directives`, and `services`."* On file size it says *"Prefer focusing source files on
a single concept"* and, where the call is close, *"go with the approach that leads to smaller files"*.

Nx's guidance on Angular architecture cuts vertically by domain and warns in the other direction:
*"You should not just go and create a library for each component. That's probably too much."* It
names circular dependencies between boundaries and frequent cross-boundary changes as the symptoms
of having cut too finely. Feature-Sliced Design offers the third position, a fixed vocabulary of
technical segments (`ui`, `model`, `api`, `lib`) inside a slice; its own critics name the steep
learning curve and the cost of migrating an existing codebase as the price.

Clean Architecture in the classic layering does not fit this platform and was rejected on that
ground. Its centre is a domain of entities and use cases, and LoomWeaver contains zero domain logic
by design. What does fit is its dependency rule, and that is already in place under other names:
`persistence-ports`, the plugin contract, the backend seam expressed as ports, and the `foundation/`
slice with its ESLint import restriction.

## Goals / Non-Goals

**Goals**

- Make folder fan-out and file length measurable and monotonic.
- Fix the two thresholds as numbers, so the following three changes have an acceptance criterion
  rather than a taste argument.
- Record the current state honestly, including what this audit will not fix.

**Non-Goals**

- Moving any file. This change only measures and writes the rule down; the cuts are the three
  changes that follow.
- Technical sub-folders inside a slice (`services/`, `components/`, `models/`). Deliberately
  deferred: they are the option to reach for if cutting by sub-theme turns out not to be enough,
  and reaching for them first would recreate the type-folder problem one level deeper.
- Splitting spec files as a goal of their own. They follow whatever the source split does.
- A line limit on `.spec.ts` files. A long spec is usually a well-covered subject, and the four
  longest specs in the shell sit under the four subjects this series is about.

## Decisions

**A concept is one non-spec `.ts` file.** Templates and specs do not count, because they are not
independent things to understand: `pane-view.html` and `pane-view.spec.ts` are the same concept as
`pane-view.ts`. This is why `regions/pane` counts as 31 and not 56. Counting concepts rather than
files is also what makes the threshold comparable across slices that happen to have different test
density.

**Twelve concepts per folder.** The number comes from the measured distribution, not from a rule of
thumb. Across the whole platform the counts are 31, 22, 22, 21, 14, then a gap down to 12 and below.
Setting the threshold at 12 flags exactly the five folders that are visibly harder to read than
their siblings and leaves the other forty alone. A tighter threshold would flag `regions/panel` at
11 and `plugin` at 11, which are navigable today, and would be over-splitting of the kind Nx warns
about.

**Four hundred lines per source file.** Same method: the measured lengths run 942, 752, 708, 544,
515, 492, 475, 412, 409, 403, then fall away. Four hundred is where the tail ends. The rule is
phrased as *must be justified*, not *must be split*, because a generator recipe that emits a large
template legitimately has one concept and many lines.

**Baseline, not hard failure.** A hard threshold would either block this branch or force ten splits
at once. The ratchet is the pattern this repository already uses three times over. It fails on a new
violation, on a worse existing violation, and on a stale entry, so the file cannot drift out of
truth in either direction.

**`regions/` stays as an intermediate level.** The five regions are a sachgroup, the screen areas of
the shell, not a technical kind. Flattening them would put five more entries at the top of `lib/`,
which already holds 24, and the cycle checker's slice definition already treats `regions/*` as one
level deeper.

## Risks / Trade-offs

**The threshold invites gaming.** A folder at 13 concepts can be brought under by inventing a
sub-folder for one file. The mitigation is review, not machinery: the checker measures, the
reviewer judges whether the cut names a theme.

**Ten recorded file entries look like ten accepted defects.** Six of them are, in the sense that
nobody has looked at them yet. Naming them in the baseline is what makes them findable later; the
alternative is that they stay invisible, which is the state this change exists to end.

**A seventh CI step.** Each guard adds seconds to the build and a place a contributor can be blocked
by something they did not expect. The mitigation is the same as for the other six: the failure
message names the file, the number and the threshold, and says what to do.

## Open Questions

Whether the `plugin-sdk` folder at 22 concepts should be cut at all. It is the contract package and
almost every file is a type declaration, so the fan-out may be the honest shape of a flat contract
rather than a tangle. Recorded in the baseline, decided later.
