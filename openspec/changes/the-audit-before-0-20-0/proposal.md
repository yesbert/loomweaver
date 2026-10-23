> **Status:** approved.

## Why

A full code audit before 0.20.0, the first since mid-August, found 41 defects across the shell, the
plugin SDK, the AG-UI adapter, the frame kit, the scaffolding tools, the demo, the guards and the
release workflow. The findings from the work since 0.19.2 and three in the frame kit are fixed
already (#831, #832). This change is the worklist for the rest, and states the two guarantees the
audit showed were missing.

Most findings are defects against requirements the specifications already state: the isolation level
shown wherever a plugin's reach is shown, inline addresses refused, persisted state kept and removed
with its plugin, WCAG 2.1 AA, a generator that refuses rather than overwrites, a mistyped option that
fails. Those need a fix and a test, not a new requirement.

Two need one:

- The agent connection ran any command id an agent named, including a command the hosting plugin
  never opened to callers, because a plugin always reaches its own commands. The specification says a
  command beyond an agent's reach is put there by not opening it; through the connection it was not.
  And it named each tool by the command id, which carries dots, while the common model APIs accept
  only letters, digits, underscores and hyphens in a tool name.
- A catalogue entry's identity was any non-empty string. An entry called `shell` replaced the
  workbench's own settings sections, and an identity with a colon shared stored values with another
  plugin.

## What Changes

- The agent connection runs only the commands it offers as tools, and names each tool in a form the
  common model APIs accept, translating the name back when a call arrives. **BREAKING** for an agent
  backend that relied on a tool being named exactly by its command id, or on calling an unlisted id.
- A catalogue entry's identity has a form (lower-case letters, digits, dots and hyphens, starting with
  a letter or digit), and the workbench's own namespace is reserved; an entry outside the form is
  refused when the catalogue is read and when the installed list is read back. **BREAKING** for a
  catalogue whose entries use any other identity.
- Everything else the audit found is fixed against the requirement it fails, with a test that fails
  first. The task list names each.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: the agent connection runs only what it offered, under names the common model APIs
  accept.
- `plugin-store`: a catalogue entry's identity has a form, and the workbench's own namespace is
  reserved.

## Impact

Shell (plugin store, plugin runtime, persistence, regions, elements, dialogs), `@loomweaver/ag-ui`,
`@loomweaver/devkit`, `@loomweaver/cli`, the demo, the guards under `platform/tools/checks`, the
release workflow and `docs/reference/operations.md`. Ships in 0.20.0.
