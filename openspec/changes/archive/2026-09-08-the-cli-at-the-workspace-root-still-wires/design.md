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

**Distinguish "no directory" from "the root".** The empty string means both today.
`directoryFromOut` returns `'.'` for the working directory, and the recipes guard on the raw value
being absent rather than on the normalised one being empty. Alternative: drop the guard and let an
empty directory produce root-relative paths. Rejected only because the guard also protects the MCP
route's `bare` and no-directory cases; the design of the MCP fix keeps that route away from the
guard, but a second caller may not.

**Two corrections, found while implementing.**

This note first claimed the CLI refuses an `--out` above the working directory. It does not:
`write.ts` refuses paths that escape the *target* directory, which is a different thing, so
`--out ../elsewhere` runs and still yields the empty directory. The guard therefore stays keyed to
the empty string as well as to `undefined`, and that case keeps its present behaviour — a project
outside the workspace has no workspace-relative path to name. It is silent in the same way the
root case was, and it is not fixed here.

The note also expected `normalizeProjectRoot` alone to absorb `'.'`. It does, but only where it is
called. Two places built paths without it and had to change:

- `angular-distribution/recipe.ts` counts path segments to reach `node_modules` from the
  stylesheet. `'.'` counted as a segment and pushed the path one level too deep, which an existing
  test caught.
- The recipes concatenated `` `${directory}/src` ``, which yields a leading slash for the root.
  They now use `joinProjectPath`, the helper that already exists for exactly this.
- `cli/amend.ts` computes the `@source` entry as a path relative to the stylesheet. From
  `src/styles.css` to a source root of `src` that relation is `.`, and `posix.relative` answers
  with the empty string, so the entry was written empty.

## Risks / Trade-offs

- **Root-relative asset globs and `@source` entries look different from the nested ones.** → They
  are what the structure implies; the test asserts the served bundle path, not the glob's spelling.
