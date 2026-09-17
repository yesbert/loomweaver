## Context

See proposal.md, *Why*. What shapes the approach is where the knowledge sits today:

- `Command` carries `callable`, `description`, `arguments` and `answers` — everything an agent needs
  to choose a command — and nothing about what running it costs.
- The one seam for deciding about a call is `CommandToolOptions.before` in `@loomweaver/ag-ui`,
  answering `ToolDecision` (`run` / `decline` / `answer`). It works; what it decides *from* is left to
  the weaver.
- What the weaver is taught to decide from is a hard-coded set: `CONSEQUENTIAL` in the generated
  `agent-files.ts`, and `DESTRUCTIVE.has(call.commandId)` in the brief's AG-UI example.
- `CommandAccess` is deliberately `Pick<PluginContext, 'invocableCommands' | 'invokeCommand'>`, which
  states exactly what an agent reaches through the adapter.
- `Command.access` is already a statement rather than a guard: its own contract comment reads
  "Presentation only — real enforcement is server-side."

## Goals / Non-Goals

**Goals:**

- One optional property on a command, stating what an agent's word is enough for.
- It reaches a caller through the already-narrowed account (`InvocableCommand`) and reaches an agent
  host through the protocol's own place for a property of a tool.
- The seam that decides about a call is handed the statement, so no consumer writes a lookup.
- The generated agent connection stops carrying a list of command identities.

**Non-Goals:**

- Asking the person. No dialog, no default that asks, no wording, no remembered answer.
- Enforcement. Nothing is refused, narrowed or hidden on this account.
- Marking the elements the workbench draws for such a command, in the DOM or anywhere else.
- Telling an agent caller from any other foreign caller. The platform cannot, and does not try.

## Decisions

### The platform declares; the product runs the loop

Decided with Norbert, 2026-09-17. The four outcomes are a statement about the command, and everything
that turns a statement into a conversation with a person stays in the product.

Rejected: `commandTools` applying the statement by default, which the finding asked for. Two reasons,
both decisive. It would change behaviour under everyone who upgrades — a weaver that passes no
`before` hook today runs every call, and would suddenly show dialogs it never wrote. And asking means
reaching `ctx.ui.confirm`, which would widen `CommandAccess` past the two methods that are its whole
point: the narrow slice is what makes "this is what an agent reaches through here" a readable
sentence.

Consequence worth naming: LoomWeaver ships no asker at all, so a product that declares `ask` and
writes no `before` hook gets no asking. The declaration is inert until something reads it. That is the
intended shape, and the spec says so where it states the guarantee.

### Why the loop is not ours to hold, even partly

A default asker would have to decide wording, placement, whether an answer is remembered, for how
long and against which identity. Every one of those answers is a product's, and a workbench that
guessed them would be guessing in the one place where being wrong is expensive.

It also dissolves the question the finding left open. "Ask once" versus "ask every time" needs a
memory, and with the loop outside there is nothing for the platform to remember: the two are simply
two different statements about the command, and whoever asks decides what to do with them.

### `agentConsent?: 'allow' | 'ask' | 'ask-always' | 'never'`

Decided with Norbert, 2026-09-17, on `Command` and carried onto `InvocableCommand`.

The four values are NextPA's own, taken unchanged so that the same words stand on both sides and no
translation table exists to drift. They are also the vocabulary a reader already knows from browser
permission prompts.

Rejected: `'not-required' | 'once' | 'each-time' | 'never'`, proposed in this session and dropped.
`once` reads as "run it once" rather than "asking once is enough", which is worse than the word it
replaced.

The field name carries the weight. `allow` alone would collide with the vocabulary of `access`,
`plugin-permissions` and the capability grants, where "allowed" means the platform really withholds
something. Named `agentConsent`, the value reads as "consent is given in advance" rather than "the
platform permits it", which is the statement being made.

`never` is likewise a statement, not a gate: the platform cannot tell an agent from any other foreign
caller, so it can only say the thing. A command that must be out of reach is closed by leaving
`callable` off, which the platform does enforce. Both limits are stated in the `commands` delta beside
the guarantee, so a reader cannot take either for a guard.

### The statement rides in `Tool.metadata` under its own name

`toolFor(command)` writes `metadata: { agentConsent }` when the command states something, and writes
no `metadata` at all when it does not, so a tool for a command that says nothing is byte-identical to
what is produced today. Same name as the declaration, per *same names to declare, to switch and to
read*.

This is forwarding, not deciding: the statement travels with the tool to an agent host that may treat
a consequential tool differently, which is what `@ag-ui/core` gives `metadata` for.

### `PendingToolCall` carries the statement to the seam

`before` is handed `{ toolCallId, commandId, args }` and would otherwise have to look the command up
in `ctx.invocableCommands()` itself — the same three lines in every product, and the exact lookup the
scaffold would have to teach. It gains an optional `agentConsent`, resolved by the adapter from its
own already-narrowed list at the moment of the call, never from a list kept earlier.

Undefined means either "the command states nothing" or "no such command reachable". The second is the
workbench's refusal to make, not the hook's, and it makes it as it always has.

Rejected: handing the whole `InvocableCommand` to the hook. It would put a second account of a command
beside `list()` and invite a weaver to read `description` or `arguments` from a place that is not the
list it is told never to cache.

### The check reports, and never guesses

The agent report in `validate/commands.ts` gains the statement in the line it already writes per
command. It does not guess from an id or a title whether a command deletes something, which the
finding proposed: the guess is English-only, it is wrong often enough, and a false line in an
information report is how a consumer learns to skip the report. Absence is a legitimate declaration
and is reported as such, without a warning and without failing strict mode.

### The scaffold reads the command, not a list

`agent-files.ts` loses `CONSEQUENTIAL`. The generated command declares `agentConsent: 'ask'` on
itself, and the generated `decide` reads `call.agentConsent`, so the generated product demonstrates
the whole shape and carries no list to drift. The generated confirm dialog stays exactly where it is:
it is the product's half, and the scaffold is where a product's half is allowed to be written for it.

## Risks / Trade-offs

- **A declaration nothing reads is a false comfort.** A product may declare `ask-always` and ship no
  `before` hook, and nothing asks. → The spec states the non-enforcement where it states the
  guarantee, the contract comment on the property says it in the same breath, and the scaffold ships
  the reading hook so the demonstrated path is the complete one.
- **`never` invites being read as a gate.** → Stated as a statement in the spec and in the JSDoc,
  each naming `callable` as the thing that actually closes a command.
- **A fifth value later.** The four are a closed union, so widening it is additive for a consumer and
  a compile error for us, which is the right way round. Nothing here depends on the set being four.
- **The sandbox rung.** `invocableCommands` crosses the plugin boundary as plain data; a string field
  survives it. Worth one test rather than an assumption, and the tasks carry it.
