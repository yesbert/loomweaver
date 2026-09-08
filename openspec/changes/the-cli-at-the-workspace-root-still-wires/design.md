## Context

See `proposal.md`, Why. The mechanics:

- `directoryFromOut(out)` in the CLI returns the path of `--out` relative to the working directory,
  and the empty string when `--out` is the working directory itself or lies above it.
- `weaverAmendments` and `authSourceAmendments` return no directory-bound amendments when the
  normalised directory is empty. The guard exists for the route that has no directory at all; the
  MCP route now passes a placeholder instead, so the guard is reached only by the CLI with `--out .`
  and by the CLI with an `--out` above the working directory, which it refuses anyway.

## Goals / Non-Goals

**Goals:**

- `--out .` wires the application exactly as `--out src/notes` does, with the paths the empty
  directory implies (`src/lib/i18n` rather than `src/notes/src/lib/i18n`).

**Non-Goals:**

- No change to the MCP route or the Nx generator.
- No new option.

## Decisions

**Distinguish "no directory" from "the root".** The empty string means both today. The cleanest
fix is in the CLI: `directoryFromOut` returns `'.'` for the working directory, and the recipes'
`normalizeProjectRoot` keeps turning `'.'` into `''` for path building while the guard checks the
raw value for `undefined` rather than for emptiness. Alternative: drop the guard and let an empty
directory produce root-relative paths. Rejected only because the guard also protects the MCP
route's `bare` and no-directory cases; the design of the MCP fix keeps that route away from the
guard, but a second caller may not.

## Risks / Trade-offs

- **Root-relative asset globs and `@source` entries look different from the nested ones.** → They
  are what the structure implies; the test asserts the served bundle path, not the glob's spelling.
