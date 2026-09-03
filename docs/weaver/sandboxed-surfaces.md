# Sandboxed surfaces

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-sandbox` · `surfaces`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

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
[building a distribution](../distribution/frame-plugins.md) for wiring a sandboxed
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

## The sandbox bootstrap — how a sandboxed plugin gets `ctx`

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
`scaffold_frame_plugin` — see [scaffolding](../scaffolding.md).)

## The frame UI kit

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
a distribution lists it in its [plugin catalog](../distribution/plugin-store.md)
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

## Where next

- [Authoring a weaver](../authoring-a-weaver.md): the map of these pages.
- [Samples](../samples.md): complete recipes to copy.
