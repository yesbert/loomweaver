> **Status:** approved.

## Why

The `scaffolding` capability requires that a route with workspace access performs the wiring rather
than naming it (*A route with workspace access leaves nothing to be named*). The CLI is that route,
and it derives the generated project's directory from `--out`. With `--out .` that directory is the
empty string, and the weaver and auth-source recipes return no directory-bound amendments for an
empty directory: no asset glob, no stylesheet source, no composition. The CLI then neither applies
those steps nor names them, so `npx @loomweaver/cli auth-source --name dev --out .` writes four
files into the current directory and composes nothing, silently.

Found on 2026-09-08 while fixing the MCP route's version of the same gap
(`the-mcp-route-names-the-steps-it-cannot-do`). Every documented invocation uses a subdirectory
(`--out src/auth`, `--out src/notes`), so the case is an edge, but it is a silent one.

## What Changes

- The CLI treats the workspace root as a directory like any other: the recipes receive a value
  that means "here", and the amendments are applied with paths relative to it.
- A test pins it in the CLI suite: a weaver and an auth stand-in written with `--out .` compose
  into the application and serve their bundles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirement exists; the implementation fails it in one case. The change declares
`skip_specs`.

## Impact

- `platform/libs/tooling/cli/src/lib/scaffold.ts` (`directoryFromOut`) or the recipes' empty-directory
  guard, decided in the design.
- `platform/libs/tooling/cli/src/lib/run.spec.ts`: the pinning tests.
- No legacy source is dissolved by this change.
