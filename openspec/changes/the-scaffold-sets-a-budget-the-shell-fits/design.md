## Context

See proposal.md — *Why*. What the approach turns on are two measurements taken on 2026-09-07 against
the published 0.9.1, each from `ng new` followed by the distribution scaffold and nothing else:

| What was built | Initial JS | Initial CSS | Initial total | Against `ng new`'s budget |
| --- | --- | --- | --- | --- |
| Distribution, no weavers | 823.15 kB | 77.62 kB | **900.78 kB** | warns, still builds |
| Distribution, two weavers | 932.55 kB | 78.12 kB | **1.01 MB** | **fails**, 10.67 kB over |

The floor is therefore about 901 kB, and `ng new` leaves 1 MB before the build stops. Roughly a
tenth of the allowance is the consumer's. The second row is the tutorial's own workbench, which is
an unremarkable product: two weavers, a handful of commands, a list and a detail view.

The place to correct it already exists. The distribution recipe returns a build-target amendment
that rewrites the same target in `angular.json` — stylesheet, three asset globs, service worker,
`inlineCritical: false`. The type carrying that last field says in its own words why it is there:
`false here is not a preference`, but a correction of a default the generated document invalidates.
The budget is the same shape of problem in the same file, reached by the same code path.

## Goals / Non-Goals

**Goals:**

- A generated distribution builds for release with no edit to a file the consumer did not write.
- The threshold that replaces the default is one a consumer's own growth can still cross.
- The chosen number is visible where the scaffold already accounts for what it wired.

**Non-Goals:**

- Making the workbench smaller. The floor is what it is; this change measures it and says so. If
  901 kB is too much, that is a different change with a different argument.
- Budgets for anything but the initial bundle. `ng new` writes a component-style budget as well and
  the workbench does not disturb it.
- Retrofitting projects generated before this. The file belongs to the consumer once written.

## Decisions

**Set the threshold from the measured floor, with the consumer's share stated.** Warning at 1.5 MB,
error at 2 MB, so a product has some 600 kB of its own before the warning speaks and roughly twice
that before the build stops.

The figures were 1 MB and 1.5 MB when this was written, on the reasoning that a warning 100 kB above
the floor speaks the first time the consumer's own code is a noticeable part of the bundle. Building
the tutorial example against them disproved it: at 1.01 MB, with about 110 kB of its own code, it
warned immediately. A warning that a modest two-weaver product trips on its first build is the noise
this section set out to avoid, so the figures went to the measurement rather than the measurement
being argued with.

*Alternative rejected:* the 1.5 MB / 2.5 MB pair the tutorial example set by hand. Its warning was
right and its error was not — 2.5 MB is far enough out that a consumer could triple their own code
before hearing anything. The example is brought onto the platform's pair, which is also how the
figure gets tested: if it pinches there, it will pinch elsewhere.

*Alternative rejected:* removing the budget from the generated workspace. It would end the failure
and the guard together, and a consumer who wanted the guard would have to reconstruct it without
knowing what the floor is.

**Raise the threshold, never lower it.** The amendment module opens with its own invariant: every
amendment is an "ensure this is present", never a "set this to", and a value the consumer already
chose always wins. A budget cannot simply be overwritten under that rule, and it should not be: a
consumer who set 3 MB deliberately would be pulled down to ours. So the entry is replaced only where
the recorded error threshold is below what the generated output needs — which is exactly the case
that fails today, because a fresh workspace always carries `ng new`'s 1 MB. A workspace already
above the figure keeps what it has, and applying the amendment twice changes nothing.

This was not visible when the design was written; it came out of the module's own header while
implementing, and it is recorded here rather than left in the code to be rediscovered.

**Carry it on the amendment that already rewrites the build target.** One optional field beside
`serviceWorker` and `inlineCritical`, filled by the distribution recipe, merged by the same code and
reported by the same reporter. The alternative — a separate amendment kind for budgets — would give
the merge a second way to reach the same target for no gain.

**State the numbers once.** They are two figures that must agree with a measurement, so they live in
the recipe beside the other corrections, not in a template the recipe interpolates and not in two
places for the two thresholds.

**Pin it with a release build, not a served one.** The existing scenario for a generated
distribution serves it; `ng serve` is exactly the path that does not check budgets, which is why
this went unseen. The test builds for release.

## Risks / Trade-offs

**The number ages.** The floor moves with every dependency the shell takes on, and a threshold set
100 kB above it turns into noise or into a wall. → The scaffolding test builds a generated
distribution for release, so the floor is measured on every run rather than remembered; a floor that
grows into the warning fails the second scenario and is a finding, not a surprise.

**A budget in the merge is a number the platform now has an opinion about.** A consumer who wants a
different one edits their own `angular.json`, and a regenerate with `--force` overwrites it. → That
is already true of the service worker and the critical-CSS setting, and the report names the budget
so the consumer knows it was set rather than inherited.

**Bringing the example down from 2.5 MB could break its build.** → It measures 1.01 MB, so it has
room; if it did not, that is the change telling us the figure is wrong before a consumer does.

## Migration Plan

None. Projects generated before this change keep the file they have.
