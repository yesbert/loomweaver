## Context

See proposal.md — Why. Two facts about this repository shape the approach.

The four applications are built in three different CI jobs. *Build + test* builds `loom-shell` and
`loom-testbed` from source inside the Nx workspace; *Demo product* and *Assistant workbench example*
each run in their own working directory, with their own `npm install`, against the published
packages. No single step can see all four build outputs.

The repository already carries this pattern twice. `structure-baseline.json` and
`cycle-baseline.json` are plain JSON beside a dependency-free `.mjs` checker, and both fail in three
directions: a new violation, a worse one, and an entry that no longer matches what is measured.
`check-head` in the website establishes the other half of the shape — a checker that reads `dist/`
and therefore requires the build to have run.

## Goals / Non-Goals

**Goals:**

- Fail the build when an application's initial bundle grows past a recorded ceiling.
- Measure what the browser actually fetches on first load, not an approximation of it.
- Keep the number legible to a person reading a diff: kilobytes, one line per application.
- Stay dependency-free, like every other checker in `platform/tools`.

**Non-Goals:**

- Compressed or transfer size. It is the number a user feels, but it moves with the compressor and
  the server, so it is not a stable thing to ratchet against.
- Lazy chunks and per-dependency attribution. Both are useful for an investigation and neither is a
  regression signal.
- Replacing the Angular budgets. They stay as the coarse backstop a single build enforces without
  needing a baseline, and they are enforced at a different moment, inside the build itself.
- Reducing the bundle. The deferral candidates found while measuring — `marked`, `penpal`, the
  dialogs — are separate work, and this guard is what would hold their gain afterwards.

## Decisions

**The size is read from the build output, not from the build log.** The checker resolves each
application's `index.html`, collects the scripts and stylesheets it references, and sums their bytes
on disk. That is the same set Angular calls *initial*, and it is what a browser fetches before it
renders anything.

The alternative was parsing the `Initial total` line the builder prints. Rejected: it is a
human-readable table whose shape is the builder's to change, and it exists only in a log that the
checker would have to be handed. Reading `dist/` also means the guard can run locally against a
build somebody already has.

A second alternative was `--stats-json`. Rejected as more moving parts for the same answer: it needs
a flag added to four build commands and still leaves the checker deciding which chunk is initial.

**The ceiling is the measurement rounded up to the next 5 kB.** Byte-exact would be the sharper
ratchet and the wrong one: every commit that touches shell code moves the bundle by some bytes, so
the baseline would need refreshing in almost every pull request, and a file everybody edits by rote
is a file nobody reads. Five kilobytes is under one per cent of the smallest of the four, so a real
addition still lands on a higher step.

**The checker is told which applications to check.** Each job names the ones it built, and a named
application with no build output fails. Letting it scan for whatever `dist` directories happen to
exist would mean an output path that moves turns the guard silently into a no-op — the failure mode
this repository has been bitten by before, most recently when a checker read a source path that had
moved and said so instead of passing quietly.

**Raw bytes, in kilobytes, in one baseline file.** One entry per application, so a diff shows what
grew and by how much without opening a tool.

**The two products are covered even though they move on release.** `demo` and `assistant-workbench`
build against the published packages, so their recorded ceiling legitimately changes when a release
lands. That is a step in the release checklist rather than a reason to exclude them: the number that
changes at a release is precisely the number that says what the release costs a consumer.

## Risks / Trade-offs

- **A stale `dist/` makes the guard measure the wrong thing** → the checker reads build output and
  cannot tell how old it is. In CI the build runs in the same job immediately before. Locally the
  guard is documented as requiring a build first, the same way `check-head` already is.
- **The 5 kB band lets growth through in small steps** → a run of four commits at 4 kB each still
  trips the next step, because the band is a ceiling and not a per-commit allowance. What it cannot
  catch is a single 4 kB addition, which is the price of not touching the baseline every day.
- **The release checklist gains a step that can be forgotten** → forgetting it fails the next build
  on `main` with a message naming the application and both numbers, which is a loud failure rather
  than a silent one.
- **`index.html` may not reference every byte of the first load** → verified once during
  implementation against the `Initial total` the builder prints for each of the four applications,
  and the checker's own output states what it summed, so a future divergence is visible rather than
  assumed.
