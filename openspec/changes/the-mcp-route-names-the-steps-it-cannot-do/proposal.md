> **Status:** proposed — not approved for implementation yet.

## Why

The `scaffolding` capability requires that a route without workspace access names every
workspace-level step its output still needs, at generation time and not only in a guide
(*A route that cannot finish the wiring says what is left*). The MCP route is that route. Asked for
an auth stand-in, `scaffold_auth_source` answers with five files and nothing else: no
`provideAuthSource` line, no capability grant for the session plugin, no translation namespace, no
asset glob, and no `provideIcons` for the two icons the generated rail item names. The CLI and the
Nx generator apply all of those as amendments; over MCP the amendment list is built only when a
target directory is known, and the server never knows one, so the list is empty and the response
says nothing.

The weaver scaffold has the same guard and gets away with it because its output carries a
`README.md` that lists the wiring. The auth-source output carries no such file. The gap was found on
2026-09-08 while recording a run for the assistant guide: the assistant discovered the missing icons
by reading the shell's type declarations for a quarter of an hour, and a reader would have shipped
a rail with an empty square in it.

## What Changes

- The MCP route names the remaining steps for `scaffold_auth_source`: composing the plugin, the
  grant, the namespace, the asset glob, and the icon provider with its two Heroicons imports, each
  with what fails when it is skipped. Which mechanism carries them is the design's decision: the
  directory-independent amendments returned regardless of a directory, or a generated `README.md`
  as the weaver has, or both.
- A test pins it, in the MCP tool tests beside the ones for the distribution and the agent weaver.
- The same check is run over every other scaffold the MCP route offers, so that no second output
  is silently incomplete.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirement exists and the implementation fails it; this change makes the implementation
meet it and adds the test that was missing. The change declares `skip_specs`.

## Impact

- `platform/libs/tooling/devkit/src/recipes/auth-source/`: the amendments or a new README emitter.
- `platform/libs/tooling/mcp/src/lib/tools.spec.ts`: the pinning test.
- `docs/scaffolding.md`, if the adapter table's "names each step instead" gains a qualification.
- No legacy source is dissolved by this change.
