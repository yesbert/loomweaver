# Dialogs and toasts

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `ui-primitives` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The same three lanes `ctx.ui` exposes, plus the raw `open`. `message` is Markdown; `tone` colours the
icon and the confirming button.

This first example is complete — a component injects the service as a field and calls it from an
`async` method. **Every later snippet on this page follows the same shape** (a field-level
`inject(...)` plus a method body) and shows only the body:

## Do it

```ts
// src/app/inspector.ts — an application component (not a plugin)
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogService } from '@loomweaver/shell';

@Component({
  selector: 'app-danger-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" class="lw-btn lw-btn--danger" (click)="closeAccount()">Close account</button>`,
})
export class DangerZone {
  private readonly dialogs = inject(DialogService);

  protected async closeAccount(): Promise<void> {
    if (await this.dialogs.confirm({ title: 'account.close', message: 'This **cannot** be undone.', tone: 'danger' })) {
      // …
    }
  }
}
```

## In depth

```ts
// more of the same service, inside such a method:
await dialogs.alert({ message: 'Signed out.', tone: 'success' });
const name = await dialogs.prompt({ message: 'Workspace name?' });   // string | null

const ref = dialogs.open(MyLoginDialog, { size: 'md', title: 'auth.signIn' });
const result = await ref.closed;

await dialogs.withProgress({ message: 'Migrating…' }, migrateEverything());
```

`open()` returns a [`DialogRef`](../../weaver/host-ui-and-facts.md): `closed` (a promise of the
result), `close(result)`, and `maximized`/`toggleMaximized()` for dialogs opened with
`maximizable: true`. `progress()` returns a handle you close yourself; `withProgress()` ties the
dialog to a promise and is what you want almost always.

`confirm`, `alert` and `prompt` share `title?`, `message` (Markdown), `tone?` and `icon?`, plus their
own labels. `confirm` additionally takes `requireConfirmation` — a typed guard for a destructive
action, whose `validate` returns `null` to allow and a string to block (a non-empty string is shown
as the reason, an empty one blocks silently).

`OpenOptions`, for a dialog with your own component as the body:

| Option | Effect |
| --- | --- |
| `title`, `icon`, `tone` | the host-drawn frame around your component |
| `data` | passed to your component through the `DialogRef` |
| `buttons` | host-drawn footer buttons; each `{ label, variant?, value? }` resolves `closed` with its `value` |
| `size` | `md` (default), `lg`, `xl` |
| `dismissable` | backdrop click and Escape close the dialog; default `true` |
| `maximizable` | the frame offers a maximize/restore control |
| `bare` | render only your component — no frame, no padding, no footer; you own the chrome |
| `align` | `center` (default) or `top`, which pins the panel near the top on every width |

`bare` and `align: 'top'` exist for the two cases the standard frame does not fit: a surface that
draws its own two-column chrome (the settings dialog), and a panel whose height follows a filtering
list (the command palette), which would otherwise jump around the centre as results change.

## Toasts

```ts
const toasts = inject(NotificationService);

const id = toasts.show({ message: 'settings.saved', kind: 'success', timeoutMs: 4000 });
toasts.dismiss(id);
```

`kind` is `info | success | warning | error`. **Omitting `timeoutMs` makes the toast sticky** — it
stays until the user dismisses it, which is right for "an update is waiting" and wrong for almost
everything else. A single `action` adds a button, passing the same `id` twice replaces the toast
instead of stacking a second one, and `notifications` is a signal of what is currently on screen.

## Where the story is told

- [Host UI in a weaver](../../weaver/host-ui-and-facts.md): the same three lanes through `ctx.ui`.
- [Asking before doing something destructive](../../samples.md#6--asking-before-doing-something-destructive): a complete recipe.
