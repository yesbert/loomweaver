# Agent tools — letting an AG-UI agent drive the workbench

[AG-UI](https://docs.ag-ui.com) is the protocol between a user-facing application and an agentic
backend. `@loomweaver/ag-ui` is the adapter: it describes the workbench's own commands to an agent as tools,
and runs what the agent asks for through the same seam every other trigger runs through.

The rule underneath it is the one from [callable commands](callable-commands.md): **an agent reaches
what the user could have reached, and nothing more.** This package adds no way past that.

## The whole integration

```ts
import { commandTools } from '@loomweaver/ag-ui';

const tools = commandTools(ctx);

// when a run starts — ask again each time, never keep the answer
agent.runAgent({ tools: tools.list(), threadId, runId, messages, context: [] });

// for every event the run produces
const answer = await tools.receive(event);
if (answer) {
  messages.push(answer);
}
```

`receive` answers a message when an event completed a call, and `null` otherwise. Events that are not
part of a tool call are ignored, so you can hand it everything without filtering first.

## What you get, and what you do not

The package is **headless**. It brings no transport, no user interface and no agent: you open the
connection, you draw the conversation, and you decide what the agent is. It has no Angular dependency
and no observables — you hand it one event at a time, which is also why it is easy to test.

`@ag-ui/core` and `@loomweaver/plugin-sdk` are peer dependencies, so a weaver that also builds its own agent
with `@ag-ui/client` resolves one copy of each rather than two.

## Ask for the list each run

```ts
tools.list();  // readonly Tool[]
```

`list()` reads `ctx.invocableCommands()` at the moment you call it. **Do not keep the answer.** What a
plugin may reach changes as plugins load and unload and as the session changes, and a list kept from
earlier promises actions that are no longer there.

Each entry is already narrowed by everything that would refuse the invocation: the command declared
itself `callable`, the session meets its `access`, it belongs in this window, and your plugin holds
the `automation` capability.

## The pieces, if you want less than the loop

| Export | What it is |
| --- | --- |
| `commandTools(ctx, options?)` | The whole integration: the list, the loop and the hook. Returns `CommandTools`. |
| `CommandTools` | `list()`, `receive(event)` and `flush()`. `flush` closes a call an agent left open; `receive` already does it when the run reports that it finished or errored. |
| `CommandAccess` | The slice of a plugin context this touches: `invocableCommands` and `invokeCommand`. Your `ctx` satisfies it; it is narrower on purpose, because it says exactly what an agent reaches through here. |
| `toolFor(command)` / `toolsFor(commands)` | The mapping alone, if you assemble the request yourself. An `InvocableCommand` becomes a protocol `Tool`, with the declared arguments as JSON Schema. |
| `readArguments(json)` | Reads the JSON an agent streamed into arguments the workbench can be handed, or `null` where it cannot. |
| `resultFor(toolCallId, outcome)` | Turns a `CommandOutcome` into the message that goes back, if you ran the call yourself. |

## The hook: confirming, declining, answering

A weaver may sit in front of every call. This is where a confirmation before a heavy step belongs, and
where a product's own policy goes.

```ts
const tools = commandTools(ctx, {
  before: async (call) => {
    if (!DESTRUCTIVE.has(call.commandId)) {
      return { decision: 'run' };
    }
    const confirmed = await ctx.ui.confirm({ message: 'agent.confirm' });
    return confirmed
      ? { decision: 'run' }
      : { decision: 'decline', reason: 'the user did not confirm it.' };
  },
});
```

`before` receives a `PendingToolCall` — the `toolCallId`, the `commandId` and the assembled `args` —
and answers a `ToolDecision`:

| Decision | What happens |
| --- | --- |
| `{ decision: 'run' }` | The call goes to the workbench. This is what happens when you supply no hook at all. |
| `{ decision: 'decline', reason }` | The workbench is never asked. The agent is told the call did not run, and why. |
| `{ decision: 'answer', content }` | You serve the call yourself. The agent gets your content as the result. |

It may be asynchronous, which is what a confirmation needs.

**A decision can only narrow.** Letting a call through does not make it reachable: the workbench
refuses what it always refused, whatever was decided here. The hook is a place to say no, not a way to
say yes to something the user could not have done.

`CommandToolOptions` is the shape you pass; today it carries only `before`.

## What the agent gets back

The workbench answers one of three things, and all three cross faithfully, because the protocol has
one `error` field and its own reason for having it: without it, a tool that failed cannot be told from
one that succeeded.

| Outcome | Result |
| --- | --- |
| answered | The value as `content`. A command that declares no answer reports plainly that it ran, rather than returning an empty string an agent would read as a failure and retry. |
| refused | An empty `content` and an `error` saying the command **did not run**. |
| failed | An empty `content` and an `error` saying the command **ran and failed**. |

The wording keeps the distinction the workbench preserved, so an agent can tell "you may not" from "it
broke" and choose differently.

## What the agent never learns

The refusal wording is the same for every reason a command cannot be reached — no such command, not
`callable`, the session does not qualify, the wrong window, no grant. That is deliberate: telling them
apart would let an agent map what is installed by calling ids and reading the reason back.

## Streamed and chunked calls

A call arrives as a start, a stream of argument deltas, and an end. Calls in that form may interleave,
because every event carries its own `toolCallId`, and the adapter keeps them apart.

The convenience form, where one chunk event carries whichever of those fields it has, is inherently
sequential: a chunk naming a new call closes the one before it. Both forms end up in the same place.

Arguments that do not arrive as readable JSON are refused before the workbench is asked. Arguments
that read fine but do not match what the command declared are refused by the workbench, which is where
that check belongs.
