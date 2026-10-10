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

const id = toasts.show({ message: 'settings.saved', kind: 'success' });   // leaves by itself
toasts.show({ message: 'import.failed', kind: 'error' });                 // stays until dismissed
toasts.show({ message: 'sync.paused', icon: 'lock', timeoutMs: 0 });      // own icon, and stays
toasts.dismiss(id);
```

```ts
provideShell({ toastPosition: 'top-center' });   // where toasts appear; bottom right by default
```

## Read it

The open dialogs are `dialogs.dialogs()`, oldest first; the last one is topmost. Each is a `DialogInstance` whose `kind` is a `DialogKind`, one of confirm, alert, prompt, custom and progress, and whose buttons are `DialogButtonView`s with a `ButtonRole` of confirm, cancel or custom, which is what a custom outlet reads to draw them. The toasts to show right now are `toasts.notifications()`, oldest first and never more than three. Each is a `Notification` with its `id`, `kind`, `message`, the `icon` its raiser named, the `count` of how often it was raised, and its `action`. Opening your own component returns a [`DialogRef`](../weaver/host-ui-and-facts.md): `closed` is a promise of the result, `close(result)` settles it, and `maximized` with `toggleMaximized()` serve dialogs opened with `maximizable: true`.

## What asks about unsaved work

Nothing on this page asks: a dialog or a toast closes no surface. The unsaved-work question is itself a dialog the shell opens through this service.

## Switched off

No switch governs dialogs or toasts. Two composition options govern toasts: `toastPosition` places
them, and `drawToasts: false` leaves the drawing to you; both are described below. Dialogs have no
such option.

## In depth

**Shared options.** `confirm`, `alert` and `prompt` share `title?`, `message` (Markdown), `tone?` and
`icon?`, plus their own labels. `confirm` additionally takes `requireConfirmation`, a typed guard for
a destructive action. Its `validate` returns `null` to allow and a string to block: a non-empty
string is shown as the reason, an empty one blocks silently. The field is named by the guard's
`label`, and a reason is announced as its description, so the label is what a screen reader reads
out for the field. In `prompt` the `message` names the field.

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

An Escape pressed in an open `<lw-select>` or `<lw-menu>` inside the dialog closes that list only;
the next Escape closes the dialog. A popup your component draws itself gets the same by calling
`preventDefault()` on the Escape it handles. When the dialog closes, by any way, the focus goes back
to the control that opened it.

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

**Toasts.** `kind` is `info | success | warning | error`. It decides the colour of the card, the
icon and how urgently the toast is announced. `icon` names another icon from the registry; the
colour and the urgency stay the kind's. A single `action` adds a button.

**How long a toast is shown.** `timeoutMs` counts from the moment the toast is shown. Without it the
kind decides:

| Kind              | Without `timeoutMs`    |
| ----------------- | ---------------------- |
| `info`, `success` | leaves after 5 seconds |
| `warning`         | leaves after 8 seconds |
| `error`           | stays until dismissed  |

`timeoutMs: 0` keeps a toast of any kind until the user dismisses it, which is right for "an update
is waiting" and wrong for almost everything else. A toast that offers an `action` should state its
lifetime rather than rely on the kind, because the action leaves with it.

**A toast the user is attending to does not leave.** Once the pointer moves on a toast, and while
keyboard focus is in one, no toast leaves by itself. Afterwards each one runs what was left of its
lifetime, and at least a second. A toast that appears under a pointer that is not moving is not
held, so one that covers the button you just clicked still leaves.

**Three at once.** No more than three toasts are shown. A further one waits its turn, and its
lifetime starts when it is shown, so waiting costs it nothing.

**The same toast again is counted.** Raising a toast with the kind, message, icon and action label
of one that is still there adds no second card. The first shows how often it was raised, and its
lifetime starts over. A toast with an `id` is never counted: passing the same `id` twice replaces
the toast, which is how you update one in place.

**Where toasts appear.** `provideShell({ toastPosition })` takes `top-left`, `top-center`,
`top-right`, `bottom-left`, `bottom-center` or `bottom-right`, the default. The newest toast sits
nearest that edge. On a narrow viewport, the one at which the side panels become overlays, toasts
are centred at the chosen edge. A toast cannot place itself.

**The colours** are the feedback tokens `info`, `positive`, `caution` and `negative`. Retint them
and the toasts follow, like every other piece of feedback.

## Drawing toasts yourself

`provideShell({ drawToasts: false })` mounts no toast outlet. You draw `toasts.notifications()` in a
component of your own, with any look or any library you like. Only the drawing moves: which toasts
are to be shown, when one leaves, the limit of three and the counting are decided by the service,
so your component reads a list that is already right.

```ts
// main.ts
provideShell({ drawToasts: false });
```

```ts
// my-toasts.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Notification, NotificationService } from '@loomweaver/shell';

@Component({
  selector: 'app-toasts',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './my-toasts.html',
})
export class MyToasts {
  protected readonly toasts = inject(NotificationService);

  protected role(toast: Notification): 'alert' | 'status' {
    return toast.kind === 'error' || toast.kind === 'warning' ? 'alert' : 'status';
  }

  protected run(toast: Notification): void {
    toast.action?.run();
    this.toasts.dismiss(toast.id);
  }
}
```

```html
<!-- my-toasts.html -->
<section
  aria-label="Notifications"
  (pointermove)="toasts.hold()"
  (pointerleave)="toasts.release()"
  (focusin)="toasts.hold()"
  (focusout)="toasts.release()"
>
  @for (toast of toasts.notifications(); track toast.id) {
    <div [attr.role]="role(toast)" [class]="'my-toast my-toast--' + toast.kind">
      <lw-icon [name]="toast.icon ?? toast.kind" />
      <span>{{ toast.message | transloco }}</span>
      @if (toast.count > 1) {
        <span>×{{ toast.count }}</span>
      }
      @if (toast.action; as action) {
        <button type="button" (click)="run(toast)">{{ action.label | transloco }}</button>
      }
      <button type="button" aria-label="Dismiss" (click)="toasts.dismiss(toast.id)">×</button>
    </div>
  }
</section>
```

Place `<app-toasts />` in your root template, beside `<lw-shell />`. Three things become yours with
the drawing:

- **Announcing.** Give a warning or an error `role="alert"` and every other toast `role="status"`,
  as above. The workbench announces nothing for a toast it does not draw.
- **Holding.** Call `hold()` while the user is attending to your toasts and `release()` when that
  ends. Calling `hold()` twice is the same as calling it once, and dismissing the last toast ends a
  hold too. The example holds on `pointermove` rather than `pointerenter`, so that a toast appearing
  under a resting pointer still leaves.
- **Motion and contrast.** The transition and the colour pairings are part of the drawing.

## Where the story is told

- [Host UI in a weaver](../weaver/host-ui-and-facts.md): the same three lanes through `ctx.ui`.
- [Asking before doing something destructive](../samples.md#asking-before-doing-something-destructive): a complete recipe.
