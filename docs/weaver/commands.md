# Commands and their triggers

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `commands` · `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A `Command` is the named action that rail items, bar buttons, view actions, keybindings and the
command palette all point at by `id`. Register the behaviour once; reference it everywhere.

```ts
ctx.registerCommand({
  id: 'notes.add',
  title: 'notes.add',
  icon: 'add',
  shortcut: 'mod+enter',        // chord: mod = ⌘ on macOS, Ctrl elsewhere
  run: () => store.add(),
});
```

Now any item can trigger it with `command: 'notes.add'` instead of its own `run()` — and the palette
(`mod+k`) and the shortcut reach the same behaviour.

A command can also take **described arguments**, **answer with a result**, and be **opened to a caller
that is not the user**: another plugin, a script, an assistant driving the app. Then nobody has to
build a second list of your actions beside this one. It is closed to such callers until it says
otherwise. See [callable commands](../reference/callable-commands.md), and, where that caller is an
AG-UI agent, [agent tools](../reference/agent-tools.md) for the adapter that describes your commands to
it and runs what it asks for, so you write no dispatch of your own.

## Rail & bar items — command triggers in the chrome

The **rail** holds independent command triggers (the workbench labels it *Activity bar* in its own
menus); a **bar** (top/status) holds components or declarative buttons.

```ts
// Rail item → triggers a command. Pin settings to the bottom.
ctx.registerRailItem({ id: 'notes.settings', rail: 'primary', icon: 'settings',
  title: 'notes.settings', anchor: 'bottom', run: () => ctx.ui.openSettings() });

// Declarative status-bar button — the host paints button + tooltip from data (no component).
// `showShortcut: true` renders the bound command's shortcut hint (OS-correct, ⌘↵ / Ctrl+Enter) —
// only when the command declares a `shortcut`.
ctx.registerBarItem({ id: 'notes.add.btn', bar: 'status-bar', slot: 'start', order: 1,
  icon: 'add', tooltip: 'notes.add', command: 'notes.add', showShortcut: true });

// Or a component-backed bar item, for full control of the cell (e.g. a live count).
ctx.registerBarItem({ id: 'notes.count', bar: 'status-bar', slot: 'start', component: NotesCount });
```

Bar slots are `start | center | end`; rail items anchor `top` (default) or `bottom`.

## Where next

- [Menus](menus.md): a menu entry names a command by id, and a rail or bar item can carry a menu.
- [Callable commands](../reference/callable-commands.md): arguments, answers and opening a command to a caller that is not the user.
- [Access gating in a weaver](access-gating.md): a command blocked at its one `execute()` seam until the session qualifies.
