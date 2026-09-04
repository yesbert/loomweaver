# Host UI and host facts

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `ui-primitives` · `product-identity`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page is the host UI a weaver reaches through `ctx.ui`: dialogs, toasts, progress and a menu on
your own view body, all brokered so you never import host services directly. It closes with
`ctx.host`, the read-only facts about the running product that an About surface needs.

## Dialogs, toasts and menus: `ctx.ui`

`message` fields are Markdown. `openMenu` is here for completeness; what its items may carry and
where it is allowed is on [Menus](menus.md#a-menu-on-your-own-view-body).

```ts
// Confirm, with a type-to-confirm guard for a destructive action:
const ok = await ctx.ui.confirm({
  title: 'notes.reset',
  message: '**All notes** will be removed. This cannot be undone.',
  tone: 'danger',
  requireConfirmation: {
    label: 'Type **Reset** to confirm',
    validate: (v) => (v === 'Reset' ? null : ''),   // null = allow, '' = block silently
  },
});
if (ok) store.reset();

await ctx.ui.alert({ message: 'Saved.', tone: 'success' });
const name = await ctx.ui.prompt({ message: 'New note title?' });   // string | null
const id = ctx.ui.toast({ message: 'notes.saved', kind: 'success', timeoutMs: 3000 });
await ctx.ui.withProgress({ message: 'Importing…' }, importAll());  // non-dismissable progress
ctx.ui.openSettings();                                              // open the settings surface

// Open your own component as a dialog body (the host paints the frame):
ctx.ui.open(NotesAboutDialog, { data: ctx.host, size: 'md' });

// Right-click a row in your OWN view body: a host-drawn context menu at the cursor (trusted rung only).
// The handler gets the MouseEvent and the row; what the items may carry is on Menus.
const onContextMenu = (event: MouseEvent, note: Note) =>
  ctx.ui.openMenu([{ label: 'Open', icon: 'document', run: () => openNote(note) }], { x: event.clientX, y: event.clientY });
```

## Host facts — `ctx.host`

Read-only version + update state, so an About surface stays SDK-only. `version`/`updateAvailable`
are signal-shaped (`() => T`) — read them in a template and they stay reactive.

```ts
ctx.host.version();          // "1.2.3"
ctx.host.updatesEnabled;     // is a service worker registered?
if (ctx.host.updateAvailable()) await ctx.host.activateUpdate();
```

## Where next

- [Menus](menus.md): host menus, the menu on your own view body, and the one you draw in a sandbox.
- [Settings sections](settings.md): the surface `ctx.ui.openSettings()` opens, and what you contribute to it.
- [Access gating in a weaver](access-gating.md): a login dialog opened through `ctx.ui.open`.
