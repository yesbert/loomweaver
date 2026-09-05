> **Status:** proposed — not approved for implementation yet.

## Why

The command the weaver generator writes with `--command`, and therefore the one the agent
connection demonstrates, carries a title, a description and `callable: true`, and nothing else: no
argument, no answer, a toast as its effect. It is the pattern a reader copies, and it teaches the
two-field command. What makes a command useful to an agent is the other half, an argument the agent
fills from a description and an answer it can read, and the tutorial had to introduce both from
scratch. The generated stand-in even says in its own comment that it sends no arguments because it
has nothing to fill them from. The example should be the complete one.

## What Changes

- **The generated command declares an argument and an answer.** One argument of the `choice`
  kind with a description written for something choosing, and `answers` declared, with a `run` that
  returns a small plain value the panel can show. The toast stays as the visible effect, so the
  command still demonstrates something when a person triggers it from the rail, the shortcut or the
  palette.
- **The stand-in fills the argument from the schema.** Instead of sending `{}`, it picks the first
  declared choice, so the generated path shows arguments streaming in pieces and an answer coming
  back, which is the part of the protocol a reader most needs to see once.
- **The translation bundles and the generated tests follow.** The argument's description is a key
  in both bundles; the generated connection test asserts the answer's content rather than a fixed
  string.

The distribution, the layout and the panel are untouched. A weaver generated without `--command`
and without `--agent` is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: the command generated beside an agent connection demonstrates a described argument
  and a declared answer, and the stand-in exercises both.

## Impact

**Devkit and CLI.** The weaver recipe's command block, its i18n bundles, the stand-in template and
the connection's generated spec under `platform/libs/tooling/devkit/src/recipes/angular-weaver/`,
plus the recipe tests and the CLI's snapshot tests.

**Guards.** The quick-start guard scaffolds `--command` and `--agent` already and will exercise the
new shape without a change.

**Documentation.** `docs/scaffolding.md` where it describes the generated command; the tutorial's
example under `examples/assistant-workbench/` is unaffected because its commands were written by
hand.

**Legacy sources dissolved.** None.
