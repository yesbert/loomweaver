## 1. The amendment seam

- [x] 1.1 Give a recipe a second product beside its `FileMap`: a declarative list of workspace
      amendments, each naming a file and the shape to ensure inside it. Types and a unit test that a
      recipe returning no amendments still behaves exactly as today.
- [x] 1.2 Implement the add-only merge over that list, independent of any route: an entry is added
      when absent, a value already present is left alone, and applying the same list twice changes
      nothing. Unit tests for each of those three, including a value the consumer set differently.
- [x] 1.3 Implement workspace-root discovery: walk up from the target directory to the nearest
      workspace marker. Unit tests for a project at the root, a nested project, and no marker found
      (which becomes a named remaining step, not a crash).

## 2. The command-line route applies amendments

- [x] 2.1 Extend the write plan to carry amendments alongside files, keeping the existing refusal of
      supplied targets that escape the target directory untouched and still covered by its tests.
- [x] 2.2 Report amendments in the run's output by name, alongside the files written.
- [x] 2.3 Report amendments in a trial run and write nothing. Test that a trial run over a workspace
      leaves both the files and the amended files byte-identical.
- [x] 2.4 Resolve which project in the workspace to amend: from the target directory, or from a single
      application, and where more than one could match, name the candidates rather than choosing.
      Tests for all three outcomes.

## 3. The distribution scaffold wires the build

- [x] 3.1 Declare the style-pipeline configuration as a workspace-root amendment, emitted only for the
      stylesheet mode that needs it. Merge into an existing data configuration; leave a configuration
      written as code untouched and name it as a remaining step.
- [x] 3.2 Declare the build-target amendments: the stylesheet, the three asset globs, the service
      worker, the release-build style setting that the generated content-security policy requires, and
      the budgets. Settle the budgets question from `design.md` while doing so.
- [x] 3.3 Apply the same declaration on the Nx route, which today writes everything except the style
      pipeline configuration. Test that the Nx route now produces it too.
- [x] 3.4 Update the generated `LOOMWEAVER.md` so its build-wiring and styles sections describe what
      was done rather than what to do, keeping only what is genuinely left to the reader.

## 4. The weaver scaffold wires itself in

- [x] 4.1 Declare the weaver's own i18n glob and its stylesheet source entry as amendments, so the
      command-line route performs what the Nx generator already does. Test parity between the two
      routes on the same workspace.

## 5. A generated plugin reaches the workbench

- [x] 5.1 Implement structural recognition of the composition root's providers array, and insertion of
      the plugin's import, its translation namespace, its capability grants taken from its own
      manifest, and its registration.
- [x] 5.2 Decline safely: an unrecognised composition root is left untouched, the lines to add are
      named, and the run does not report the plugin as composed in. Tests for a recognised root, an
      edited-but-recognisable root, and a root that cannot be recognised.
- [x] 5.3 Test that a second run over an already-composed root adds nothing a second time.

## 6. A route that cannot finish says what is left

- [x] 6.1 Render the amendment list as named steps with their consequences on the route that has no
      workspace access, and test that every amendment the other routes perform appears there.

## 7. The guides shrink to what remains

- [x] 7.1 Reduce the quick start in `README.md` to the commands that now suffice, and verify the
      result by running it.
- [x] 7.2 Rewrite the build-settings step in `docs/getting-started.md` as what the scaffold does, and
      move the by-hand account into `docs/manual-setup.md` rather than deleting it.
- [x] 7.3 Reconcile `docs/scaffolding.md`, `docs/building-a-distribution.md` and the devkit README
      with the new behaviour. The distribution guide carries its own callout telling the reader to
      set the release-build style setting by hand, which the scaffold now sets.
- [x] 7.4 Update `llms-full.txt`, which instructs a reader to add the service worker and that same
      style setting themselves. It is what an assistant reads about this platform, so a stale
      instruction there is repeated rather than merely read.
- [x] 7.5 Sweep the remaining guides for any other instruction to add wiring the scaffold now
      writes, and confirm `docs/reference/design-tokens.md` still describes the platform's own
      build rather than the consumer's.

## 8. The guard

- [x] 8.1 Write the quick-start guard: run the published commands against a fresh application using
      locally packed packages, then assert on the served result — the chrome's classes present in the
      styles, no build-time directive left in the stylesheet, strings resolved rather than shown as
      keys, and the release build styled under its own content-security policy.
- [x] 8.2 Make its report distinguish an install failure from an assertion failure, so a transient
      registry problem is not read as a regression.
- [x] 8.3 Add it to `.github/workflows/nightly.yml`, not to the merge gate.
- [x] 8.4 Confirm the guard fails against the current behaviour before the change, and passes after.

## 9. Close out

- [x] 9.1 `openspec validate --all --strict`, the repository's own guards, and the unit suites for the
      tooling libraries.
- [x] 9.2 Verify by hand once more in a fresh workspace that the quick start alone produces the
      working chrome, and record what the run showed.

## Verified

The published quick start was run against a fresh `ng new` application, installing the platform from
locally packed tarballs, in both the development and the release configuration. Both render the
branded chrome with its own strings resolved and the scaffolded weaver's icon in the activity rail,
with no console error and no failed request. The release stylesheet is 71.15 kB and carries the
chrome's utilities; before this change it was 34.14 kB and carried none, with `@plugin` and `@source`
surviving into it verbatim.

`npm run quick-start-check` exits 1 against the behaviour before the change, naming all nine
defects, and 0 after it.
