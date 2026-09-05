> **Status:** approved — approved for implementation on 2026-09-05.

## Why

Whether an agent can reach a command is decided by three things on its registration: that it is
opened to callers other than its own plugin, that it carries a description written for something
choosing between actions, and that its arguments are described and its answer declared where the
return value matters. Nothing generates that for a command a team already has, and nothing should,
because it would mean rewriting a consumer's code. What is missing is the check: today a developer
finds out that `quotes.send` is invisible to the assistant by asking the assistant and getting
nothing, and the only help the platform gives is a dev-mode warning for a callable command without a
description. The tutorial's first reader will meet exactly this on their own commands.

## What Changes

- **A check over a plugin's sources that says, per command, whether an agent can reach it and
  what is missing.** It reads the command registrations in a directory and reports each command
  with one of three outcomes: reachable; reachable but poorly described, naming the argument or the
  answer that lacks a description; not reachable, naming the field that closes it. Each finding
  names the consequence, as the existing checks do: "an agent is never offered this command",
  "an agent sees this argument as a bare name".
- **Offered through the three routes the other checks use.** The CLI as `validate-commands
  --dir <dir> [--strict]`, the MCP server as a tool an assistant in a product repository can call,
  and the devkit as the function both wrap.
- **Strict mode fails on what closes a command, not on style.** In strict mode a callable command
  without a description fails, because that is the dev-mode warning turned into a gate; a missing
  argument description is a warning; a command that is not callable is information, because
  closed is the intended default.
- **What cannot be judged is said.** The check reads source, not a running workbench: access
  gating, capability grants and the plugin's own `automation` grant decide the rest at runtime, and
  the report says so once rather than pretending to know.

No change to the workbench, the adapter or the generators; a plugin that never runs the check is
unaffected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: the checks a consumer can run over their own declarations gain the command
  registrations, with findings that say what an agent will and will not be offered.

## Impact

**Devkit.** A new validator beside the manifest, i18n and catalogue validators under
`platform/libs/tooling/devkit/src/lib/validate/`, with its tests; it parses `registerCommand`
object literals from TypeScript sources with the compiler API the devkit already carries.

**CLI and MCP.** One subcommand in the CLI's `run.ts` and one tool in the MCP server's `tools.ts`,
mirroring the three existing checks, with their tests and the CLI's own usage text.

**Documentation.** `docs/reference/callable-commands.md` names the check where it explains the
fields; `docs/scaffolding.md` lists it beside the other checks; the MCP server's tool list in
`docs/` wherever it is enumerated.

**Example.** `examples/assistant-workbench/` gains nothing; its five commands are the first thing
the check is run against, and the tutorial mentions the command in one sentence.

**Legacy sources dissolved.** None.
