# Unsaved changes

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

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

While `surfaceDirty()` is `true` the instance is **never destroyed on hide** — no gesture that merely
hides (tab switch, minimise, collapse) is ever blocked or prompted, and nothing can be lost. **Closing
asks**: the host shows its own localised dialog with *Save* (only when `surfaceSave` exists), *Discard*
and *Cancel*. The wording and keyboard behaviour are the same across every plugin. Closing the browser
while anything is dirty triggers the native `beforeunload` prompt. Its wording and language are the
**browser's own**: browsers ignore page-supplied text there and localise it to the browser UI
language, not the app's. A failed or in-flight save keeps the
instance dirty and therefore alive; failures surface as an error toast, never as silent loss. Declare
`saveOn: 'hide'` on the surface registration and the host calls `surfaceSave` fire-and-forget the
moment a dirty instance becomes hidden — the auto-save pattern of the testbed's notes pad. There are two honest limits today. First, a **sandboxed** surface pushes its dirty flag over the channel
(`setDirty(true|false)`). It is then treated like any other dirty surface: it survives hiding and is
guarded at close and unload. But `saveOn: 'hide'` is inert for it, because no save call crosses the RPC
boundary. Save inside the surface instead, and push `setDirty(false)`. Second, a **routable** surface
has no `VIEW_STATE` handle by design (see [View state that survives](view-state.md)). For it, `DirtySurface` — or `retain` — is the way to
keep unsaved work across hides.

### `surfaceBeforeClose` — veto a close with your own flow

When the standard dialog is the wrong shape for your surface, implement the optional
`surfaceBeforeClose(): boolean | Promise<boolean>` member of `DirtySurface`. It runs on every
**user-initiated close** of that instance: tab ×, `Delete`, close pane, close others/all/to the right,
`ctx.closeContentTab`. It runs *before* the host's unsaved-changes dialog. Return `false` to cancel the
close, `true` to let it continue. Typically you draw your own dialog first and resolve the promise with
the user's answer. An approved close does **not** bypass the safety net. If the instance is still dirty
afterwards, the standard *Save · Discard · Cancel* ask still runs. So approve-and-stay-dirty never
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

The runtime channel may
also expose `contentTabClosed(path)` — the sandbox counterpart of the in-process `onClose` tab hook:
when a tab your plugin opened via `ctx.openContentTab` closes, the host calls it with the path you
opened. The veto flow is dogfooded by the sandbox testbed plugin (`sandbox-rpc/view.js` pushes
`setDirty` from its draft field and draws its own in-iframe veto dialog). The complete editor
recipe — trusted component, save flow, `saveOn: 'hide'`, veto and this sandbox variant — is
[recipe 8 in Samples](../samples.md#an-editor-with-unsaved-changes).

A **docked** surface persists its own serialisable state — filters, sort, scroll position, expanded
nodes, the active sub-tab — through the host-provided `VIEW_STATE` handle, so it survives both a hide and
a reload. Inject it and type it to your own state shape; the host **auto-saves** every `set`
(debounced) and hands the saved blob back on the next mount. You never touch storage, and the platform
stays domain-pure — it stores an opaque blob, only your view reads it.

```ts
// src/lib/views/outline-view.ts
import { VIEW_STATE, ViewState } from '@loomweaver/plugin-sdk';

interface OutlineState { sort: 'natural' | 'alpha'; }

@Component({ /* ... */ })
export class OutlineView {
  private readonly viewState = inject(VIEW_STATE) as ViewState<OutlineState>;
  // value() is Signal-shaped; undefined for a fresh view → apply your own default.
  protected readonly sort = computed(() => this.viewState.value()?.sort ?? 'natural');

  toggleSort(): void {
    this.viewState.set({ sort: this.sort() === 'alpha' ? 'natural' : 'alpha' }); // host saves it
  }
}
```

Two things to know before you scale that up. `set` replaces the **whole** blob, so spread the current
value when you change one field — keep one state shape rather than five separate signals and there is
nothing to merge. And call `set` as often as you like: the value is live immediately and the write is
debounced, so even a per-keystroke `set` costs one save once typing stops. The full treatment — form
value, scroll position, expanded nodes, active sub-tab and filter in a single shape, next to the
counter-example that loses all of it — is
[recipe 7 in Samples](../samples.md#everything-a-view-must-persist). (Persistence is backed by the
distribution's [working-state store](../distribution/persistence.md); default
`localStorage`.)

**A routable surface has no `VIEW_STATE` handle, and that is a decision rather than a gap.** It owns a
URL, and the URL is the better store for everything shareable: put the filter and the active sub-tab in
route params or `subRoutes` and they survive a reload *and* a deep link, take part in browser history and
can be sent to a colleague. What the URL should not carry — unsaved edits — is what `DirtySurface` and
`retain` are for. The same holds for a **sandboxed** surface (which is always routable): nothing of the
`VIEW_STATE` shape crosses the RPC boundary, so declare `retain: 'always'` and the host hides your iframe
in place instead of destroying it, leaving the document's own state intact.

**State travels with the tab.** When the user drags your view's tab to another pane — sidebar into the
centre, into a split, back again — the same `VIEW_STATE` stays bound to it, so filters and sort survive
the move. Deliberately independent copies (stacking the same view, split-born panes) each get their own
state; your component code is identical in both cases.

**The user can reset it.** The view tab's context menu offers **Reset view**: the host clears
that instance's blob and `value()` flips back to `undefined` — live, without a remount. Your `?? default`
fallback (as above) is all you need for this to work.

**Named saved instances.** Set `instanceable: true` on the view and the host adds a **switcher** to the
view header: the user can save, name, rename and delete several configurations of your view, each with its
own auto-saved `VIEW_STATE` blob. Your component code does not change — it just reads/writes `VIEW_STATE`;
the host binds it to whichever instance is active and manages the list (the non-deletable *default*
instance carries the baseline state). The switcher **travels with the view**: it is rendered wherever the
host mounts it — sidebar, content pane, split, pop-out window — so instance management never disappears
when the user moves your view. A pane that was deliberately born as its **own** instance (stacked below
another, or split off) keeps its independent state until the user picks an instance from the switcher —
that pick re-binds the pane to the named instance.

```ts
ctx.registerSurface({ id: 'library', title: 'library.title', docks: ['primary'], instanceable: true, component: LibraryView });
```

**It also works in a pop-out window.** The user can open any view or content tab in its own browser
window (for a second monitor) from its context menu. Your surface is mounted there exactly as it is
in a pane — **nothing to declare, nothing to change**. Both windows share one `VIEW_STATE` instance,
so they mirror each other live.

## Where next

- [Authoring a weaver](../authoring-a-weaver.md): the map of these pages.
- [Samples](../samples.md): complete recipes to copy.
