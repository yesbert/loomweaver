# Commands

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `commands` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

One behaviour, many triggers. Anything a rail item, menu entry, keybinding or the palette can run,
your code can run too — and through the same access check, so a command your session may not use
stays unavailable everywhere at once.

## Do it

```ts
// src/app/… — inside an injection context
const commands = inject(CommandService);

commands.execute('shell.openSettings');
commands.execute('shell.tab.close', { tabId: 'doc/readme', closable: true });   // with a menu context

commands.commands();                       // every registered command (signal)
commands.available(someCommand);           // does the current session satisfy its `access`?

await commands.run(someCommand);           // fire a resolved command and get what it answered
```

## Switched off

`commands.shortcuts` takes the global key listener and every chord hint away from the user; `execute` and `run` keep working for you. `commands.recentlyUsed` governs only the palette's section.

## In depth

`execute` fires and forgets; `run` is the same one place the behaviour happens, but it answers what
the command returned and rejects with what it threw, for a caller that has to tell the two apart. A
plugin reaches the same thing through `ctx.invokeCommand` — see
[callable commands](../callable-commands.md).

The seam a plugin reaches through has a name of its own: `CommandInvoker`, bound to the
`COMMAND_INVOKER` token and implemented by `CommandInvocationService`. `provideShell()` binds it, and
an injector without the shell composed gets one that reaches nothing and says so. You need it only
where you compose plugin runtimes yourself, which a distribution does through `provideShell()`
anyway.

`execute` on an unknown id is a no-op with a console warning, and on a command the session may not
run it is a no-op too — so a command a plugin removed, or one the current user has no right to,
cannot break your chrome. `KeybindingService` is what binds every command's `shortcut` globally;
`provideShell()` starts it, and there is nothing to call yourself.

To render a shortcut in your own UI, use `formatChord('mod+k')` (exported from `@loomweaver/shell`) — it
returns ⌘K on macOS and Ctrl+K elsewhere, using the same platform detection as the shell, so your
hint can never disagree with the binding.

## Where the story is told

- [Callable commands](../callable-commands.md): opening a command to a caller that is not the user.
- [Command palette entry](../../building-a-distribution.md#command-palette-entry): the built badges for the palette and quick-open.
- [One behaviour, many triggers](../../samples.md#3--one-behaviour-many-triggers): a complete recipe.
