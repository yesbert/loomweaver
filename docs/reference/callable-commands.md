# Callable commands — letting something other than the user run an action

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `commands`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A `Command` is the workbench's one anchor for an action: a rail item, a keystroke and a palette entry
all point at the same `id`, and one seam decides whether it may run. This page is about opening that
same anchor to a caller that is **not** the user, without building a second list of actions beside
the first. Such a caller is an assistant driving the application, a script, or a second plugin.

The rule underneath everything here: **a caller can never reach an action the user could not have
triggered themselves.** Opening a command widens what may trigger it, never what it is allowed to do.

Read [the plugin system](../plugins.md) first for the default-deny capability model; this page
assumes it.

## The four things a command declares

```ts
ctx.registerCommand({
  id: 'notes.open',
  title: 'notes.open',                       // labels a control
  description: 'notes.open.description',     // explains the action to something choosing one
  arguments: [
    { name: 'path', kind: 'text', description: 'notes.open.arg.path', required: true },
    { name: 'mode', kind: 'choice', choices: ['preview', 'permanent'],
      description: 'notes.open.arg.mode' },
  ],
  answers: 'notes.open.answers',             // what the return value means
  callable: true,                            // other plugins may run it
  run: (_context, args) => store.open(String(args?.['path'])),
});
```

**`description`** is not the title. A title is read beside an icon by somebody who can already see
where they are; a description is read by something deciding between actions it has never seen. A
command with no description keeps none: the title is never substituted, because a label is not an
explanation. Both take a Transloco key or a literal, and the workbench resolves them to the active
language before handing them to a caller.

**`arguments`** are checked before `run` is reached. A missing required argument, a value of the
wrong kind or a choice outside the declared set is refused and the command does not run. Four kinds
exist: `text`, `number`, `boolean` and `choice`, plus `list: true` for a list of any of them. The
set is closed on purpose: a caller has to describe your command to something that has never seen it,
and a closed set turns a wrong declaration into a compile error rather than a silent no-op.

> The check is for **discovery, not safety**. Validate your own inputs exactly as you would without
> it.

**`answers`** is what makes `run`'s return value the invocation's answer. Without it an invocation
succeeds carrying nothing, whatever `run` happened to return. The value must be plain data: strings,
numbers, booleans, `null`, arrays and plain objects. It crosses the same boundary the arguments came
from. A command that declares `answers` and returns something else answers with a
failure rather than with a value that lost what it was.

**`callable`** opens the command to a caller other than the plugin that registered it. Leave it off
and it cannot be reached that way by any route, and it is absent from everything that lists what such
a caller may run.

## Why the default is closed

The same reason `popout` is: a command _missing_ from what an automated caller can reach is a small
annoyance, while one that does something surprising because something other than the user triggered
it is the larger failure, and the shell cannot tell the two apart for a command it did not write.

So every command you want reachable says so, once. In dev mode the shell tells you when you opened a
command but gave it no description, because the caller you opened it to then has nothing to go on but
an id.

## Calling one

```ts
// What may I run?
const actions = ctx.invocableCommands();
// [{ id, title, description?, arguments?, answers? }, …] — ordered by id, texts already translated

// Run one.
const outcome = await ctx.invokeCommand('notes.open', { path: 'inbox/today' });
switch (outcome.outcome) {
  case 'answered': use(outcome.value); break;
  case 'refused':  offerSomethingElse(outcome.reason); break;
  case 'failed':   reportToTheUser(outcome.message); break;
}
```

`invokeCommand` **answers a refusal instead of throwing one**, unlike every other `ctx` member. A
caller working through a list of actions has to handle "you may not" as an outcome rather than as an
exception. The user is still told, exactly as they are for every other refused route.

The three outcomes are distinct because they mean different things, and none may be presented as
another: _answered_ is a result, _refused_ means the command never ran, _failed_ means it ran and
broke.

### Read the list, do not keep one

`invocableCommands()` is the workbench's own account, already narrowed by everything that would
refuse the invocation:

- the command declared itself `callable`,
- the session meets its `access`,
- it belongs in the window you are in (a pop-out offers only commands that declare `popout`),
- and, for a command you did not register, your plugin holds the `automation` capability.

Everything in that list runs when invoked, and anything that would be refused is absent from it. Keep
a second list of your own and you have a second answer to "may this run", and it will not be the one
the user can see and withdraw.

## The `automation` capability

Reaching a command **another** plugin registered needs the `automation` grant. Without it, invoking
one is refused and `invocableCommands()` holds nothing beyond your own. A refusal must not become a
way of discovering what is installed, so an unknown id and a command you may not reach are refused
identically.

Your own commands need no grant, and no `callable` declaration, to invoke: that is your own
behaviour and you could call the function directly. They appear in `invocableCommands()` only where
you opened them, so nothing you never opened is offered onward.

The grant is listed in the built-in **Permissions** settings and the user can withdraw it at any
time; the next call is refused and the list empties, without a reload.

## Refusal reasons

| Reason              | What happened                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unavailable`       | No such command, or not `callable`, or the session does not qualify, or the window does not host it, or the grant is missing. Deliberately one answer for all of them. |
| `invalid-arguments` | The call did not match what the command declares.                                                                                                                      |
| `too-deep`          | Commands invoked each other past the workbench's nesting limit — a loop rather than a chain.                                                                           |

## The types, and where each is used

Everything below is exported from `@loomweaver/plugin-sdk`.

| Type                   | What it is                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommandArgument`      | one declared argument: `SimpleCommandArgument` for `text`/`number`/`boolean`, `ChoiceCommandArgument` for a value out of a fixed `choices` list. Both extend `CommandArgumentBase`, which carries the `name`, the `description`, `required` and `list`. |
| `CommandScalar`        | a single value an argument or an answer may carry: a string, a number or a boolean.                                                                                                                                                                     |
| `CommandArgumentValue` | what one argument may be given — a `CommandScalar`, or a list of them where the declaration says `list: true`.                                                                                                                                          |
| `CommandArguments`     | the whole call: argument names to `CommandArgumentValue`.                                                                                                                                                                                               |
| `CommandAnswer`        | what a command may answer with — scalars, `null`, arrays and plain objects, nested.                                                                                                                                                                     |
| `CommandOutcome`       | the union an invocation answers with: `CommandAnswered`, `CommandRefused` or `CommandFailed`. Switch on `outcome`.                                                                                                                                      |
| `CommandRefusalReason` | why a refusal happened — `unavailable`, `invalid-arguments` or `too-deep`. See the table above.                                                                                                                                                         |
| `InvocableCommand`     | one entry of `ctx.invocableCommands()`: id, title, and the optional description, arguments and `answers`, every text already translated.                                                                                                                |

## Across the sandbox boundary

A sandboxed plugin invokes and lists exactly as an in-process one does, and gets the same outcome for
the same call. Arguments and answers are constrained to data on both rungs, so a value that could not
arrive as the value it was is refused rather than arriving stripped.

A sandboxed plugin still cannot _register_ a command, because a behaviour is a function and functions
do not cross the boundary. It contributes a menu item naming a command by id instead.

## Handing the list to an agent

Where the caller is an agentic backend speaking AG-UI, the dispatch is not yours to write:
`@loomweaver/ag-ui` describes these commands to the agent as tools, assembles a streamed call, and puts
it through this same seam, with a hook where a product confirms or declines one before it runs.
Nothing on this page is bypassed by it: a decision there can only narrow what the workbench would
already have allowed. See [driving your product with an AG-UI agent](../ag-ui-agents.md) for the
path end to end, and [agent tools](agent-tools.md) for the adapter itself.
