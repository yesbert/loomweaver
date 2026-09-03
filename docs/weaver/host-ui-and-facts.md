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

`message` fields are Markdown.

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

// Right-click a row in your OWN view body → a host-styled context menu at the cursor. Each item runs
// in-process; labels are literals (you localise them). The host draws the same <lw-menu> popover as its
// own menus (positioning, Escape/outside-click dismiss, focus) — it is body-level, so never clipped by a
// virtual-scroll/transform ancestor. In-process (trusted) only: the `run` functions do not cross the
// sandbox boundary, so a sandboxed plugin self-draws a <lw-menu> instead.
onRowContextMenu(event: MouseEvent, note: Note) {
  event.preventDefault();
  ctx.ui.openMenu(
    [
      { label: 'Open', icon: 'document', run: () => this.open(note) },
      { label: 'Delete', icon: 'trash', run: () => store.remove(note.id) },
    ],
    { x: event.clientX, y: event.clientY },
  );
}
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

- [Menus](menus.md): the menus the host draws in its own chrome, and the one you draw in a sandbox.
- [Settings sections](settings.md): the surface `ctx.ui.openSettings()` opens, and what you contribute to it.
- [Access gating in a weaver](access-gating.md): a login dialog opened through `ctx.ui.open`.
