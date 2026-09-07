## 1. Carry the threshold on the amendment

- [x] 1.1 Add an optional budget field to the build-target amendment's type, beside `serviceWorker`
      and `inlineCritical`, with the same kind of comment those carry: what default it replaces and
      why the replacement is a correction rather than a preference.
- [x] 1.2 Merge it into the release configuration of the build target, replacing the initial-bundle
      entry the workspace carries and leaving every other entry alone. A workspace with no budgets
      at all gets the entry added.
- [x] 1.3 Name it in the run's account of what was wired into `angular.json`, in the same list as
      the service worker and the critical-CSS setting, with both figures in the line.
- [x] 1.4 Unit tests for the merge: the entry is replaced rather than appended, other entries
      survive, and a workspace without budgets gains one.

## 2. Set the figures

- [x] 2.1 Fill the field in the distribution recipe with the pair from design.md — 1 MB warning,
      1.5 MB error — as two figures stated once, beside the other corrections.
- [x] 2.3 The Nx route writes its own build target and carries the same wrong pair by hand
      (`maximumError: '1mb'`). Found while implementing: fixing only the amendment leaves the Nx
      route failing exactly as before. It takes the same figures, from the same place.
- [x] 2.4 The generated notes tell the consumer "the scaffold cannot know your budget ... so raise
      the budgets in your build target". Found while implementing. That sentence is false once the
      scaffold sets them, so it says what was set and why instead, which is what a consumer needs to
      lower it again.
- [x] 2.2 Re-measure the floor before believing the pair: generate a distribution into a fresh
      workspace, build it for release, and record the initial total in this file. If it has moved
      far enough that the warning no longer sits about 100 kB above it, bring the figures to the
      measurement and say so here rather than keeping the number in design.md.
      Measured 2026-09-07. The floor is 900.78 kB: `ng new` plus the distribution scaffold and
      nothing else, built for release. The pair from design.md did not survive it — the tutorial
      example, an unremarkable two-weaver product at 1.01 MB, tripped the 1 MB warning on its first
      build with about 110 kB of its own code in the bundle. The figures are now 1.5 MB warning and
      2 MB error, which leaves a product some 600 kB before the warning and about 1.1 MB before the
      build stops. design.md records why the first pair was wrong.

## 3. Pin it

- [x] 3.1 A scaffolding test that generates a distribution into a fresh application workspace and
      builds it for release, asserting the build completes. The existing coverage serves; serving is
      the path that does not check budgets.
- [x] 3.2 A test for the second scenario: the threshold the generator sets can still be exceeded, so
      that raising it out of reach fails rather than passes.

## 4. Reconcile the example

- [x] 4.1 Bring `examples/assistant-workbench/angular.json` onto the figures the scaffold now sets,
      removing the hand-raised 1.5 MB / 2.5 MB pair, and build it for release to confirm it fits.
      If it does not fit, the figures are wrong; fix them in the recipe rather than in the example.
      It did not fit the first pair, and the figures were the thing that changed. On 1.5 MB / 2 MB
      the example builds at 1.01 MB with no warning and no error.

## 5. Verify

- [x] 5.1 Follow the tutorial's step 1 from scratch against the built devkit — `ng new`, the two
      installs, the three scaffold commands — and run a release build. It completes, and the run's
      report names the budget.
      Run 2026-09-07. The report ends with `+ production budget initial: 1.5MB warning, 2MB error`,
      `angular.json` carries the pair, and `ng build` completes at 1.00 MB with neither a warning
      nor an error. The same path failed before this change.
- [x] 5.2 `openspec validate the-scaffold-sets-a-budget-the-shell-fits --strict` passes.
