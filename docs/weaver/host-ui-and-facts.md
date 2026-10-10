# Host UI and host facts

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `ui-primitives` · `product-identity`. Where this page and a specification disagree, the
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
const id = ctx.ui.toast({ message: 'notes.saved', kind: 'success' });   // leaves by itself
await ctx.ui.withProgress({ message: 'Importing…' }, importAll());  // non-dismissable progress
ctx.ui.openSettings();                                              // open the settings surface

// Open your own component as a dialog body (the host paints the frame):
ctx.ui.open(NotesAboutDialog, { data: ctx.host, size: 'md' });
// dismiss: 'any' (default), 'explicit' (a click beside it does nothing) or 'none'.
ctx.ui.open(RenameNoteForm, { title: 'Rename', dismiss: 'explicit' });
// Inside the body: inject(DialogRef).close(result) closes without asking; requestClose() makes the
// close-control close (asks about unsaved work) and resolves whether the dialog closed.

// Right-click a row in your OWN view body: a host-drawn context menu at the cursor (trusted rung only).
// The handler gets the MouseEvent and the row; what the items may carry is on Menus.
const onContextMenu = (event: MouseEvent, note: Note) =>
  ctx.ui.openMenu([{ label: 'notes.menu.open', icon: 'document', run: () => openNote(note) }], { x: event.clientX, y: event.clientY });
```

**How long a toast stays.** Without `timeoutMs` the kind decides: `info`, `success` and `warning`
leave by themselves, and `error` stays until the user dismisses it. To keep a toast of another kind,
state `timeoutMs: 0`. A toast that offers an `action` should state its lifetime, because the action
leaves with it. `icon` shows another icon than the kind's; the colour stays the kind's.

```ts
ctx.ui.toast({ message: 'notes.importFailed', kind: 'error' });                 // stays
ctx.ui.toast({ message: 'notes.offline', kind: 'warning', timeoutMs: 0 });      // stays, stated
ctx.ui.toast({ message: 'notes.pinned', kind: 'success', icon: 'pin' });        // own icon
ctx.ui.toast({ id: 'sync', message: 'notes.syncing' });                         // an id: replaced in place
```

Raising the same toast again while the first is still there adds no second card: the first shows how
often it was raised. A toast with an `id` is replaced instead and never counted. Where toasts
appear, and that no more than three are shown at once, is the product's and the workbench's
business and not a plugin's; [Dialogs and toasts](../distribution-api/dialogs-and-toasts.md) has the
whole story.

## Host facts — `ctx.host`

Read-only version + update state, so an About surface stays SDK-only. `version`/`updateAvailable`
are signal-shaped (`() => T`). Read them in a template and they stay reactive.

```ts
ctx.host.version();          // "1.2.3"
ctx.host.updatesEnabled;     // is a service worker registered?
if (ctx.host.updateAvailable()) await ctx.host.activateUpdate();
```

## Where next

- [Menus](menus.md): host menus, the menu on your own view body, and the one you draw in a sandbox.
- [Settings sections](settings.md): the surface `ctx.ui.openSettings()` opens, and what you contribute to it.
- [Access gating in a weaver](access-gating.md): a login dialog opened through `ctx.ui.open`.
- [Unsaved changes](unsaved-changes.md): a dialog body that asks before its edits are lost.
