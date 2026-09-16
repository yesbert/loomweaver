# Dialogs and toasts

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `ui-primitives` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Six calls open a dialog: `confirm`, `alert`, `prompt`, `open`, `progress` and `withProgress`. The
first three are the lanes `ctx.ui` exposes to a plugin; `open` takes your own component as the
body; the last two show a busy indicator. `message` is Markdown; `tone` colours the icon and the
confirming button.

## Do it

```ts
const dialogs = inject(DialogService);

if (await dialogs.confirm({ title: 'account.close', message: 'This **cannot** be undone.', tone: 'danger' })) {
  // …
}
await dialogs.alert({ message: 'Signed out.', tone: 'success' });
const name = await dialogs.prompt({ message: 'Workspace name?' });   // string | null

const ref = dialogs.open(MyLoginDialog, { size: 'md', title: 'auth.signIn' });
const result = await ref.closed;

await dialogs.withProgress({ message: 'Migrating…' }, migrateEverything());
const busy = dialogs.progress({ message: 'Indexing…' }); busy.update('Almost done'); busy.close();
```

```ts
const toasts = inject(NotificationService);

const id = toasts.show({ message: 'settings.saved', kind: 'success', timeoutMs: 4000 });
toasts.dismiss(id);
```

## Read it

The open dialogs are `dialogs.dialogs()`, oldest first; the last one is topmost. Each is a `DialogInstance` whose `kind` is a `DialogKind`, one of confirm, alert, prompt, custom and progress, and whose buttons are `DialogButtonView`s with a `ButtonRole` of confirm, cancel or custom, which is what a custom outlet reads to draw them. What is on screen right now is `toasts.notifications()`. Opening your own component returns a [`DialogRef`](../weaver/host-ui-and-facts.md): `closed` is a promise of the result, `close(result)` settles it, and `maximized` with `toggleMaximized()` serve dialogs opened with `maximizable: true`.

## What asks about unsaved work

Nothing on this page asks: a dialog or a toast closes no surface. The unsaved-work question is itself a dialog the shell opens through this service.

## Switched off

No switch governs dialogs or toasts.

## In depth

**Shared options.** `confirm`, `alert` and `prompt` share `title?`, `message` (Markdown), `tone?` and
`icon?`, plus their own labels. `confirm` additionally takes `requireConfirmation`, a typed guard for
a destructive action. Its `validate` returns `null` to allow and a string to block: a non-empty
string is shown as the reason, an empty one blocks silently.

**Progress.** `progress()` returns a handle you close yourself; `withProgress()` ties the dialog to a
promise and is what you want almost always.

**Your own component as the body.** `OpenOptions`:

| Option                  | Effect                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `title`, `icon`, `tone` | the host-drawn frame around your component                                                       |
| `data`                  | passed to your component through the `DialogRef`                                                 |
| `buttons`               | host-drawn footer buttons; each `{ label, variant?, value? }` resolves `closed` with its `value` |
| `size`                  | `md` (default), `lg`, `xl`                                                                       |
| `dismiss`               | which of the user's ways close it: `any` (default), `explicit` or `none`; see below              |
| `maximizable`           | the frame offers a maximize/restore control                                                      |
| `bare`                  | render only your component — no frame, no padding, no footer; you own the chrome                 |
| `align`                 | `center` (default) or `top`, which pins the panel near the top on every width                    |

**How the user may close it.** `dismiss` governs the user only; your component and your own code
can always call `DialogRef.close`, and declared `buttons` work whatever you choose.

| Value      | Backdrop click | Escape, close control | Close control drawn |
| ---------- | -------------- | --------------------- | ------------------- |
| `any`      | closes         | close                 | yes                 |
| `explicit` | does nothing   | close                 | yes                 |
| `none`     | does nothing   | do nothing            | no                  |

`dismissable` is gone. Replace `dismissable: true` by nothing and `dismissable: false` by
`dismiss: 'none'`.

**Keeping unsaved edits.** Three kinds of dialog edit something, and each needs something different:

- _A form with its own Save and Cancel._ Open it with `dismiss: 'explicit'`. A stray click beside it
  does nothing, while Escape and the close control read as cancel, as your Cancel button does.
- _A dialog that asks on closing,_ with no Save button of its own. Implement `DirtySurface` on the
  component, the same interface a tab's content implements. While `surfaceDirty()` returns `true`,
  every way of closing the user is allowed asks _Save · Discard · Cancel_, with Save offered only
  when you implement `surfaceSave`. A `surfaceBeforeClose` veto runs first, with the same timeout
  a tab gets. A declared button without a `value` counts as a cancel and asks too; one with a
  `value`, and `DialogRef.close`, never ask.
- _A dialog whose changes apply as they are made,_ such as the settings. Nothing is ever unsaved, so
  implement nothing and keep the default. If a write may still be in flight when the user closes it,
  report dirty until the write has succeeded, and the dialog asks rather than losing it.

```ts
const name = await this.dialogs.open<string>(EditNameForm, {
  title: 'Edit name',
  dismiss: 'explicit',
}).closed;
```

**When the frame does not fit.** `bare` and `align: 'top'` exist for the two cases the standard frame
does not fit. One is a surface that draws its own two-column chrome, such as the settings dialog.
The other is a panel whose height follows a filtering list, such as the command palette; centred, it
would jump around as results change.

**Toasts.** `kind` is `info | success | warning | error`. **Omitting `timeoutMs` makes the toast
sticky**: it stays until the user dismisses it, which is right for "an update is waiting" and wrong
for almost everything else. A single `action` adds a button. Passing the same `id` twice replaces
the toast instead of stacking a second one.

## Where the story is told

- [Host UI in a weaver](../weaver/host-ui-and-facts.md): the same three lanes through `ctx.ui`.
- [Asking before doing something destructive](../samples.md#asking-before-doing-something-destructive): a complete recipe.
