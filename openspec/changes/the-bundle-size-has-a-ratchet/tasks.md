## 1. The checker

- [ ] 1.1 Write `platform/tools/check-bundle-size.mjs`: takes application names as arguments,
      resolves each one's build output, sums the scripts and stylesheets `index.html` references,
      and reports each measurement in kilobytes.
- [ ] 1.2 Fail when a named application has no build output, naming the path it looked in, so a
      moved output path cannot turn the guard into a no-op.
- [ ] 1.3 Compare against `platform/tools/bundle-size-baseline.json`: fail when a measurement
      exceeds its recorded ceiling, and fail as stale when it falls below the ceiling's step or when
      the file records an application the run did not measure.
- [ ] 1.4 Add `--write-baseline`, which records each measurement rounded up to the next 5 kB.
- [ ] 1.5 Open the file with the comment the other checkers carry: what it fails on, why the band is
      five kilobytes, and that the baseline is a ratchet rather than an allowance.
- [ ] 1.6 Add `bundle-size-check` to `platform/package.json`, beside the other checks.

## 2. The first baseline

- [ ] 2.1 Build all four applications and record the ceiling for each with `--write-baseline`.
- [ ] 2.2 Verify each measurement against the `Initial total` the builder prints for that
      application, and note in the checker where the two are expected to agree. A divergence here
      means `index.html` is not the right source and the design decision has to be revisited.

## 3. Wiring it into CI

- [ ] 3.1 In *Build + test*, after the Nx build, check `loom-shell` and `loom-testbed`.
- [ ] 3.2 In *Demo product*, after its build, check `demo`.
- [ ] 3.3 In *Assistant workbench example*, after its build, check `assistant-workbench`.
- [ ] 3.4 Confirm the two product jobs can run a checker that lives in `platform/tools` without
      `platform`'s dependencies installed, since it is plain Node with no imports beyond the standard
      library.

## 4. Proving it fails

- [ ] 4.1 Add bytes to one application, confirm the check fails and says which application, what it
      measured and what was recorded.
- [ ] 4.2 Lower one recorded ceiling, confirm the stale direction fails too.
- [ ] 4.3 Rename one build output path, confirm the missing-output case fails rather than passing.

## 5. Writing it down

- [ ] 5.1 Add the guard to *Guards this repository runs* in `docs/reference/operations.md`, in the
      table's own voice: what it fails on, and that it reads `dist/` so the build has to have run.
- [ ] 5.2 Add the baseline refresh to `.claude/docs/reference/releasing.md`, saying why the two
      products move at a release and the two workspace applications do not.
- [ ] 5.3 Run `openspec validate --all --strict`, the full test suite and every guard before handing
      it over.
