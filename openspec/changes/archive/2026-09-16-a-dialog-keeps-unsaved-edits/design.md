## Context

See proposal.md, *Why*. Today one boolean on the dialog open options, `dismissable`, decides three
things at once in the dialog outlet: whether the scrim button is enabled, whether Escape closes the
top dialog, and whether the close control is drawn. Every one of those paths calls `ref.close()`
directly, and nothing reads the body component before it does. A declared footer button closes with
its value the same way.

Tabs already have the unsaved-work protocol. A surface instance implements `DirtySurface`
(`surfaceDirty`, optional `surfaceSave`, optional `surfaceBeforeClose`), the shell discovers it
structurally (`dirtySurfaceOf`, `beforeCloseOf`, `instanceDirty` in the retention slice), and
`SurfaceCloseGuard.confirmClose` runs the vetoes with their timeout and the "close anyway" escape,
then asks Save, Discard or Cancel and saves. That guard itself opens its questions through
`DialogService`.

A sandboxed plugin reaches only `toast` of the dialog family over RPC, so every dialog body is a
host-rendered Angular component.

## Goals / Non-Goals

**Goals:**

- One typed option on `OpenOptions` for the user's ways of closing, replacing `dismissable`.
- The body of a dialog opened with `open` takes part in the unsaved-work protocol by implementing
  `DirtySurface`, with no second contract.
- The question, the veto timeout and the save handling are the ones a tab uses, not a copy.

**Non-Goals:**

- `confirm`, `alert` and `prompt` get no option. They hold nothing to lose and keep every way; a
  question still resolves to refusal when dismissed.
- Progress stays closed to the user, as today.
- No unsaved-work marking on a dialog, unlike a tab. A dialog is in front of the user; the question
  on closing is the whole guarantee.
- Nothing for a sandboxed plugin, since it cannot open a dialog.

## Decisions

**The option is `dismiss: 'any' | 'explicit' | 'none'`, default `'any'`.** "Dismiss" is already the
word this platform uses for the user closing a dialog (the specification's "dismissed it by any
means", `DialogRef.closed` resolving `undefined` when dismissed), while `close` is what code does.
The option governs exactly the user's side, so the name keeps that line visible. A string union
follows the SDK's existing option shapes (`align`, `retain`). Rejected: `closeOn`, which parallels
`saveOn` but reads as if `'none'` stopped the code closing it too; and widening `dismissable` to
`true | false | 'explicit'`, which mixes a boolean and a word under a name that no longer describes
the values.

**`dismissable` is removed, not deprecated.** The project keeps no deprecated symbol beside its
replacement. A consumer passing `dismissable` gets a compile error on an unknown property, which is
louder and safer than an alias that silently diverges later. The move is mechanical: `true` becomes
`'any'` (or nothing, the default) and `false` becomes `'none'`. `DialogInstance` carries `dismiss`
in its place. The release notes and the dialog guide state the removal and the mapping. Rejected
during planning and then dropped: keeping `dismissable` as a deprecated alias.

**Which path is which.** The scrim is the only non-deliberate path and works only under `'any'`.
Escape and the frame's close control work under `'any'` and `'explicit'`. Under `'none'` neither
works and the close control is not drawn. Declared footer buttons are the opener's own controls and
are never removed by the option, in any value. For a bare dialog the outlet still owns Escape and
the scrim; the body's own close control calls `ref.close()`, which is code closing it.

**The body is found through the outlet, not handed in.** The outlet already mounts the body with
`NgComponentOutlet`; it reads the instance from the outlet directive (`componentInstance`) for the
dialog being closed and passes it to the guard as the single candidate. Rejected: a registration
call on `DialogRef` (`ref.guard(...)`). It would be a second way to say what `DirtySurface` already
says, and a body that forgot to register would silently be unguarded while one implementing the
interface is not.

**The outlet reaches the tab's guard through a port.** `SurfaceCloseGuard` sits in the pane slice
and already depends on the dialog slice, because it asks its questions through `DialogService`. The
outlet injecting it directly forms no file cycle but does make the two slices mutual, which the
repository's import-cycle ratchet refuses. So the dialog slice declares a small port,
`DIALOG_CLOSE_GUARD` (`mustAsk`, `confirmClose`), with a root default that never asks, the same shape
as the other seams the shell composes. `SurfaceCloseGuard` implements it and `provideShell` binds it
with `useExisting`, and a test pins that binding. `mustAsk` is the condition `guarded` already used,
now public so both callers share it. Rejected: moving the guard and its structural helpers into a
shared slice, which touches some thirty files and still leaves the guard depending on
`DialogService`; and duplicating the ask-and-save logic in the outlet, which is exactly the drift the
host-services requirement *A control and its programmatic counterpart are one action* exists to
prevent.

**What asks.** Scrim, Escape and the close control call one `requestDismiss(dialog)` that returns at
once when the path is not allowed, and otherwise runs `confirmClose([body])` and closes with
`undefined` on approval. A declared button whose `value` is `undefined` goes through the same
request; one with a value closes directly, because it is the body's deliberate outcome and the
opener acts on the value. `ref.close()` from the body or the opener never consults anything.

**A dismissal already asking is not asked twice.** While a request is pending for a dialog, further
dismissals of that dialog are ignored, so pressing Escape twice does not stack two questions. The
question itself is a dialog on top and takes Escape for its own cancel.

## Risks / Trade-offs

- [A body implemented `surfaceDirty` for an unrelated reason and now gets asked about] → the method
  has one documented meaning, unsaved work; a body that returns `true` from it means that. Accepted.
- [An injector without `provideShell` gets the default that never asks] → the same trade every
  composed seam in the shell makes; the binding in `provideShell` is pinned by a test, and the
  existing `surface-close-guard` and `tab-closing` tests pin the guard's behaviour unchanged.
- [A declared "Close" button with no value asks, where an opener expected it to close silently] →
  only when the body reports unsaved work, which is the point; a body that wants a silent discard
  closes from code.
- [The veto's "close anyway" dialog stacks over the dialog being closed] → the same stacking a tab's
  close already produces over the workbench; the outlet handles stacked dialogs and focus returns
  to the dialog below.

## Migration Plan

A consumer passing `dismissable` replaces it: `true` by nothing or `'any'`, `false` by `'none'`. A
call passing neither keeps its behaviour, and a body that implements nothing is never consulted. The
shell's own settings and plugin-store dialogs drop `dismissable: true` and rely on the default. The
demo and the example are checked for the switch and moved in the same change.
