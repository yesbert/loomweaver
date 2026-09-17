> **Status:** approved.

## Why

A command carries everything an agent needs to *choose* it — that it is open to a foreign caller,
what it does, what it takes and what it answers — and nothing about whether the agent's word alone
should be enough to run it. So every product that opens its commands to an agent keeps that
knowledge outside the commands, by hand: the generated agent connection holds a set of command ids
it treats as consequential, and the brief teaches the same shape. The list is code beside the thing
it describes, it drifts from it, and a command another plugin registered is outside the knowledge of
the weaver holding the list — it cannot know what is consequential about a command it did not write.

Stating it on the command puts it where the command's other statements already are, where the plugin
that wrote the command is the one that says it, and where everything that already reads a command can
read it too.

## What Changes

- A command MAY state what an agent's word is enough for: carried out on the agent's word alone,
  the person asked first, the person asked every time, or not on an agent's word at all.
- The statement travels with the command wherever the workbench accounts for it: a caller
  enumerating what it may invoke reads it, and a command described for an agent to choose from
  carries it beside what the command does.
- The platform states and does not enforce, exactly as a command's access requirement does today.
  Nothing is asked, nothing is remembered and nothing is refused on this account. Who asks, how, and
  whether an answer is remembered is the product's, and a command that must be out of an agent's
  reach is closed by not opening it to foreign callers at all.
- The generated agent connection names its consequential command by the command's own statement
  rather than by a set of ids beside it.
- The check over command registrations reports what a command says about it, and says nothing where
  a command says nothing: absence is a legitimate declaration, not an omission.
- Not part of this change, deliberately: asking on the product's behalf, a default that asks, a
  remembered answer, and any marking of the elements the workbench draws for such a command. The
  commands are the way an agent drives a LoomWeaver application; a second way through the page would
  have to be kept complete, and would say the same thing twice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: a new requirement — a command may state what an agent's word is enough for, the
  statement is carried to a caller that enumerates commands and to a description written for an
  agent, and the platform enforces nothing on it.
- `scaffolding`: the generated agent connection derives its decision from the command's own
  statement rather than from a list beside the commands; the command check reports the statement and
  does not fail on its absence.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/command.ts` — `Command` and `InvocableCommand` gain the
  optional statement.
- `platform/libs/core/shell/src/lib/**` — whatever builds the enumerated account of what a caller may
  invoke carries the statement through it.
- `platform/libs/integrations/ag-ui/src/lib/tool-definitions.ts` — `toolFor` carries the statement
  into the protocol's own place for a property of a tool.
- `platform/libs/tooling/devkit/src/recipes/angular-weaver/agent-files.ts` — dissolves the hard-coded
  `CONSEQUENTIAL` set: the generated `before` hook reads the statement off the call's command.
- `platform/libs/tooling/devkit/src/lib/validate/commands.ts` — the agent report gains a factual
  line, with no guessing from ids or titles.
- `llms-full.txt` — the AG-UI section's `DESTRUCTIVE.has(call.commandId)` example, and the command
  section, state the declaration instead of the list.
- NextPA finding **F-025** is what this answers; the two places NextPA keeps the outcomes by hand
  (`adopt-ag-ui-for-surface-control-and-runs` task 3.3, and the rules in `chat-weaver`) are what it
  dissolves there once adopted.
- No breaking change: the statement is optional and absent means what the platform does today.
