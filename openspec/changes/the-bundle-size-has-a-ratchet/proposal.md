# The bundle size has a ratchet

> **Status:** proposed — not approved for implementation yet.

## Why

Angular's budgets catch a jump and nothing else. The four applications this repository builds now
sit a quarter-megabyte under their limits, which means a release may add 80 kB and report success,
and the next one may add 80 kB again. Nothing says a word until a limit breaks years later, and by
then the growth is a hundred small commits nobody can attribute.

That gap is not hypothetical here. Two of the four budgets warned on every production build for
long enough that the line stopped being read, and the size those warnings were about — 898 kB for a
workbench with no product in it — was never measured by anything that could fail.

## What Changes

- A checker measures the initial bundle of every application this repository builds and fails when
  one grows past a recorded ceiling.
- The four applications are covered: `loom-shell` and `loom-testbed` inside the Nx workspace, and
  the `demo` and `assistant-workbench` products that build against the published packages.
- The ceiling is the measured size rounded up to the next 5 kB, so ordinary movement passes and
  real growth has to be recorded on purpose.
- The baseline is a ratchet in the shape this repository already uses twice: a new violation fails,
  a worse one fails, and an entry that no longer matches what is measured fails as stale.
- The release checklist gains one step, because the two products build against published packages
  and their size legitimately changes when a release lands.

## Capabilities

### New Capabilities

None. This is a repository guard: it constrains how we work, not what the platform guarantees to
anyone who consumes it. `.openspec.yaml` declares `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- **New:** `platform/tools/check-bundle-size.mjs`, `platform/tools/bundle-size-baseline.json`, and a
  `bundle-size-check` script in `platform/package.json`.
- **Changed:** `.github/workflows/build.yml` gains the step, in the job that already builds each
  application, so nothing is built twice.
- **Changed:** `docs/reference/operations.md` records the guard in *Guards this repository runs*,
  beside the budget rule that already sits in *Verifying*.
- **Changed:** `.claude/docs/reference/releasing.md` gains the baseline refresh step.
- **Dissolves:** nothing. The Angular budgets stay where they are and keep their own job, which is
  the coarse backstop a single build can enforce without a baseline.
