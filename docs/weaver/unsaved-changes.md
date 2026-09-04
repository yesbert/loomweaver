# Unsaved changes

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page keeps unsaved work safe when a surface is hidden or closed: implement `DirtySurface`, and
the workbench asks before anything is lost. Where a surface only needs its live instance kept, `retain`
on [View state that survives](view-state.md) is the lighter tool.

## `DirtySurface`

For an editor-like surface the guard is not `retain` but **dirty state**. Implement the `DirtySurface`
interface on your **component** (per instance — one `doc/:id` declaration backs many open tabs, and
"this tab has unsaved changes" is a question about one of them):

```ts
// src/lib/views/editor-view.ts
import { DirtySurface } from '@loomweaver/plugin-sdk';

@Component({ /* ... */ })
export class EditorView implements DirtySurface {
  protected readonly draft = signal(this.savedBody());

  surfaceDirty(): boolean {
    return this.draft() !== this.savedBody(); // read signals — the host reads this reactively
  }

  surfaceSave(): Promise<void> {
    return this.api.save(this.draft()); // optional — enables "Save" in the host's close dialog
  }
}
```

While `surfaceDirty()` is `true` the instance is **never destroyed on hide**, so no gesture that
merely hides is ever blocked or prompted; which gestures hide, and which actions ask, is on
[Retention and unsaved work](../concepts/retention-and-unsaved-work.md#the-unsaved-work-question).
**Closing asks**: the host shows its own localised dialog with _Save_ (only when `surfaceSave` exists),
_Discard_ and _Cancel_, with the same wording and keyboard behaviour across every plugin. A failed or
in-flight save keeps the instance dirty and therefore alive; failures surface as an error toast, never
as silent loss. Declare `saveOn: 'hide'` on the surface registration and the host calls `surfaceSave`
fire-and-forget the moment a dirty instance becomes hidden, which is the auto-save pattern of a notes
pad.

Two limits. First, a **sandboxed** surface pushes its dirty flag over the channel
(`setDirty(true|false)`). It is then treated like any other dirty surface: it survives hiding and is
guarded at close and unload. But `saveOn: 'hide'` is inert for it, because no save call crosses the RPC
boundary. Save inside the surface instead, and push `setDirty(false)`. Second, a **routable** surface
has no `VIEW_STATE` handle ([View state that survives](view-state.md) says why). For it, `DirtySurface`
or `retain` is the way to keep unsaved work across hides.

### `surfaceBeforeClose` — veto a close with your own flow

When the standard dialog is the wrong shape for your surface, implement the optional
`surfaceBeforeClose(): boolean | Promise<boolean>` member of `DirtySurface`. It runs on every
**user-initiated close** of that instance: tab ×, `Delete`, close pane, close others/all/to the right,
`ctx.closeContentTab`. It runs _before_ the host's unsaved-changes dialog. Return `false` to cancel the
close, `true` to let it continue. Typically you draw your own dialog first and resolve the promise with
the user's answer. An approved close does **not** bypass the safety net. If the instance is still dirty
afterwards, the standard _Save · Discard · Cancel_ ask still runs. So approve-and-stay-dirty never
discards silently. Resolve your own save/discard first, and the surface closes without a second dialog.
The host enforces a timeout with a guaranteed **"Close anyway"** escape, and a hook that throws or
rejects counts as approval — a broken or hung veto can never make a tab unclosable. Programmatic
destruction (your plugin being disabled or uninstalled, a workspace reset) does **not** consult the
hook; only the unsaved-changes dialog guards those, because a plugin must not be able to veto its own
removal.

A **sandboxed** surface takes part through its surface channel: push `setDirty(true|false)` to report
unsaved work, and optionally expose `beforeClose()` next to the `render` receiver — the host calls it
over RPC and applies the same timeout. Both wires in one place:

```js
// view.js — the surface document's side of the dirty/close protocol
let draft = '';

const connection = Penpal.connect({
  messenger,
  methods: {
    render(state) {
      /* locale, tab, theme tokens … — see the sandbox bootstrap */
    },
    beforeClose() {
      // optional veto — draw your own dialog and resolve with the answer;
      // absent, throwing or hanging all count as consent (host timeout).
      return draft === '' || confirm('Discard your draft?');
    },
  },
});

input.addEventListener('input', (event) => {
  draft = event.target.value;
  connection.promise.then((host) => host.setDirty(draft.length > 0));
});
```

The runtime channel may also expose `contentTabClosed(path)`, the sandbox counterpart of the in-process
`onClose` tab hook: when a tab your plugin opened via `ctx.openContentTab` closes, the host calls it
with the path you opened. The trusted editor as one file, with its save flow, `saveOn: 'hide'` and
veto, is [recipe 8 in Samples](../samples.md#an-editor-with-unsaved-changes); the sandbox variant
lives only here.

## Where next

- [View state that survives](view-state.md): `VIEW_STATE` and `retain`.
- [Retention and unsaved work](../concepts/retention-and-unsaved-work.md): who asks, and why hiding never does.
- [Samples](../samples.md#an-editor-with-unsaved-changes): recipe 8, an editor with unsaved changes.
