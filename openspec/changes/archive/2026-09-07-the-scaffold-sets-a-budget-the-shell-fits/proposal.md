> **Status:** approved — approved for implementation on 2026-09-07.

## Why

A generated distribution does not survive its first release build. `ng new` writes a bundle budget
sized for an empty Angular application — 500 kB warning, 1 MB error — and composing the workbench in
puts the initial bundle at 900.78 kB before the consumer has written a line of their own. The
scaffold leaves that number where it found it, so the consumer inherits a guard with about 100 kB of
room left in it. A distribution with two ordinary weavers measures 1.01 MB and the build stops with
`bundle initial exceeded maximum budget`.

Nothing warns before that moment, because `ng serve` does not check budgets. The consumer follows
the quick start, sees a working workbench, builds for release, and is told by a file they never
touched that their project is too big.

## What Changes

- **The distribution scaffold sets the bundle budget it makes necessary.** It already rewrites the
  build target in `angular.json` — the stylesheet, three asset globs, the service worker, and
  `inlineCritical: false` — and the budget is the same kind of entry: a default that stops being
  true the moment the workbench is composed in, corrected by the only party that knows it did so.
- **The numbers stay a guard.** They are set from the measured floor with room for a product, not
  set out of the way. A budget raised until nothing can trip it is worse than none, because it reads
  like a check and is not one.
- **The run says so.** The scaffold already reports what it wired into `angular.json`; the budget
  appears in that list like the service worker and the critical-CSS setting do, so the consumer
  learns the number was chosen rather than finding it later and wondering.

No consumer-visible behaviour of the workbench changes, and no generated source changes. What
changes is one entry in the workspace configuration a generated project carries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: *Generated output builds, passes its own checks, and needs no repair* already
  holds that generated output shall not require a consumer to fix it before it works, and that a
  generator with workspace access shall produce the configuration that output needs. A release build
  that fails on a budget the generator left behind is that requirement unmet. The delta adds the
  scenario that pins it; it states no new obligation.

## Impact

**Repository.** `platform/libs/tooling/devkit/src/recipes/angular-distribution/amendments.ts` gains
one field on the build-target amendment it already returns, and
`platform/libs/tooling/devkit/src/lib/amend/` grows the field's type, its merge and its line in the
report. The scaffolding tests gain a case that builds a generated distribution for release rather
than only serving it.

**Consumers.** A project generated after this carries different numbers in `angular.json`. A project
generated before it is unaffected, and the file is the consumer's to edit either way.

**The example.** `examples/assistant-workbench/` raised these numbers by hand to 1.5 MB and 2.5 MB
when it was built. Once the scaffold sets them, that edit is either redundant or a disagreement with
the platform's own figure; the change reconciles it rather than leaving two answers.

**Legacy sources dissolved.** None.
