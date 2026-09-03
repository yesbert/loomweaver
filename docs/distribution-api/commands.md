# Commands

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `commands` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

One behaviour, many triggers. Anything a rail item, menu entry, keybinding or the palette can run,
your code can run too, through the same access check. A command your session may not use stays
unavailable everywhere at once.

## Do it

```ts
// src/app/… — inside an injection context
const commands = inject(CommandService);

commands.execute('shell.openSettings');
commands.execute('shell.tab.close', { tabId: 'doc/readme', closable: true });   // with a menu context

await commands.run(someCommand);           // fire a resolved command and get what it answered
```

## Read it

```ts
commands.commands();                       // every registered command (signal)
commands.available(someCommand);           // does the current session satisfy its `access`?
commands.shortcutOf(someCommand);          // '⌘K' | 'Ctrl+K' | undefined
```

The list of every registered command is `commands()`, the source list for a palette. Whether a command can run here and now is `available(command)`: the session meets its `access`, and this window is one the command belongs in. The chord formatted for display is `shortcutOf(command)`; it is `undefined` where there is none or shortcuts are switched off.

## What asks about unsaved work

A command asks whatever its behaviour asks. `execute('shell.tab.close', …)` asks exactly as the × does, because it runs the same code; `execute` itself adds no question.

## Switched off

`commands.shortcuts` takes the global key listener and every chord hint away from the user; `execute` and `run` keep working for you, and `shortcutOf` answers `undefined` so a hint never promises a dead key. `commands.recentlyUsed` governs only the palette's section.

## In depth

**Fire or await.** `execute` fires and forgets. `run` is the same one place the behaviour happens,
but it answers what the command returned and rejects with what it threw, for a caller that has to
tell the two apart. A plugin reaches the same thing through `ctx.invokeCommand`; see
[callable commands](../reference/callable-commands.md).

**No-ops that protect your chrome.** `execute` on an unknown id is a no-op with a console warning.
On a command the session may not run it is a no-op too. So a command a plugin removed, or one the
current user has no right to, cannot break your chrome.

**The invoker seam.** A plugin does not call `CommandService`. It calls through `CommandInvoker`, a
seam with a name of its own. The seam is bound to the `COMMAND_INVOKER` token and implemented by
`CommandInvocationService`. `provideShell()` binds it. An injector without the shell composed gets an
invoker that reaches nothing and says so. You meet the seam only where you compose plugin runtimes
yourself, and a distribution does that through `provideShell()` anyway.

**Keybindings.** `KeybindingService` binds every command's `shortcut` globally; `provideShell()`
starts it, and there is nothing to call yourself.

**Rendering a chord.** To show a shortcut in your own UI, use `formatChord('mod+k')`, exported from
`@loomweaver/shell`. It returns ⌘K on macOS and Ctrl+K elsewhere, using the same platform detection
as the shell, so your hint can never disagree with the binding.

## Where the story is told

- [Callable commands](../reference/callable-commands.md): opening a command to a caller that is not the user.
- [Command palette entry](../distribution/recomposing-chrome.md#command-palette-entry): the built badges for the palette and quick-open.
- [One behaviour, many triggers](../samples.md#3--one-behaviour-many-triggers): a complete recipe.
