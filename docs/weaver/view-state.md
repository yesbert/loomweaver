# View state that survives

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `persistence-ports` · `surfaces` · `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page keeps what a surface shows across a hide and a reload: filters, sort, scroll position, the
active sub-tab. The `VIEW_STATE` handle stores it for a docked surface; the address stores it for a
routable one; `retain` keeps a live instance alive where neither fits.

## The `VIEW_STATE` handle

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

**A routable surface has no `VIEW_STATE` handle.** It owns a
URL, and the URL is the better store for everything shareable: put the filter and the active sub-tab in
route params or `subRoutes` and they survive a reload *and* a deep link, take part in browser history and
can be sent to a colleague. What the URL should not carry, unsaved edits, is what [`DirtySurface`](unsaved-changes.md) and
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

## Keeping a hidden surface alive

**A hidden surface is destroyed as soon as it is clean.** Your surface is hidden when no pane renders
it: a tab switch, a minimised pane, a collapsed sidebar, the closed mobile drawer. The host then
destroys the instance and rebuilds it on return. Component-local fields do not survive that. They never
survived a reload either. The rule to author by is **evictable = reload-safe**: anything that must
survive an F5 belongs in `VIEW_STATE`. Then hiding costs you nothing. A surface that genuinely needs
its live instance kept while hidden (an expensive rebuild, a live connection) declares
`retain: 'always'` on its registration; `retain: 'never'` opts back into destruction when
the distribution flipped the app-wide default.

**Where a retained surface lives.** A retained routable surface is mounted by the host in **every**
pane — the URL-carrying pane included; its route only carries the address. The instance is keyed to
the pane it sits in, so handing the URL role between split panes moves the role and leaves each
pane's instance where it is: a split shows **two independent instances** of your surface,
deliberately. The price: the surface receives a host-fabricated `ActivatedRoute` everywhere — route
params work (a param change is a different tab, hence a different instance), but there are **no
resolvers, no query params, no live parameter streams**, and a nested `<router-outlet>` stays inert,
so **do not combine `retain` with `subRoutes`** (the host warns in dev mode; read the sub-segment
from the address instead). A surface that needs live routing should not declare `retain`. For
unsaved work, [`DirtySurface`](unsaved-changes.md) is the guard.

A **sandboxed** (`iframe`) surface retains too. The host
hides it in place instead of destroying it. Your document keeps running, and the Penpal handshake is
not paid again — at a URL and at a dock alike. **Moving** it is where the browser decides: an `<iframe>`
that is removed and re-inserted the ordinary way reloads, so the host uses the browser's atomic move
where it exists (Chromium and Firefox today) and the surface then survives a collapsed sidebar and a
closed pane as well. Where the browser has no atomic move (WebKit today) the surface is rebuilt
instead. A split, a drag into another pane and a minimise still rebuild everywhere. So write your
surface so that a rebuild is survivable either way. `container` surfaces are always rebuilt.

## Where next

- [Unsaved changes](unsaved-changes.md): the guard for work the user has not saved yet.
- [Your plugin's own store](plugin-state.md): state that belongs to the plugin, not to one view.
- [Retention and unsaved work](../concepts/retention-and-unsaved-work.md): why hiding is not closing.
- [Samples](../samples.md#everything-a-view-must-persist): recipe 7, everything a view must persist.
