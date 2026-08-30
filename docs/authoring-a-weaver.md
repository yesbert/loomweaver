# Authoring a weaver

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surfaces` · `plugin-runtime` · `commands` · `menus` ·
> `content-tabs` · `routing` · `surface-retention` · `containers` · `ui-primitives` · `theming` ·
> `i18n`. Where this page and a specification disagree, the specification is right, and that is a
> defect in this page: change the behaviour there, then explain it here.

A **weaver** is a LoomWeaver plugin — where all your domain UI and logic live. It imports only
`@loomweaver/plugin-sdk` (nothing else is public API) and contributes through the uniform `ctx` it receives
on activation. This page is a tour of that contract with complete, copyable examples. `ctx` is the
supported surface throughout. There is one deliberate way past it:
[defining your own custom element](#your-own-custom-element--the-escape-hatch). That path is an escape
hatch, and its costs are ones the platform cannot absorb for you.

> **Where the snippets go.** A snippet that starts with `ctx.` belongs **inside `activate(ctx)`** in
> your plugin file — `src/lib/plugin/<id>.plugin.ts` in a scaffolded weaver. Anything that belongs
> somewhere else names its file on the first line. Components live beside it under `src/lib/views/`,
> and providers always mean the `providers` array in the distribution's `src/app/app.config.ts`.
> [Samples](samples.md) has the same material as whole files you can copy in one piece.

## The shape of a weaver

```ts
// src/lib/plugin/notes.plugin.ts
import { Plugin } from '@loomweaver/plugin-sdk';

export const notesWeaver: Plugin = {
  // Declares identity + the capabilities it needs; the distribution grants them (default-deny).
  manifest: { id: 'notes', name: 'Notes', capabilities: ['contributions', 'ui', 'host'] },

  // Called once when the plugin activates. Contribute through `ctx` here.
  activate(ctx) {
    // ctx.registerSurface / registerCommand / registerBarItem / registerRailItem / registerSettingsSection
    // ctx.ui.*  (dialogs, toasts, settings)
    // ctx.host.* (version, update)
  },

  // Optional: clean up on deactivation (the host also disposes what you registered).
  deactivate() {},
};
```

Every `ctx.register*` call returns a `Disposable` — keep it if you want to remove a contribution
yourself; otherwise the host disposes it when the plugin unloads.

> **Surfaces (the one contract):** `ctx.registerSurface` **is** the author contract for anything the
> host renders. A `Surface` declares *what it can do* — `routable` (URL-addressable), `instanceable`
> (multiple saved instances), `docks` (which regions may host it) — rather than *where it lives*; the
> user arranges it from there.
>
> **Heavy surface? Defer it.** Instead of `component`, give a `loadComponent: () => import('./graph-view').then(m => m.GraphView)`.
> The host calls it the first time the surface is actually shown. Routable surfaces go straight to the
> router's own `loadComponent`; host-mounted ones render once it resolves. A surface that drags a
> chart or graph engine behind it therefore lands in its own chunk. A user who never opens it pays
> nothing for it. Everything else about the surface is unchanged.
>
> Every surface needs an `id` and a `title`: the id is the surface's stable handle (pick
> `<plugin>.<surface>`), the title is its tab label (and the fallback title when a deep-link
> auto-opens a tab).

> **Capabilities:** the manifest *declares* what the plugin needs; the distribution *grants* it
> (`provideCapabilityGrants`). A declaration alone grants nothing — using an ungranted surface throws
> `CapabilityError`. The coarse capabilities map to slices of `ctx`: `contributions` (`register*`),
> `ui` (`ctx.ui.*`), `host` (`ctx.host.*`), `navigation` (`navigateContent`/`openContentTab`/…),
> `session` (`ctx.session`), `theme` (`ctx.contributeTheme`), `automation`
> (`ctx.invokeCommand`/`ctx.invocableCommands` — running actions *other* plugins contributed; your own
> need no grant). The user can also **revoke** any granted capability at runtime
> from the built-in Permissions settings. A revoked surface then throws `CapabilityError` on the next
> call. So treat a `CapabilityError` as a normal denial: catch it, rather than treating it as an invariant.

## Panel surfaces — your UI in a panel

A **non-routable** surface docks an Angular component into a region the distribution declared: its
home dock is `docks[0]`. The host renders a tab per surface in that region, so independent weavers
coexist, and the user can move it elsewhere from there.

```ts
// src/lib/views/notes-list-view.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'notes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ul class="flex flex-col gap-1 text-sm text-content">…</ul>`,
})
export class NotesListView {}

// in activate(ctx):
ctx.registerSurface({
  id: 'notes.list',
  title: 'notes.list.title',    // a translation key (or a literal)
  icon: 'navigator',            // host icon name
  order: 0,
  docks: ['primary'],           // home dock: a PANEL region id (no `routable` ⇒ not URL-addressed)
  actions: [                    // the surface's own header actions (not view switchers)
    { id: 'notes.list.add', icon: 'add', title: 'notes.add', command: 'notes.add' },
  ],
  component: NotesListView,
});
```

Use **semantic design tokens** in templates (`text-content`, `bg-surface`, `text-brand`), never raw
colors — see [design tokens](reference/design-tokens.md).

**What your view's own body can use.** A weaver depends only on `@loomweaver/plugin-sdk`, so inside your
component's template you have: semantic tokens, the `prose-lw` markdown utility, and the host **`<lw-*>`
custom elements** (all documented in [design tokens](reference/design-tokens.md)). These are
framework-agnostic, so you consume them **by tag** — no `@loomweaver/shell` import; in an Angular
weaver add `schemas: [CUSTOM_ELEMENTS_SCHEMA]`:

| Element | For |
| --- | --- |
| `<lw-icon name="…" size="…">` | an icon by name (yours via `ctx.contributeIcons`, or a first-party name) |
| `<lw-button variant="…">` | a themed button (or use the `.lw-btn` class contract on a native `<button>`) |
| `<lw-markdown source="…">` | sanitized Markdown (`marked` + DOMPurify) |
| `<lw-select>` + `<lw-option>` | a single-value dropdown (`lw-select-change` event) |
| `<lw-tooltip text="…" position="…">` | a hover tooltip — last child of a `position: relative` trigger |
| `<lw-progress-ring value="…" max="…">` | a determinate circular progress (needs an `aria-label`) |

```ts
@Component({ /* … */ schemas: [CUSTOM_ELEMENTS_SCHEMA], template: `
  <button class="relative …">
    <lw-icon name="document" size="1rem"></lw-icon> {{ file.name }}
    <lw-tooltip [text]="file.path" position="right"></lw-tooltip>
  </button>` })
```

> **`<lw-*>` elements don't survive `[innerHTML]`.** Angular's `DomSanitizer` strips unknown elements
> from a string you bind with `[innerHTML]`, so an `<lw-tooltip>`/`<lw-icon>` written *inside* such a
> string is silently removed. Consume the `<lw-*>` elements in your **template** (as above), not inside an
> HTML string. For interactive affordances on `[innerHTML]` content, keep a plain attribute the sanitizer
> preserves (e.g. a native `title` for a basic tooltip) or render that part as a real template element.
> (`<lw-tooltip>` itself is a top-layer popover, so it is **not** clipped inside a scrolling/virtualized
> or `transform`ed ancestor.)

Everything else is a **CSS class contract on a native element**. A native control already has full
semantics, keyboard support and a11y, so it needs only theming, not a web component. The contracts are:
`.lw-btn` on `<button>` · `.lw-field` on `<input>`/`<textarea>`/`<input type="date">` ·
`.lw-checkbox`/`.lw-switch`/`.lw-radio` on `<input type="checkbox|radio">` · `.lw-range` on
`<input type="range">` · `.lw-progress` on `<progress>` · `.lw-badge` on `<span>` · `.lw-divider` on
`<hr>` · `.lw-collapsible` on `<details>`. Full list + tokens: [design-tokens.md](reference/design-tokens.md).

Context menus come in three flavours. On **host chrome** (rail / bar / view / content-tab), contribute items
with `ctx.registerMenuItem` (and/or a `menu?` slot on your rail/bar/view items) — the host draws
`<lw-menu>`. On your **own in-process view body** (a right-click on a list row), call
**`ctx.ui.openMenu(items, { x, y })`**. You pass ad-hoc items with in-process `run` handlers. The host
draws them as its `<lw-menu>` at the cursor — see [Host UI](#host-ui--ctxui). The menu is body-level, so
it is never clipped. The one case where you render the element yourself is your **own sandboxed
surface**. There you draw `<lw-menu>` and position it with `openAt(x, y)` at the iframe-local cursor.

### Your own custom element — the escape hatch

Nothing prevents a **trusted** weaver (one composed at build time through `providePlugins`) from calling
`customElements.define()` itself: it shares the document with the host, and therefore the one global custom
element registry. The platform's UI ladder lists exactly this as its last rung, the escape hatch for "special
graphics" between the host vocabulary and a full iframe.

So it is **allowed, and it is not supported**. There is no `ctx` surface for it, the host never learns about
it, and it is the one contribution shape the platform cannot clean up after you. The four costs below are
the price of the escape hatch, not a to-do list we forgot; weigh them before reaching past `<lw-*>`, the
`.lw-*` class contracts and `ctx.ui`.

**1. It cannot be undone.** The registry has no `undefine`, so a tag stays defined for the lifetime of the
document. Every other contribution you make returns a `Disposable` and vanishes when your plugin is
disabled, updated or uninstalled. A defined tag does not.

The sharp edge is the plugin on/off switch. Disabling your plugin runs `deactivate`, re-enabling runs
`activate` **again in the same document**. A second `define()` on an existing tag throws
`NotSupportedError`, the runtime treats that as an activation failure, and your plugin then loses **all**
of its contributions, not just the element. Guard it:

```ts
// inside activate(ctx) — re-enabling the plugin runs this a second time
if (!customElements.get('notes-graph')) {
  customElements.define('notes-graph', NotesGraphElement);
}
```

The same asymmetry means a new version of your element cannot take over at runtime: the constructor that
claimed the tag first keeps it until the page is reloaded.

**2. It does not travel up the isolation ladder.** The registry is **per document**. Your weaver is
deliberately separated from the shell by the Nx boundary so that it *can* move to the sandbox rung later,
and a `customElements.define()` in the host document is the one thing that silently will not come along.
(The `<lw-*>` family works inside sandboxed iframes only because the host serves the element *script* into
each one, `/frame-kit/lw-elements.global.js`.) If sandboxing your weaver is ever on the table, this is a
migration cost you are choosing today.

**3. Nothing manages collisions.** `ctx.contributeIcons` is first-wins, dev-warned and disposable because
the host owns that registry; `customElements.define` is a global land grab that throws hard on the second
claim. Prefix your tags with something you own (`notes-graph`, not `graph`). **The `lw-` prefix belongs to
the host** — claiming it collides with a shipped element or shadows one added in a later release.

**4. Do not offer your tag to other plugins.** Whether one plugin may consume another plugin's element is
deliberately undecided, and across the sandbox boundary it cannot work at all: separate registries, and
carrying it over would mean running your code inside someone else's isolation boundary. Treat the element
as private to your own views.

If you go ahead, paint it with the semantic tokens or the `.lw-*` class contracts so that theme, tenant
branding and the text-size setting reach it like everything else, and keep it to the graphics the host
vocabulary genuinely cannot express. Anything with a native equivalent is better served by a class contract
on that native element.

## View state — `VIEW_STATE` (persisted view + filters)

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
from the address instead). A surface that needs live routing should not declare `retain` — for
unsaved work, `DirtySurface` below is the guard.

A **sandboxed** (`iframe`) surface retains too. The host
hides it in place instead of destroying it. Your document keeps running, and the Penpal handshake is
not paid again — at a URL and at a dock alike. **Moving** it is where the browser decides: an `<iframe>`
that is removed and re-inserted the ordinary way reloads, so the host uses the browser's atomic move
where it exists (Chromium and Firefox today) and the surface then survives a collapsed sidebar and a
closed pane as well. Where the browser has no atomic move (WebKit today) the surface is rebuilt
instead. A split, a drag into another pane and a minimise still rebuild everywhere. So write your
surface so that a rebuild is survivable either way. `container` surfaces are always rebuilt.

### Unsaved changes — implement `DirtySurface`

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
has no `VIEW_STATE` handle by design (see below). For it, `DirtySurface` — or `retain` — is the way to
keep unsaved work across hides.

#### `surfaceBeforeClose` — veto a close with your own flow

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
[recipe 8 in Samples](samples.md#an-editor-with-unsaved-changes).

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
[recipe 7 in Samples](samples.md#everything-a-view-must-persist). (Persistence is backed by the
distribution's [working-state store](building-a-distribution.md#persistence-stores-optional); default
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

## Your plugin's own store — `ctx.state`

`VIEW_STATE` belongs to *one mounted view instance*. When several of your surfaces need to agree on
something — a wizard whose step form is popped out into a second window while the main window has to
see what the user types — you need one store shared by your whole plugin. That is `ctx.state`:

```ts
interface Wizard { readonly customer: string; }

const step = ctx.state.watch<Wizard>('wizard/step-1');

if (step.loaded()) {                       // check before applying your default
  input.value = step.value()?.customer ?? '';
}
input.addEventListener('input', () => step.set({ customer: input.value }));
// when the surface goes away
step.dispose();
```

Every surface of your plugin sees the same store — any dock, any number of instances, every browser
window — so it is both your persistence and the only channel between your own surfaces. The host
prefixes every key with your plugin id and you cannot leave that namespace, which is why there is no
capability to grant: there is nothing foreign to reach.

Four things to know before you use it:

- **Check `loaded()` before you apply a default.** With a local store it is true at once. With a
  network-backed one there is a real window in which the store has not answered, and a default applied
  in that window is overwritten the moment the value lands — after the user has started typing.
- **`set` replaces the whole value; nothing is merged.** So: **one key per unit of editing** — a wizard
  step, not the whole form — and where your surface can exist more than once, key by instance too
  (a sandboxed surface receives its `instanceId` with its pushed state). Two windows writing two keys
  converge; two windows replacing one key means last write wins, which costs the user's typing.
- **It holds working state, not settings.** Settings have their own path precisely because the user
  can *see* and change them in the settings dialog; a free-form settings store would be a back door
  around that. Uninstalling your plugin deletes this store — a settings section survives, an abandoned
  draft is litter.
- **Values are JSON and writes are debounced.** Siblings in the same window see a change at once;
  other windows see it once the debounced write lands. There is a size cap per value and a count cap
  per plugin, with a development warning at half of each, so no plugin can flood the user's storage.

A **sandboxed** plugin gets the same store on both of its channels. Its logic document calls
`stateWatch` / `stateSet` / `stateClear` / `stateUnwatch` on the `ctx` it already has, and the host
pushes every change back as `stateChanged(key, value, loaded)`. A **surface** has the same four
methods on its own channel — which matters, because a surface holds no `ctx` at all and this is the
only way two surfaces of one sandboxed plugin can agree on anything. The kit reassembles the pushes
into the handle shape above, so the code reads the same as on the trusted rung:

```js
// view.js
const shared = LwFrame.state.watch('wizard/step-1');
shared.onChange(render);                       // re-render when the host pushes

const connection = Penpal.connect({
  messenger,
  methods: {
    render(state) { LwFrame.applySurfaceState(state); render(); },
    stateChanged: (key, value, loaded) => LwFrame.state.apply(key, value, loaded),
  },
});
connection.promise.then((host) => LwFrame.connectState(host));

input.addEventListener('input', () => shared.set({ customer: input.value }));
```

### Container surfaces (workspace-in-a-tab)

A **container** surface does not render one view. Instead it renders a host-managed **nested pane
tree** of child surfaces *inside its own content tab*. The tree has the same drag/split/tab mechanics
as the top level, one level nested and scoped to that tab. Use it for a "one X = one tab, with inner panes" layout (e.g. a run/sim
tab holding its feed, graph and details side by side). A container is always `routable` (its tab holds
its own `:id`, so several open in parallel and each is deep-linkable); its children are non-routable
surfaces declared with **`docks: []`** — "child-only", never seeded into a sidebar, mounted only inside
a container by id. The host draws the tree; you only declare which children it offers and which load
first.

```ts
ctx.registerSurface({
  id: 'sim', title: 'sim.title',
  routable: { path: 'runs/:id' },
  container: { children: ['sim.feed', 'sim.graph', 'sim.details'], initial: ['sim.feed', 'sim.graph'] },
});
ctx.registerSurface({ id: 'sim.feed',  title: 'sim.feed',  docks: [], component: FeedView });
ctx.registerSurface({ id: 'sim.graph', title: 'sim.graph', docks: [], component: GraphView });
ctx.registerSurface({ id: 'sim.details', title: 'sim.details', docks: [], component: DetailsView });
```

#### Declare how it opens, not just what it holds

`initial` also takes an **arrangement**, in the same grammar a distribution uses for a workspace: an
area either holds `tabs`, splits into `rows` (top to bottom) or splits into `columns` (left to right),
with an optional `size` share. A tab is a child surface id, or the object form when you want to fix or
preselect it:

```ts
container: {
  children: ['sim.graph', 'sim.feed', 'sim.details', 'sim.monitor'],
  initial: {
    columns: [
      { size: 60, tabs: ['sim.graph'] },
      { size: 40, rows: [
        { size: 65, tabs: ['sim.feed', { surface: 'sim.details', active: true }] },
        { size: 35, tabs: [{ surface: 'sim.monitor', closable: false }] },
      ]},
    ],
  },
}
```

Declare this whenever your container's path carries an `:id`. Its inner tree is kept **per instance**,
so an arrangement a user builds by hand belongs to that one run and is gone when the tab closes — a
sensible default can only come from your declaration. The plain list stays valid and means one tabs
area.

The baseline applies whenever a container tab is opened **fresh**; while it stays open the user's own
arrangement wins, across reloads. Closing the tab and opening it again is therefore also how a user
gets your arrangement back.

Two rules worth knowing before you debug something odd. A tab naming a child you did **not** list in
`children` is dropped with a developer warning, as is a malformed area — the container degrades to
whatever still makes sense rather than refusing to appear, so check the console when the layout is not
what you wrote. And a child the current user may **not** see still takes its place in the layout and
shows the host's access placeholder; the arrangement does not rearrange itself per role, and it cannot
collapse just because a session arrived late.

Each child receives the **container's route params** — read the `:id` off Angular's `ActivatedRoute`
(`route.snapshot.paramMap.get('id')`), the same idiom as a routable surface. So a child is contextualised
by its parent tab alone; there is **no global "active X"**. The inner tree is workspace state, not URL:
each open container tab keeps its own inner layout, it travels with the tab, and it survives reload
(persisted per window). The inner "new tab" picker offers only your declared `children` (access-gated),
and a popped-out container carries its whole inner tree.

`loomweaver weaver --id sim --container` scaffolds this whole shape — the container, two children with
`docks: []`, and child components that already read the `:id` — so you start from a running example
rather than from this page.

### A child that stands for one item

The children above are facets of one subject: a feed, a graph, a details panel, one of each. A child
that is a **list** needs its sibling to stand for one *item* of that list, several at a time — and for
that the child needs an address of its own. Declare a `segment`:

```ts
container: {
  children: [
    { surface: 'sim.list', segment: 'list' },
    { surface: 'sim.item', segment: 'item/:itemId' },
    'sim.details',
  ],
  initial: {
    columns: [
      { size: 34, tabs: [{ surface: 'sim.list', closable: false }] },
      { size: 66, tabs: [] },
    ],
  },
}
```

Two things in there are new. The `{ tabs: [] }` pane is declared **empty on purpose**: it says where
opened children land, and unlike every other pane it stays when its last tab closes. And a segment may
carry values, which is what lets one child surface stand for several open items.

The list opens them through the handle every child inside a container receives:

```ts
import { CONTAINER_HANDLE } from '@loomweaver/plugin-sdk';

const container = inject(CONTAINER_HANDLE);
container?.open(`item/${item.id}`, { title: item.name, titleIsLiteral: true });
```

`CONTAINER_HANDLE` resolves to `null` outside a container, so a surface that appears in both places
checks before it calls. The optional second argument is a `ContainerTabLabel` (`title`,
`titleIsLiteral`, `icon`) — give the tab one, or every open item reads as the child surface's own
title. Opening the same
address twice focuses the tab that is already there rather than adding a second one, so a list may
call `open` on every click without checking.

It is a call rather than a navigation on purpose, and that is worth understanding before you reach for
the router instead: a container tab may sit in a split pane or in a pop-out, where it holds no browser
address at all, and a list whose rows only worked in the main window would not be much of a list.

While the container tab *does* hold the address, the URL names the focused child
(`/sim/abc123/item/42`), so such a link is shareable and a deep link opens what it names — into that
same declared pane, and into an existing tab when one is already open. Elsewhere the container keeps
its own idea of what is focused and the address simply does not express it.

A child whose segment carries a value cannot appear in `initial` or in the inner picker: neither knows
which value to use. That is what the declared-empty pane is for. A child with no segment keeps
behaving exactly as before — reachable from the picker, one instance, no address.

### Sub-routes and pop-out windows

One thing to get right if your surface draws its own **sub-tabs**: switch them **locally when you are
host-mounted**, not by pushing an absolute URL onto the global router. Your surface can be mounted
where the global URL does not belong to it: a split pane, a sidebar, a pop-out. An absolute
`navigateByUrl('/doc/42/code')` from there hijacks the window. In a pop-out it drags the URL out of
the `/popout/` prefix, so a reload opens the full app.

The host tells you which case you are in: when it host-mounts you it supplies a **synthetic
`ActivatedRoute` whose `routeConfig` is `null`**. Branch on it — keep sub-tab state local off-router,
and only reflect it into the URL when you own it:

```ts
// Inside your route component (tabRoot = the route's path with params resolved, e.g. 'doc/' + id):
private readonly route = inject(ActivatedRoute);
// Host-mounted (split/sidebar/pop-out) = the host built a synthetic route: routeConfig is null,
// and data['sub'] carries the active sub-segment instead of the URL.
private readonly hostMounted = this.route.snapshot.routeConfig === null;
private readonly localSub = signal(String(this.route.snapshot.data['sub'] ?? '') || 'code');

openSub(sub: string): void {
  if (this.hostMounted) {
    this.localSub.set(sub);        // split / sidebar / pop-out — stay put
    return;
  }
  void this.router.navigateByUrl('/' + this.tabRoot + '/' + sub);   // URL pane — shareable, back/forward
}
```

Sub-tab-less views (the common case) need none of this.

## Content area — routes & tabs

The center (a `content` region) is **URL-addressed**, not a panel: a surface reaches it by declaring
`routable`, which makes it a shareable deep-link with browser back/forward. The distribution must set up the
router with [`provideShellRouter()`](building-a-distribution.md#content-area-routing).

It is the Angular router underneath, so `routerLink`, `ActivatedRoute` and `<router-outlet>` behave
as they do anywhere. [Routing](reference/routing.md) is the router-shaped view of this page: what
carries over unchanged, and the two places a surface is mounted off-router.

```ts
// a routable surface opens as a tab when visited — nothing else to declare
ctx.registerSurface({ id: 'reports', title: 'reports.title', component: ReportsView,
  routable: { path: 'reports' } });
ctx.registerSurface({ id: 'doc', title: 'doc.title', component: DocView,
  routable: { path: 'doc/:id' } });
// chromeless: a full-area screen that never becomes a tab (what a login or onboarding page needs)
ctx.registerSurface({ id: 'login', title: 'login.title', component: LoginView,
  routable: { path: 'login', chromeless: true } });
```

The host draws a tab strip **per pane**, and every pane is a tab group the user can split and move. The
strip shows **everything that pane holds**, and the rule is one sentence: a pane shows a strip when it
holds tabs; a **chromeless** surface shows none. Visiting any routable surface — by click, deep-link
or browser history — opens (or refines) its tab; a chromeless surface owns the whole content area
while active and is excluded from splits, drags and the new-tab picker. Permanent arrangements of
tabs are no longer declared on the surface — they are **workspaces**, declared by the distribution
with [`provideWorkspaces`](building-a-distribution.md#developer-defined-workspaces), where a declared
tab can be unclosable.

A surface can also refuse closing on its own with **`closable: false`** — the overview screen a
product keeps open while its other tabs come and go. It removes the ×, the `Delete` key and the
menu's close entries; moving, splitting and dragging the tab still work. It applies to **every** tab
of that surface, so it fits a parameterless route like `dashboard` and is almost always wrong for
`doc/:id`, where it would make no document closable at all.

```ts
ctx.registerSurface({ id: 'dashboard', title: 'dashboard.title', component: DashboardView,
  routable: { path: 'dashboard' }, closable: false });
```

### Reaching the pane edges

The host insets a surface 24px from its pane edges — right for the prose, forms and lists most
surfaces are. A surface that **is** the content declares **`padded: false`** and gets the edges: a
document viewer, a canvas, a map, an edge-to-edge table.

```ts
ctx.registerSurface({ id: 'viewer', title: 'viewer.title', component: ViewerView,
  routable: { path: 'doc/:id' }, padded: false });
```

It travels with the surface, so it holds wherever the user puts it — the URL pane, a split, a
sidebar, a pop-out window. Only the inset is yours to switch off; how wide it is stays a styling
question, so a product that wants a different amount everywhere writes plain unlayered CSS.

Open a tab yourself with:

```ts
ctx.openContentTab({
  path: `doc/${doc.id}`,
  title: doc.name,          // a document name is a literal, not a Transloco key…
  titleIsLiteral: true,     // …so mark it literal: the host shows it verbatim, no i18n lookup, no warning
  onClose: () => this.forget(doc.id), // runs once when THIS tab is closed — free per-tab state
});
ctx.closeContentTab(`doc/${doc.id}`); // the host activates a neighbour
```

Docked (non-routable) surfaces have their own opener: `ctx.revealSurface(id)` activates the
surface's tab **wherever the user has placed it** — its sidebar panel (expanding a collapsed one) or a
content pane — so a palette command like "Focus Library" works no matter where the view lives. It is a
no-op for an unknown id, and container-only children (`docks: []`) stay inside their container.
Routable surfaces are reached with `navigateContent` instead. Requires `navigation`.

A dynamic tab title is usually a runtime **literal** (a document name, an entity label). Set
`titleIsLiteral: true` so the host renders it verbatim instead of treating it as a translation key —
otherwise the value is looked up and a benign "missing translation" warning is logged in dev. Omit it
(default `false`) when the title genuinely is a Transloco key. Pass `onClose` to run teardown exactly
once when that tab is closed (the host's ×, or `closeContentTab`) — the place to free per-tab state,
cancel in-flight work or persist a draft. (In-process weavers only; a sandboxed plugin's `onClose`
does not cross the RPC boundary.)

**Preview tabs.** For file-browsing UX, open with `preview: true`: the host
uses a **single reused, italic** slot per pane — the next `preview` open of a *different* path replaces
it in place, so browsing many items doesn't pile up tabs. Promote it to a permanent tab **explicitly**:
call `ctx.keepContentTab(path)` (e.g. on your list's double-click or when the content is edited).
The host's own double-click cycle on the tab is **off by default** — a distribution can switch it on,
so do not build your flow on it. Re-opening an already-open tab just refines it (title/sub-route) and **keeps** its
preview state — so a view can safely call `openContentTab` on mount to set the real title without
accidentally promoting itself:

```ts
// src/lib/views/library-view.ts — inside the component
onSingleClick(doc) { ctx.openContentTab({ path: `doc/${doc.id}`, title: doc.name, titleIsLiteral: true, preview: true }); }
onDoubleClick(doc) { ctx.keepContentTab(`doc/${doc.id}`); }
```

A distribution can turn the whole behaviour off (`provideShellFeatures({ content: { preview: false } })`),
in which case `preview` is ignored and every open is permanent — so treat preview as a hint, not a
guarantee.

**Pinned tabs.** The permanence ladder has a top rung: `ctx.pinContentTab(path)` / `ctx.unpinContentTab(path)`
pin a tab to the **front** of its strip and guard it against accidental close (its close control becomes an
unpin control). Pinning also promotes a preview tab. It's a post-hoc action (not an open-time flag) and
survives a re-open. The host also has a double-click cycle on the tab (preview → keep → pin → unpin),
**on by default** and switchable off by the distribution.

Navigating to a dynamic route **without** opening it (a shared deep-link, browser history,
`navigateContent`) **auto-opens** its tab too — so shared links land with a proper tab, not just bare
content. If the tab is already open in **another pane** — a split, or a pane the user's workspace
declares — nothing is duplicated: that pane takes the address and activates the tab it already holds.
Give the route a default `title`/`icon` for that auto-opened tab; you can still refine it via
`openContentTab` (e.g. the real document name):

```ts
// src/lib/plugin/notes.plugin.ts — in activate(ctx)
ctx.registerSurface({ id: 'doc', title: 'doc.title', icon: 'document', component: DocView,
  routable: { path: 'doc/:id', title: 'Document', titleIsLiteral: true } });
```

> **Calling `ctx` from a component.** `ctx` is handed to `activate(ctx)`, but you usually open a
> document from a click *inside* a component (a tree/list) that holds no `ctx`. Bridge it with a tiny
> service the plugin fills at activation and the component injects:
>
> ```ts
> import { PluginContext } from '@loomweaver/plugin-sdk';
>
> class NotesNav {
>   private ctx?: Pick<PluginContext, 'openContentTab'>;
>   bind(ctx: Pick<PluginContext, 'openContentTab'>): void { this.ctx = ctx; }
>   unbind(): void { this.ctx = undefined; }
>   open(doc: { id: string; name: string }): void {
>     this.ctx?.openContentTab({ path: `doc/${doc.id}`, title: doc.name, titleIsLiteral: true });
>   }
> }
> export const notesNav = new NotesNav();
> // in activate(ctx):   notesNav.bind(ctx);
> // in deactivate():    notesNav.unbind();
> // the list component imports { notesNav } and calls notesNav.open(doc) in its click handler
> ```
>
> Use a **module-level facade** (a plain exported instance), not an Angular `@Injectable` filled via
> `inject()` inside `activate()`. Activation is *not guaranteed* to run in Angular's injection context.
> It re-runs, for instance, when the user re-enables your plugin at runtime. An `inject()` there can
> therefore throw. The in-repo the testbed weaver's `testbedContent` bridge is this exact pattern.
>
> (A trusted in-process component may also inject Angular's `Router` directly, but the bridge keeps the
> weaver on the public `ctx` surface — the same path a sandboxed plugin gets later.)

A route component reads its params the normal Angular way (`inject(ActivatedRoute)`), so `doc/:id`
resolves `id` itself. Don't draw your own top-level tab bar — open into the host strip; a **nested**
sub-tab bar *inside* one document's body (Edit | Preview) is fine, it's a level down.

**Nested sub-tabs — `subRoutes`.** A route's own level-2 tabs should live *in the route* (shareable,
back/forward, restored on reload), not in local state. Declare them with `subRoutes` and they become real
path segments under the route's tab root:

```ts
ctx.registerSurface({ id: 'doc', title: 'doc.title', component: DocView,
  routable: { path: 'doc/:id', subRoutes: ['code', 'preview'] } });
// → doc/main · doc/main/code · doc/main/preview   (the bare root is a valid state — no forced redirect)
```

The route's `path` stays the **tab root** (one host tab per document); switching a sub-route stays in that
tab and **preserves the parent's state** (edits, scroll). The host synthesizes the child routes — your
*parent* component stays mounted, renders a `<router-outlet />` (the children are empty stubs), reads
the active sub from the URL and navigates to `doc/<id>/<sub>` to switch.

A sub-route is written in Angular syntax, so a segment may **carry a value**:

```ts
routable: { path: 'programs/:programId', subRoutes: ['structure/:structureId', 'flows/:flowId'] }
// → programs/205470/structure/9178
```

And the bare tab root is a **valid address**: there is no redirect to the first entry, because that
cannot work once the first entry carries a value. Decide for yourself what an empty sub shows — a grid,
a marked first entry, an overview. Reading a value out of a sub-route works like the sub itself: take it
off the URL under your tab root (the sample below does exactly that), which also keeps working when the
host mounts you off-router and hands you the sub as a string instead. If you only ever run on the
router, `inject(ActivatedRoute).firstChild?.paramMap` is the Angular-native alternative.

A complete minimal component:

```ts
// src/lib/views/doc-view.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-doc-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <nav class="flex gap-2">
      @for (tab of ['code', 'preview']; track tab) {
        <button type="button" class="lw-btn lw-btn--ghost" (click)="openSub(tab)">{{ tab }}</button>
      }
    </nav>
    @if (sub() === 'code') { <p>code body…</p> } @else { <p>preview body…</p> }
    <router-outlet />
  `,
})
export class DocView {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly tabRoot = 'doc/' + this.id;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  // active sub = whatever stands under the tab root; you pick what an empty one means
  protected readonly sub = computed(() => {
    const path = this.url().split(/[?#]/)[0].replace(/^\/+/, '');
    return path.startsWith(this.tabRoot + '/') ? path.slice(this.tabRoot.length + 1) : 'code';
  });

  protected openSub(sub: string): void {
    void this.router.navigateByUrl('/' + this.tabRoot + '/' + sub);
  }
}
```

This is standard Angular nesting — deeper params work the same way. One extra fact matters as soon
as panes come in: when the host mounts your component **off-router** (a split pane, a sidebar tab, a
pop-out window), there is no URL to read — the host instead hands you a synthetic route whose
`data['sub']` carries the active sub-segment, and navigating the global router from there would be
wrong. [Sub-routes and pop-out windows](#sub-routes-and-pop-out-windows) shows the `hostMounted`
branch that handles it.

**Owning everything below your prefix — `rest`.** `subRoutes` is an enumeration: you name the level-2
segments and the host mounts one child per name. That stops working as soon as the segment carries a
value, and it says nothing about a third level. Declare `rest: true` instead and the deal changes: the
**longest registered prefix wins**, and whatever no more specific surface claims is handed to you as
**the rest** — verbatim, query string included.

```ts
ctx.registerSurface({ id: 'programs', title: 'programs.title', iframe: '/programs/view.html',
  routable: { path: 'cedents/:cedentId/programs', rest: true } });
// cedents/US003950/programs/205470/pricing?t=886320
//   → this surface, rest: "205470/pricing?t=886320"
```

Without the flag a deeper address matches no route at all and the navigation fails, so this is what
makes domain-first, deep addresses reachable. Three consequences worth knowing:

- **Your prefix stays the tab root**, so the whole subtree is *one* tab and moving around inside it
  never rebuilds your surface. That is the trade: what you put in the rest is cheap, what you put in
  the pattern is a parameter change and may rebuild you. You choose where the boundary sits.
- **A sandboxed surface** reads `state.rest` from its `render` push and sets its own with the channel's
  `navigate` — both confined to the prefix, each change an ordinary history entry. A **trusted**
  component reads it the ordinary Angular way (its child `ActivatedRoute`, or the router) and navigates
  with the router. Same declaration, different target.
- **A prefix shorter than two segments** (`cedents` rather than `cedents/:id/programs`) owns most of the
  address space, which is exactly where "the channel is confined to your own territory" stops being a
  confinement. Declaring `rest` there additionally requires the `navigation` capability, and
  registration fails loudly without it.

There is no forced default: an address with an empty rest is a valid state and you decide what it
shows — a grid, a marked first entry, an overview. Selecting your tab from the strip returns to the
bare prefix rather than the deepest address you were at; that address is otherwise fully shareable and
survives reload and back/forward.

**Tabs that follow the selection — `follows`.** Some tabs are not independent documents but
**facets of one choice**: pick a program on one, and the others should show that program. Declare
`follows: true` on such a surface and the host draws a **permanent facet tab** for it — labelled by the
surface's own `title`/`icon`, ordered by its `order` — and keeps that tab pointing at the current
selection. It knows the parameter values of the address it is on, because it knows which pattern
matched, and substitutes them **by name** into every following tab's pattern:

```ts
// on cedents/US003950/programs/205470/pricing
routable: { path: 'cedents/:cedentId/programs/:programId/treaties', follows: true }
// → the Treaties tab points at cedents/US003950/programs/205470/treaties
```

Where a value is unknown the address is truncated before it, which normally lands on a shorter address
another surface owns (`cedents`, if something is registered there). Where it lands nowhere, the facet
has nothing to point at yet and the host **leaves the tab out** rather than drawing a control that
cannot navigate — it reappears as soon as a selection exists.

Four things bound the feature deliberately:

- **Off by default.** The opposite is right for a tab showing one specific document: nobody wants an
  open quote rewritten because a parameter changed elsewhere — a tab opened by visiting keeps the
  address it was opened with.
- **A copy that leaves the pane carrying the browser address freezes.** Split a facet into another
  pane or pop it out and it keeps the address it had — which is how you park one program beside another.
- **A shared parameter name must mean the same thing.** Two following surfaces may only use the same
  name when the pattern *before* it is identical; otherwise the host would fill one surface's address
  with the other's value, so it refuses that one registration with a message. Surfaces that do not
  follow are never compared, so ordinary document routes like `ask/:id` and `doc/:id` are untouched.

Part of the mapping is domain knowledge the platform cannot have. A distribution supplies it with
[`provideTabAddressResolver`](building-a-distribution.md#following-tabs), and the platform's
substitution stays the default for every tab that resolver passes on.

**Switching arrangements.** `ctx.navigateContent(path)` just navigates — every open tab stays where it
is, and a target another pane already holds is reached there rather than copied into the current one. Whole-arrangement switching (a different set of tabs, panes and sidebar views) is the user's
**workspace** mechanism, not a navigation trick; a distribution ships ready-made arrangements with
`provideWorkspaces`. The component **instances** behind hidden tabs follow the retention rule:
destroyed while hidden unless the surface declares `retain: 'always'`; state that must survive belongs
in `VIEW_STATE`. Switching workspace hides rather than ends what the outgoing arrangement was
keeping, so a surface that declares `retain: 'always'` — an isolated one included, channel and all —
is found alive when its workspace is chosen again.
`registerSurface` needs `contributions`; `navigateContent`/`openContentTab`/`keepContentTab`/
`pinContentTab`/`unpinContentTab`/`closeContentTab` need the `navigation` capability.

**Reading which content is focused — `ctx.activeContent`.** A panel that reacts to the focused tab
(an inspector, a details view) reads the signal-shaped `ctx.activeContent()` (also `navigation`):
`{ surfaceId, path, params } | null`, with `params` extracted against your route pattern
(`ask/:id` on `ask/abc` → `{ id: 'abc' }`). Read this instead of injecting the host's router and
regex-parsing URLs — it stays stable across host URL-shape changes. Trusted rung only (a sandboxed
surface already receives its own state over the surface channel).

**Panes & tab groups.** The tabs you open aren't confined to one strip. Every pane is
a **tab group** with its own strip, and the user can rearrange them — **without any extra API from you**:

- **Drag a tab to a pane edge** to split the area, taking that tab into a new group; **drag it onto
  another group's strip** to move it there. Dropping the last tab out of a group collapses it. A tab's
  context menu offers **Split right / Split down** as the keyboard/touch equivalent.
- A pane **holding no tabs** — the content area before anything is open — takes the whole drop instead
  of offering edges, so a dragged tab fills it rather than splitting it against an empty half. The
  highlight while dragging spans the whole pane, which is exactly what the drop will do.
- Dragging **moves** a tab (never copies) — the source group loses it. This holds for every tab,
  including parameterised (`doc/:id`) and sandboxed iframe routes: exactly one pane is the **URL pane**
  (it drives the deep link and back/forward), and moving a routed tab hands that role to its new pane.
- The **sidebars are the same tab groups**, just shown as **icon tabs** — a view can be dragged into the
  centre (it becomes a titled tab beside your documents) and a document into a sidebar, and back.

None of this changes your contract: you keep contributing routes and views the same way; the host
provides the pane/tab behaviour on top. Reload restores the whole arrangement.

**Context menus.** Add an item to a host menu slot with `ctx.registerMenuItem` (capability `contributions`).
It names a {@link Command} by id (invoked with the menu's context) and may declare a coarse `when` filter —
the item shows only when every `when` key equals the same key in the opener's context. The host draws the
menu; a right-click on the content tab strip opens the `content/tab/context` slot with
`{ targetKind, tabId, pinned, closable }`:

```ts
ctx.registerCommand({ id: 'my.tab.reveal', title: 'my.tab.reveal', run: (ctx) => reveal(ctx?.tabId) });
ctx.registerMenuItem({ menu: 'content/tab/context', command: 'my.tab.reveal', group: '3_plugin', when: { closable: true } });
```

The host's own tab actions (Close, Close Others/All/to-the-Right, and a "Pinned" checkbox) live in the same
slot — your item joins them. Command behaviour crosses the sandbox boundary because it is referenced by
**id** (the context is plain, serialisable data); an inline `run` on a menu item is trusted, in-process only.

A menu item may carry its own optional `id`: re-registering that id **replaces** the entry (last-in wins),
the same rule as every other contribution. The built-in entries use `menu:<commandId>` ids
(e.g. `menu:shell.tab.closeAll`), so a distribution can hide or swap a standard entry — see
[building a distribution](building-a-distribution.md). Without an `id` your item is purely additive.

A menu item shows its referenced command's **icon** and **keyboard-shortcut** hint automatically. Add
`checkedWhen` to make it a **checkbox** (`role="menuitemcheckbox"`) — it is checked when `checkedWhen` is a
subset of the opener's context, so one toggle item replaces a Pin/Unpin pair (the command reads the state
from the context and flips it):

```ts
ctx.registerCommand({
  id: 'my.tab.togglePin',
  title: 'my.tab.pinned',
  // `context` is optional and its values are `string | number | boolean` — narrow before use.
  run: (c) => {
    const tabId = String(c?.['tabId'] ?? '');
    if (!tabId) return;
    if (c?.['pinned']) unpin(tabId);
    else pin(tabId);
  },
});
ctx.registerMenuItem({ menu: 'content/tab/context', command: 'my.tab.togglePin', when: { closable: true }, checkedWhen: { pinned: true } });
```

**Item-attached menus (any region).** A context menu is not tied to the tab strip — a `RailItem`,
`BarButtonItem` or `ViewAction` can carry a `menu?: string` slot, and the host opens it on right-click with a
`{ targetKind, id, region }` context. Contribute items to that slot the same way; e.g. the
built-in view-tab menu offers "Move to other sidebar". One mechanism, every region.

**A menu on the plain click.** A `RailItem` or a `BarButtonItem` may add
`menuTrigger?: MenuTrigger` — `'context'` (the default, the right-click above), `'primary'` or
`'both'` — to say which gesture opens its slot. With `'primary'` or `'both'` the menu opens when the
item is activated, by click, Enter or Space alike, anchored beside the control the host drew and
flipped to its other side rather than covering it. That is the account entry a workbench with a
signed-in user needs:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'activity', anchor: 'bottom', icon: 'user', initials: 'AR',
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
});
ctx.registerMenuItem({ menu: 'notes.account/menu', command: 'notes.signOut', group: '9_session' });
```

Add `menuHeader: { title, detail?, icon?, initials? }` and the host draws a heading above the first
entry, which is where the name belongs when the control itself is a two-letter badge:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'activity', anchor: 'bottom', icon: 'user', initials: 'AR',
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
  menuHeader: { title: displayName, detail: emailAddress, initials: 'AR' },
});
```

The heading is not an entry: nothing activates it, the arrow keys pass over it the way they pass over
a separator, and the menu is announced by what it names, so the name reaches the user once rather
than twice. A menu opened at the pointer carries none, because what it acts on is under the pointer.

**A picture where you have one.** A launcher entry, a bar button and a menu heading all take
`image`, anything an `<img>` accepts, drawn round in place of the icon and the initials:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'activity', anchor: 'bottom', icon: 'user', initials: 'AR',
  image: person.avatarUrl,
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
  menuHeader: { title: person.name, detail: person.email, initials: 'AR', image: person.avatarUrl },
});
```

The ladder is picture, then initials, then icon, and **the host falls back**: a picture that is
missing or that fails to load leaves the control looking exactly as it would without one, so you do
not have to handle the ordinary case of a person having no photograph. Re-register the item with the
same id when the picture arrives and the rail redraws.

The same two fields sit on a bar button, so the account can live in a bar rather than in the rail;
the host derives which way its menu opens from the bar's own edge, downwards from a top bar, upwards
from a status bar, sideways from a bar docked left or right.

The workbench does not fetch anything for you: the address is yours, and a picture served from
another origin has to be allowed by your own content policy. The picture is decoration, so the entry
stays announced by its title and the menu by its heading, rather than naming the person twice.

Activation offers **your** slot alone: the workbench's own entries for that item, the ones that hide
it or move it to the other rail, stay on the right-click, where a curation entry beside "Sign out"
would be noise. Such an item needs no `command` or `run`, and the host draws it without one; where it
names one anyway the menu wins and a development-mode message names what is never run. On an item
carrying `workspace:` the click is the switch, so its menu keeps the right-click. The host owns the
rest: it announces the control as opening a menu, tracks whether it is open, and returns focus to it
when the menu is dismissed.

**The browser's own menu stays where nobody draws one.** Only the element that opens a menu suppresses
the native context menu; everywhere else — your view body, and above all a text field inside it — a
right-click still gives the user cut, copy, paste and spellcheck. Draw your own only where you mean to
replace it.

**Your own surface menu (sandbox).** Inside your own sandboxed `iframe` surface you draw the menu yourself:
load the [frame UI kit](#the-frame-ui-kit) (`/frame-kit/lw-elements.global.js` defines `<lw-menu>`
along with the rest of the family), build `<lw-menu>` + `<lw-menu-item>` on right-click,
`menu.openAt(event.clientX, event.clientY)`, and handle the selection **in-process** — no cross-frame
coordinates, no RPC. The paint follows the host tokens pushed to the surface, so it matches the app theme.

**Surface presentation — `component` or `iframe`.** A surface renders either from an Angular `component`
(the trusted, in-process form above) or from an `iframe` URL, and that choice is independent of whether a
URL points at the surface:

```ts
ctx.registerSurface({ id: 'report', title: 'report.title', iframe: '/my-plugin/report.html',
  routable: { path: 'report/:id' } });
```

The `iframe` form is how a **sandboxed, non-Angular** plugin contributes a content view — the host mounts
the URL in an isolated `<iframe sandbox>` (own JS context, no host access). A plain string, it serialises
across the `ctx`-RPC boundary, unlike an Angular class. For a **sandboxed** plugin the URL must be
**same-origin** (served by the distribution, like the plugin itself) — a foreign origin, `javascript:` or
`data:` URL is rejected at the RPC seam, so an untrusted plugin cannot point the host chrome wherever it
likes. A sandboxed surface may be **docked** (`docks`) as well as routable, and it may declare a
`container`; the seam rejects `access` instead of silently dropping it, because a sandboxed surface gates
itself from the session state the host pushes. A **trusted** plugin may use the same `iframe` form to embed a foreign origin on purpose (a
dashboard, a docs site, a video); there the distribution decides what may be framed through its CSP
`frame-src`, which the browser enforces. The tab strip works identically — it only sees the
`path`. This is the first sandbox rung; see
[building a distribution](building-a-distribution.md#frame-plugins) for wiring a sandboxed
plugin, and the ADRs for the isolation model. Trusted in-process weavers keep using `component`.

An iframe surface is a first-class content view: the host gives it a small two-way channel (Penpal). The
host **pushes** the active UI language, the active sub-route segment, the preview state, and the
resolved light/dark **theme**. A sandboxed iframe has none of the host's `--lw-*` tokens, so the host
also pushes the **full resolved `--lw-*` token values plus the root font size**. Apply them with
`LwFrame.applySurfaceState` — see [The frame UI kit](#the-frame-ui-kit). With this the surface
can localise, reflect its own level-2 sub-tabs and match the theme **without reloading**;
the surface can **call back** `navigate('<path>')` to drive the router, so its sub-tabs are shareable and
browser-navigable. Surface navigation is confined to the route's **own tab root** (its sub-routes) — the
surface channel carries no capability grant, so anything beyond the plugin's own view goes through the
plugin (logic) channel's `ctx.navigateContent` (the `navigation` capability). The channel is opt-in — a
static iframe that never connects just renders. (A worked example ships in the testbed weaver distribution's
`sandbox-rpc` plugin.)

**A docked iframe surface.** The same `iframe` form works at a dock, so a surface that is not routable can
still be an iframe:

```ts
ctx.registerSurface({ id: 'notes.frame', title: 'notes.frame.title',
  docks: ['secondary'], iframe: '/my-plugin/panel.html' });
```

It receives the same pushed state, with two differences that follow from having **no address**: its `tab`
is always empty (there is no tab root and no sub-route to reflect), and `navigate` is a **no-op with a
development warning** rather than an error — the channel is only safe because it is confined to the
surface's own tab root, and a docked surface has none. To move the user somewhere, go through the plugin
channel's `ctx.navigateContent` (the `navigation` grant). The pushed state also carries an `instanceId`:
the pane or named instance this mount belongs to, so two mounts of the same surface can keep their own
per-instance data apart, and `params` — the route params for a routable surface, and the container's
`:id` for a **container child**, which is how an iframe child learns which container it is inside
(a component child injects the same values off its route).

### The sandbox bootstrap — how a sandboxed plugin gets `ctx`

A sandboxed plugin is **two documents**, and knowing which is which is half the model:

- the **entry (logic) document** — the `entryUrl` the distribution composes or the catalog lists.
  The host loads it in a *hidden* sandboxed iframe; it never renders. Its whole job is the Penpal
  handshake: connect to the parent, receive `ctx`, make your registrations.
- the **view (surface) document(s)** — the `iframe:` URL(s) your `registerSurface` calls point at.
  These are the visible surfaces; they load the [frame UI kit](#the-frame-ui-kit) below and
  receive pushed state (`render`) instead of holding a `ctx`.

A complete, working entry document (this is the in-repo `sandbox-rpc` plugin, trimmed):

```html
<!-- plugin.html — the entryUrl document; loads the transport, then your logic -->
<!doctype html>
<meta charset="utf-8" />
<script src="/frame-kit/penpal.global.js"></script>
<script src="/my-plugin/plugin.js"></script>
```

```js
// plugin.js — handshake with the host, then register through the RPC ctx
const messenger = new Penpal.WindowMessenger({
  remoteWindow: globalThis.parent,
  allowedOrigins: ['*'], // the sandboxed iframe has an opaque origin; isolation comes from the sandbox attribute
});

Penpal.connect({ messenger })
  .promise.then((ctx) =>
    Promise.all([
      ctx.toast({ message: 'Hello from the sandbox', kind: 'success', timeoutMs: 4000 }),
      ctx.registerSurface({
        id: 'my-plugin.view',
        title: 'My view',
        iframe: '/my-plugin/view.html', // same-origin — the visible surface document
        routable: { path: 'my-plugin' },
      }),
    ]),
  )
  .catch((error) => console.error('[my-plugin] activation failed', error));
```

The RPC `ctx` is **flat** — unlike the in-process `ctx` on the rest of this page there is no `ctx.ui`
facade: the endpoints are `registerSurface` · `registerMenuItem` · `registerSettingsSection` ·
`navigateContent` · `openContentTab` / `keepContentTab` / `pinContentTab` / `unpinContentTab` /
`closeContentTab` · `revealSurface` · `toast`. Every call runs through the same default-deny
capability broker as a trusted plugin — an ungranted capability rejects, so `.catch` and degrade.
(Generate this whole layout with `nx g @loomweaver/devkit:sandbox-plugin` or the MCP
`scaffold_frame_plugin` — see [scaffolding](scaffolding.md).)

### The frame UI kit

A sandboxed **surface** (the view document) does not import `@loomweaver/shell` — instead the **distribution
serves the frame UI kit** (`@loomweaver/frame-kit`) same-origin under the well-known path
`/frame-kit/`, and your surface references it:

```html
<link rel="stylesheet" href="/frame-kit/lw-frame.css" />
<script src="/frame-kit/penpal.global.js"></script>
<script src="/frame-kit/lw-elements.global.js"></script>
```

- **`lw-elements.global.js`** defines the whole `<lw-*>` element family (`lw-tooltip` ·
  `lw-select`/`lw-option` · `lw-menu`/`lw-menu-item` · `lw-button` · `lw-markdown` · `lw-icon` ·
  `lw-progress-ring`) with the built-in icon set seeded — the same behaviour source the host runs. It
  also exposes `globalThis.LwFrame`: `setIcon(name, svg)` / `removeIcon` / `hasIcon` for
  plugin-own icons (sanitized), and `applySurfaceState(state)` — call it from your `render` handler
  and the pushed tokens, root font size and light/dark theme are applied for you.
- **`lw-frame.css`** is the host's `.lw-*` class contract compiled to plain CSS on `var(--lw-*)`
  (with light/dark fallbacks for the blink before the first push) — no hand-kept CSS mirror.
- **`penpal.global.js`** is the RPC transport (`globalThis.Penpal`).

The kit is versioned **with the distribution's shell** — you reference it, you do not vendor it, so
your paint always matches the host the plugin actually runs in. For development outside a
distribution, copy the files from the `@loomweaver/frame-kit` npm package.

**Writing the surface in TypeScript.** The package ships `dist/lw-frame.d.ts`, a description of the
global the script installs. It is an ambient declaration rather than a module, because you load the
kit with a `<script>` tag and never import it — so you reference it once and `LwFrame` is typed
everywhere:

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["@loomweaver/frame-kit"] } }
```

A wrong method name or a wrong argument is then reported while you write it, instead of failing as
`undefined is not a function` inside a frame you cannot easily inspect. Nothing about the surface
changes: plain HTML with a script tag stays exactly as valid, and the declaration is emitted from the
same source the bundle is built from, so the two cannot disagree. What it describes:

- **`LwFrameApi`** — the shape of `globalThis.LwFrame` itself: the icon methods, `applySurfaceState`,
  `connectState` and the `state` store.
- **`LwSurfaceRenderState`** — what the host pushes to your `render` handler: theme, design tokens,
  root font size and the product's replacement glyphs. Hand it to `applySurfaceState` unchanged.
- **`LwStateApi`** — the surface half of `ctx.state`: `watch(key)` for a handle, and `apply(...)` to
  feed the host's `stateChanged` push in from your `methods`.
- **`LwStateHandle`** — one key's handle: `value` · `loaded` · `set` · `clear` · `dispose`, plus
  `onChange` so you can re-render. It mirrors what a trusted plugin holds, so the store reads the
  same on both rungs of the isolation ladder.
- **`LwStateHost`** — the host methods your Penpal connection exposes for the store. You pass the
  resolved connection to `connectState`; you do not call these yourself.

**Distributing through a plugin store.** A sandboxed plugin needs nothing extra to be store-installable:
a distribution lists it in its [plugin catalog](building-a-distribution.md#plugin-store-runtime-install)
(id, entry URL, display metadata) and users install it at runtime. Two things matter to you as the author. First, **declare your capabilities honestly**. The install
dialog shows exactly the declared set to the user, and accepting grants exactly that. An undeclared
capability is never granted; a declared one the user can still revoke later. Second, expect your files
to be **copied into the product's own origin**. The store is same-origin by design, so getting listed
means passing the operator's review, not hosting anything yourself. Ship a **README.md** with your plugin: the operator copies it into the store next
to your files and the store's detail pane renders it in-app — it is your plugin's storefront page.
(The the testbed weaver distribution's `store-full` plugin is the worked example.)

**Shipping a new version.** Updates ride on the catalog's `version` field: the operator raises it
together with your files, and every installed user is offered an update that swaps the entry and
respawns your plugin live. Two consequences for you: keep the version **monotonic** (segments are
compared numerically, `1.10.0` beats `1.9.0`; only a strictly newer version is offered), and know
that a version which **declares capabilities the user never consented to** asks for consent again,
listing exactly the added ones — so growing your declaration is safe but never silent.

**Frame-plugin settings — declare data, the host renders and stores.** A sandboxed plugin can contribute
a settings section over RPC, but in a **data-only** form: each row declares a control kind and its **default value** instead of `value()`/`set()`
callbacks, which cannot cross the wire. The host renders the controls. It also owns the storage (user-local
through the distribution's settings store). It **pushes the current values back** by calling the
`settingsChanged(sectionId, values)` method you expose on your RPC channel. That call comes once after
registration with the restored state, then on every change — **including a change made in another
browser window**. Plugin settings ride the shell's cross-tab sync, so every window's copy stays
current; there is nothing to wire. Labels may be plain literals (you cannot contribute
translations). The host decides where your section appears: an *installed* plugin's section lands
under the **"Community plugins"** nav group, a composed frame plugin's under **"App plugins"** —
never your choice, so nothing can masquerade as the app.

```js
ctx.registerSettingsSection({
  id: 'prefs',
  title: 'My plugin',
  rows: [
    { id: 'greeting', label: 'Greeting', control: { kind: 'text', value: 'Hello' } },
    { id: 'loud', label: 'Shout', control: { kind: 'toggle', value: false } },
    // also: { kind: 'select', value, options: [{ value, label }] } · { kind: 'slider', value, min?, max?, step? }
  ],
});
```

The host calls the `settingsChanged` method you expose on your side of the
[bootstrap handshake](#the-sandbox-bootstrap--how-a-sandboxed-plugin-gets-ctx):

```js
Penpal.connect({
  messenger,
  methods: {
    settingsChanged(sectionId, values) {
      // called once with the restored state after registration, then on every change
    },
  },
});
```

## Commands — one behaviour, many triggers

A `Command` is the named action that rail items, bar buttons, view actions, keybindings and the
command palette all point at by `id`. Register the behaviour once; reference it everywhere.

```ts
ctx.registerCommand({
  id: 'notes.add',
  title: 'notes.add',
  icon: 'add',
  shortcut: 'mod+enter',        // chord: mod = ⌘ on macOS, Ctrl elsewhere
  run: () => store.add(),
});
```

Now any item can trigger it with `command: 'notes.add'` instead of its own `run()` — and the palette
(`mod+k`) and the shortcut reach the same behaviour.

A command can also take **described arguments**, **answer with a result**, and be **opened to a caller
that is not the user** — another plugin, a script, an assistant driving the app — so that nobody has
to build a second list of your actions beside this one. It is closed to such callers until it says
otherwise. See [callable commands](reference/callable-commands.md), and, where that caller is an
AG-UI agent, [agent tools](reference/agent-tools.md) for the adapter that describes your commands to
it and runs what it asks for, so you write no dispatch of your own.

## Rail & bar items — command triggers in the chrome

The **rail** (activity bar) holds independent command triggers; a **bar** (top/status) holds
components or declarative buttons.

```ts
// Rail item → triggers a command. Pin settings to the bottom.
ctx.registerRailItem({ id: 'notes.settings', rail: 'activity', icon: 'settings',
  title: 'notes.settings', anchor: 'bottom', run: () => ctx.ui.openSettings() });

// Declarative status-bar button — the host paints button + tooltip from data (no component).
// `showShortcut: true` renders the bound command's shortcut hint (OS-correct, ⌘↵ / Ctrl+Enter) —
// only when the command declares a `shortcut`.
ctx.registerBarItem({ id: 'notes.add.btn', bar: 'status-bar', slot: 'start', order: 1,
  icon: 'add', tooltip: 'notes.add', command: 'notes.add', showShortcut: true });

// Or a component-backed bar item, for full control of the cell (e.g. a live count).
ctx.registerBarItem({ id: 'notes.count', bar: 'status-bar', slot: 'start', component: NotesCount });
```

Bar slots are `start | center | end`; rail items anchor `top` (default) or `bottom`.

## Auth-aware access gating — `access`

Your contributions can react to the signed-in user's login state and roles, without the platform owning
any authentication. LoomWeaver only reacts to a session snapshot the **distribution** supplies (see
[building a distribution](building-a-distribution.md)); a weaver just declares an `access` requirement on
a contribution and the host hides, disables or blocks it. Roles are opaque strings — the host
matches, never interprets. The snapshot's claim bag reaches neither your `access` requirements nor
`ctx.session`; only the login state and the roles do.

```ts
// Rail item only an admin sees (default: hidden when unmet).
ctx.registerRailItem({ id: 'notes.admin', rail: 'activity', icon: 'settings',
  title: 'notes.admin', command: 'notes.admin', access: { anyRole: ['admin'] } });

// View action visible but inert until someone is signed in (disable mode) — actions are not
// registered separately, they ride in the surface's `actions` array:
ctx.registerSurface({ id: 'notes.list', title: 'notes.list', docks: ['primary'], component: NotesList,
  actions: [{ id: 'notes.sync', icon: 'upload', title: 'notes.sync', command: 'notes.sync',
    access: { authenticated: true, mode: 'disable' } }] });

// A command is blocked at the one execute() seam — its keybinding no-ops and the command palette
// omits it — until the requirement is met.
ctx.registerCommand({ id: 'notes.purge', title: 'notes.purge', access: { anyRole: ['admin'] },
  run: () => purge() });

// A whole content route: unmet → the host shows a neutral "sign-in required" placeholder at the
// same URL, and the route is not offered in the New-Tab pane picker (the surface appears in both
// once the session qualifies, no reload).
ctx.registerSurface({ id: 'admin', title: 'admin.title', component: AdminView,
  access: { anyRole: ['admin'] }, routable: { path: 'admin' } });
```

`access` fields: `authenticated?` (must be signed in / only-anonymous), `anyRole?` (at least one),
`allRoles?` (every), and `mode?: 'hide' | 'disable'` for chrome items (default `hide`). `mode` is
ignored where an item is inherently present-or-not (a whole view, a command, a route). **Client-side
gating is presentation, not security** — enforce for real on your server; a hidden control is not a
boundary. Gating is orthogonal to plugin **capabilities** (what your plugin may do): a granted plugin
can still gate an individual contribution by user role.

For **imperative** self-gating (branching your own logic, or gating your own view body), read the session
through `ctx.session` — the counterpart to declarative `access`, gated by the `session` capability:

```ts
// src/lib/plugin/session.ts — a module-level facade your components inject
// signal-shaped, so a template/computed re-reads reactively on login/logout
ctx.session.authenticated();   // boolean
ctx.session.roles();           // readonly string[] (opaque tokens)
ctx.session.hasRole('admin');  // convenience
```

Components hold no `ctx`, so hand the session through the same module-level bridge as any other
`ctx` piece (see ["Calling `ctx` from a component"](#content-area--routes--tabs)):

```ts
// bridge:  in activate(ctx): notesSession.bind(ctx.session);
export const notesSession = { session: undefined as PluginSession | undefined,
  bind(s: PluginSession): void { this.session = s; } };

// in a component — reactive, because PluginSession is signal-shaped:
protected readonly canPurge = computed(() => notesSession.session?.hasRole('admin') ?? false);
```

A **sandboxed** surface has no `ctx` in its own frame, so the host *pushes* the session into the surface
state instead. The same capability gates it: declare `session` (and have it granted) or the host omits
the field, and your surface sees `state.session === undefined`. That is deliberately **not** a signed-out
snapshot — "not granted" and "signed out" are different facts, so read it defensively
(`state.session?.roles ?? []`) and draw nothing session-dependent when it is absent. Revoking the
capability at runtime stops the push live, without a reload.

The **login UI itself is yours**, not the platform's — and the platform never opens it on its own.
Unmet chrome simply hides or disables; only a gated **content route** actively sends the visitor
anywhere, and only if the distribution registered a redirect. So a login has two shapes, and both are plain weaver contributions. A login **page** is an ungated
routable surface:
`ctx.registerSurface({ id: 'login', title: 'login.title', routable: { path: 'login' }, component: MyLoginView })`.
The distribution's `provideUnauthorizedRedirect` points gated routes at it. A login **dialog**
opens from your own entry point through `ctx.ui.open(MyLoginDialog)`. Either way its "sign in"
action calls your product's auth service, which updates the session snapshot the distribution feeds
to the platform — the whole shell re-gates reactively, no reload (**signing out** just resets that
snapshot to anonymous). Complete, copyable components for both shapes — including the
`?from=` return-path round trip — live in
[building a distribution → Auth integration](building-a-distribution.md#auth-integration-access-gating).

## Custom icons — `ctx.contributeIcons`

`icon` is a host-registry name. The shell ships a small first-party set (`add`, `search`, `settings`,
`outline`, `document`, …); your domain needs more (`graph`, `upload`, …). Contribute your own names at
activation, then reference them like any other icon. Names are **first-wins**: a name the shell already
ships (like `document`) cannot be overridden — pick unique, ideally prefixed names. Only the product
itself may replace a shipped glyph, with `provideIcons`; when it does, the replacement reaches your
view too, so `<lw-icon name="trash">` draws the product's glyph rather than ours:

```ts
ctx.contributeIcons({
  // name → raw SVG string (an @ng-icons export, or hand-authored markup)
  notesGraph: '<svg viewBox="0 0 24 24" ...>…</svg>',
});

ctx.registerSurface({ id: 'notes.list', title: 'notes.list.title', docks: ['primary'],
  icon: 'notesGraph', component: NotesListView });   // ← your contributed name
```

Names are flat and **collision-safe**: a name already registered by the shell or another plugin is
ignored (first-wins, dev-warned), so pick unique names. Contributed SVG is **sanitized at registration**
(DOMPurify, SVG profile) — `<script>`, event handlers and `javascript:` hrefs are stripped, and an icon
whose markup does not survive sanitization is dropped (dev-warned); ship plain vector markup. The host
paints the icon wherever your contribution appears (rail/bar/view/command), and you can also render a
contributed (or first-party) name **in your own view body** with `<lw-icon name="…">` — see
[design tokens](reference/design-tokens.md).

## Custom theme — `ctx.contributeTheme`

Contribute `--lw-*` design tokens to re-skin the whole app — host chrome **and** every plugin, since
all read the same tokens. The vocabulary covers colors **and** the UI font
(`--lw-font-sans` / `--lw-font-mono`). Requires the `theme` capability. Only whitelisted `--lw-*` names
apply; unknown names are ignored (dev-warned). The returned `Disposable` removes exactly these tokens
and the app reverts — so a theme can be toggled on and off. (Font *size* is a user preference, not a
theme token.)

```ts
manifest: { id: 'ocean', name: 'Ocean', capabilities: ['theme'] },
activate(ctx) {
  const handle = ctx.contributeTheme(
    {
      '--lw-brand': '#0e7490',
      '--lw-brand-strong': '#0c5a70',
      '--lw-accent': '#f59e0b',
      '--lw-surface': '#f0fdff',
      '--lw-font-sans': "'Inter', system-ui, sans-serif",
    },
    // Optional: override only what differs in dark mode.
    { '--lw-surface': '#04222b' },
  );
  // handle.dispose() reverts the app to the product/tenant theme.
}
```

The first argument applies in **both** light and dark mode. Pass the optional second `dark` map to
override specific tokens only when dark mode is active — tokens absent from it keep their base value
across both modes, so you only list what actually differs (typically surfaces and content colors).

Precedence is **Product default < Plugin < Tenant**: a plugin themes freely, but a token the tenant
(the distribution's own branding CSS) explicitly set is never overridden. See
[design tokens](reference/design-tokens.md) for the token vocabulary and cascade layers.

A theme contribution is **live per-window session state**, not a stored setting — it does not cross
either persistence port, so it neither survives a reload nor rides [cross-tab sync](building-a-distribution.md#cross-tab-live-sync)
on its own. If you want a theme toggle to persist and mirror across windows, persist your own on/off
flag and re-apply it — the testbed weaver's theme toggle does exactly this (`testbed-theme.ts`, trimmed):

```ts
const STORAGE_KEY = 'my.theme.enabled';
let contribution: Disposable | undefined;
let announce: ((key: string) => void) | undefined;

function apply(ctx: PluginContext): void {
  contribution?.dispose();
  contribution = undefined;
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    contribution = ctx.contributeTheme({ '--lw-brand': '#ea580c' });
  }
}

// in activate(ctx):  apply(ctx)  — the flag survives the reload, the contribution is re-made
// in your toggle:    write the flag, apply(ctx), then announce?.(STORAGE_KEY) for cross-tab sync
// the distribution opts the key into sync: myTheme.connectSync = ({ announce: a }) => {
//   announce = a; return { key: STORAGE_KEY, refresh: () => apply(boundCtx) }; }
```

## Host UI — `ctx.ui`

Dialogs and toasts, brokered so you never import host services directly. `message` fields are
Markdown.

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

## Settings sections

Contribute a section to the host settings surface (opened via `ctx.ui.openSettings()`). Each control
**owns its own storage** — the host only reads `value()` and calls `set()`, so the platform never
persists your data.

```ts
ctx.registerSettingsSection({
  id: 'notes.settings',
  title: 'notes.name',
  group: 'settings.group.plugins',   // left-nav group ("App plugins" — the plugins shipped with the app)
  order: 100,
  rows: [
    { id: 'notes.sort', label: 'notes.sort.label', control: {
        kind: 'select',
        options: [{ value: 'az', label: 'notes.sort.az' }, { value: 'date', label: 'notes.sort.date' }],
        value: () => store.sort(),          // a signal works directly
        set: (v) => store.setSort(v),       // you decide how/where to persist
    } },
    { id: 'notes.wrap', label: 'notes.wrap.label', control: {
        kind: 'toggle', value: () => store.wrap(), set: (v) => store.setWrap(v),
    } },
    { id: 'notes.size', label: 'notes.size.label', control: {
        kind: 'slider', min: 12, max: 20, step: 1, value: () => store.size(), set: (v) => store.setSize(v),
    } },
    { id: 'notes.about', label: 'notes.aboutRow', control: {
        kind: 'button', label: 'notes.about', run: () => ctx.ui.open(NotesAboutDialog, { data: ctx.host }),
    } },
  ],
});
```

Control kinds: `select` (single choice), `toggle` (on/off), `text` (a string field, `inputType?`/
`placeholder?`), `slider` (a number, `min`/`max`/`step`), `button` (an action — inline `run`, or
`command: '<id>'` to reuse a registered command so the palette/keybindings share it), `component`
(embed your own widget). Each value control owns its `value()`/`set()`.

## i18n

Titles/labels are **translation keys** resolved by the host's Transloco. Ship your weaver's strings
as a **namespace**: the distribution registers `provideTranslationNamespaces('notes')` and serves
`/i18n/notes/{lang}.json`; your keys then live under `notes.*` and can never collide with host keys.
The file itself does **not** repeat the namespace — the loader nests it under the name:

```jsonc
// /i18n/notes/en.json                      resolved keys
{
  "list": "Notes",                       // → notes.list
  "admin": "Admin tools"                 // → notes.admin
}
```

A literal string with no matching key renders as-is, so you can start with literals and add i18n
later. (See [building a distribution](building-a-distribution.md#i18n) for the wiring.)

**Body text is yours.** The host resolves keys only for **contribution metadata** — view/command/item
titles, settings labels, the tagline — so `ctx` deliberately has no translate function for the free text
*inside* your views and dialogs. Keep that text as literals, or import `@jsverse/transloco` directly if you
need runtime language switching inside the body. That import is the one documented exception to
"a weaver imports only `@loomweaver/plugin-sdk`": Transloco is a third-party library you depend on yourself,
not a LoomWeaver API — the platform contract stays exactly the SDK's exports.

---

**Next:** [Building a distribution](building-a-distribution.md) — compose your weaver into a product.
