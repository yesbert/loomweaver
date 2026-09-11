# Sandboxed surfaces

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `plugin-sandbox` · `surfaces`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A sandboxed surface is an `iframe` the host mounts in isolation, which is how a plugin written in any
technology contributes a view. This page declares one, routable or docked, shows how a sandboxed
plugin gets its `ctx`, and introduces the frame UI kit its surfaces paint with. It closes with what a
plugin needs once a store distributes it: an honest capability declaration, a monotonic version and
data-only settings.

## Presentation: `component` or `iframe`

A surface renders either from an Angular `component` (the trusted, in-process form, see
[The content area](content-area.md)) or from an `iframe` URL. That choice is independent of whether a
URL points at the surface:

```ts
ctx.registerSurface({ id: 'report', title: 'report.title', iframe: '/my-plugin/report.html',
  routable: { path: 'report/:id' } });
```

The `iframe` form is how a **sandboxed, non-Angular** plugin contributes a content view: the host mounts
the URL in an isolated `<iframe sandbox>` (own JS context, no host access). A plain string, it serialises
across the `ctx`-RPC boundary, unlike an Angular class. For a **sandboxed** plugin the URL must be
**same-origin** (served by the distribution, like the plugin itself). A foreign origin, `javascript:` or
`data:` URL is rejected at the RPC seam, so an untrusted plugin cannot point the host chrome wherever it
likes. A sandboxed surface may be **docked** (`docks`) as well as routable, and it may declare a
`container`. The seam rejects `access` instead of silently dropping it, because a sandboxed surface gates
itself from the session state the host pushes. A **trusted** plugin may use the same `iframe` form to
embed a foreign origin on purpose (a dashboard, a docs site, a video). There the distribution decides
what may be framed through its CSP `frame-src`, which the browser enforces. The tab strip works
identically, since it only sees the `path`. This is the first sandbox rung; see
[building a distribution](../distribution/frame-plugins.md) for wiring a sandboxed
plugin, and [Capabilities and trust](../concepts/capabilities-and-trust.md) for the isolation model.
Trusted in-process weavers keep using `component`.

An iframe surface is a first-class content view: the host gives it a small two-way channel (Penpal). The
host **pushes** the active UI language, the active sub-route segment, the preview state, and the
resolved light/dark **theme**. A sandboxed iframe has none of the host's `--lw-*` tokens, so the host
also pushes the **full resolved `--lw-*` token values plus the root font size**. Apply them with
`LwFrame.applySurfaceState` (see [The frame UI kit](#the-frame-ui-kit)). With this the surface
can localise, reflect its own level-2 sub-tabs and match the theme **without reloading**;
the surface can **call back** `navigate('<path>')` to drive the router, so its sub-tabs are shareable and
browser-navigable. Surface navigation is confined to the route's **own tab root** (its sub-routes).
The surface channel carries no capability grant, so anything beyond the plugin's own view goes through
the plugin (logic) channel's `ctx.navigateContent` (the `navigation` capability). The channel is
opt-in: a static iframe that never connects just renders. (A worked example ships in the testbed's
`sandbox-rpc` plugin.)

## A docked iframe surface

The same `iframe` form works at a dock, so a surface that is not routable can still be an iframe:

```ts
ctx.registerSurface({ id: 'notes.frame', title: 'notes.frame.title',
  docks: ['right-panel'], iframe: '/my-plugin/panel.html' });
```

It receives the same pushed state, with two differences that follow from having **no address**. Its
`tab` is always empty, because there is no tab root and no sub-route to reflect. And `navigate` is a
**no-op with a development warning** rather than an error: the channel is only safe because it is
confined to the surface's own tab root, and a docked surface has none. To move the user somewhere, go
through the plugin channel's `ctx.navigateContent` (the `navigation` grant). The pushed state also
carries an `instanceId`: the pane or named instance this mount belongs to, so two mounts of the same
surface can keep their own per-instance data apart. It carries `params` as well: the route params for a
routable surface, and the container's `:id` for a **container child**, which is how an iframe child
learns which container it is inside. A component child injects the same values off its route.

## The sandbox bootstrap — how a sandboxed plugin gets `ctx`

A sandboxed plugin is **two documents**, and knowing which is which is half the model:

- the **entry (logic) document** is the `entryUrl` the distribution composes or the catalogue lists.
  The host loads it in a _hidden_ sandboxed iframe; it never renders. Its whole job is the Penpal
  handshake: connect to the parent, receive `ctx`, make your registrations.
- the **view (surface) document(s)** are the `iframe:` URL(s) your `registerSurface` calls point at.
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

The RPC `ctx` is **flat**: unlike the in-process `ctx` the other how-to pages use, there is no `ctx.ui`
facade. The endpoints are `registerSurface` · `registerMenuItem` · `registerSettingsSection` ·
`navigateContent` · `openContentTab` / `keepContentTab` / `pinContentTab` / `unpinContentTab` /
`closeContentTab` · `revealSurface` · `toast`. Every call runs through the same default-deny
capability broker as a trusted plugin. An ungranted capability rejects, so `.catch` and degrade.
(Generate this whole layout with `nx g @loomweaver/devkit:frame-plugin` or the MCP
`scaffold_frame_plugin`, described in [scaffolding](../scaffolding.md).)

## The frame UI kit

A sandboxed **surface** (the view document) does not import `@loomweaver/shell`. Instead the
**distribution serves the frame UI kit** (`@loomweaver/frame-kit`) same-origin under the well-known path
`/frame-kit/`, and your surface references it:

```html
<link rel="stylesheet" href="/frame-kit/lw-frame.css" />
<script src="/frame-kit/penpal.global.js"></script>
<script src="/frame-kit/lw-elements.global.js"></script>
```

- **`lw-elements.global.js`** defines the whole `<lw-*>` element family (`lw-tooltip` ·
  `lw-select`/`lw-option` · `lw-menu`/`lw-menu-item` · `lw-button` · `lw-markdown` · `lw-icon` ·
  `lw-progress-ring`) with the built-in icon set seeded, the same behaviour source the host runs. It
  also exposes `globalThis.LwFrame`: `setIcon(name, svg)` / `removeIcon` / `hasIcon` for
  plugin-own icons (sanitised), and `applySurfaceState(state)`. Call that one from your `render`
  handler and the pushed tokens, root font size and light/dark theme are applied for you.
- **`lw-frame.css`** is the host's `.lw-*` class contract compiled to plain CSS on `var(--lw-*)`
  (with light/dark fallbacks for the blink before the first push), so there is no hand-kept CSS mirror.
- **`penpal.global.js`** is the RPC transport (`globalThis.Penpal`).

The kit is versioned **with the distribution's shell**: you reference it, you do not vendor it, so
your paint always matches the host the plugin actually runs in. For development outside a
distribution, copy the files from the `@loomweaver/frame-kit` npm package.

### Writing the surface in TypeScript

The package ships `dist/lw-frame.d.ts`, a description of the global the script installs. It is an
ambient declaration rather than a module, because you load the kit with a `<script>` tag and never
import it. So you reference it once and `LwFrame` is typed everywhere:

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["@loomweaver/frame-kit"] } }
```

A wrong method name or a wrong argument is then reported while you write it, instead of failing as
`undefined is not a function` inside a frame you cannot easily inspect. Nothing about the surface
changes: plain HTML with a script tag stays exactly as valid, and the declaration is emitted from the
same source the bundle is built from, so the two cannot disagree. What it describes:

- **`LwFrameApi`** is the shape of `globalThis.LwFrame` itself: the icon methods, `applySurfaceState`,
  `connectState` and the `state` store.
- **`LwSurfaceRenderState`** is what the host pushes to your `render` handler: theme, design tokens,
  root font size and the product's replacement glyphs. Hand it to `applySurfaceState` unchanged.
- **`LwStateApi`** is the surface half of `ctx.state`: `watch(key)` for a handle, and `apply(...)` to
  feed the host's `stateChanged` push in from your `methods`.
- **`LwStateHandle`** is one key's handle: `value` · `loaded` · `set` · `clear` · `dispose`, plus
  `onChange` so you can re-render. It mirrors what a trusted plugin holds, so the store reads the
  same on both rungs of the isolation ladder.
- **`LwStateHost`** is the set of host methods your Penpal connection exposes for the store. You pass the
  resolved connection to `connectState`; you do not call these yourself.
- **`LwSurfaceCapture`** / **`LwSurfaceCaptureRequest`** are what the workbench asks for and what you
  answer with when it draws a picture of itself, described next.

## A picture of the workbench, and your part in it

A product can ask the workbench to draw a picture of what the user is seeing, usually for a fault
report. The browser will not photograph a tab without asking the user's permission and making them
pick a target every time, so the picture is rendered from the document instead. That stops at your
surface: it is isolated, so nothing outside it may read what it drew. The workbench therefore asks
your surface to draw itself.

**Expose the platform's own methods beside yours and this happens for you:**

```js
Penpal.connect({
  messenger,
  methods: LwFrame.surfaceMethods({
    render(state) {
      LwFrame.applySurfaceState(state);
    },
  }),
});
```

`surfaceMethods` returns your methods plus the ones the workbench may call on any surface. Write it
this way and requests added to the platform later arrive without you editing the plugin again. The
platform's own names win over yours, so you cannot shadow one by accident. A surface that does not
expose them is not broken. It simply appears on the picture as an area saying its content is not
included.

The renderer is fetched from beside the kit the first time a picture is asked for, so a surface that
is never captured never pays for it.

### Keeping something off the picture

Mark any element and its content stays off every picture; the area says so instead:

```html
<p data-lw-withhold>Account 8812 3345 9901</p>
```

It is read at the moment a picture is made, so setting or clearing it takes effect at once, and your
surface is **never told** that it is being pictured. There is no moment at which it could behave
differently because it is being observed, which is the whole point of a fault report.

**You cannot refuse to be pictured, and marking your root does nothing.** The user is already looking
at those pixels and can photograph the screen by other means. A refusal would withhold nothing from
them, while making the feature useless for the case it exists for: reporting a fault in a plugin.
What you can do is keep particular content out, which is what the marking is for.

**What is not on the picture at all:** content scrolled out of sight inside a region, and any surface
the user opened in its own window. The picture is what the user could see. And because it is drawn
rather than photographed, it is a faithful depiction rather than an exact one, and a surface that paints
by means that cannot be re-rendered may differ from the screen.

## Distributing through a plugin store

A sandboxed plugin needs nothing extra to be store-installable: a distribution lists it in its
[plugin catalogue](../distribution/plugin-store.md) (id, entry URL, display metadata) and users install
it at runtime. Two things matter to you as the author. First, **declare your capabilities honestly**.
The install dialog shows exactly the declared set to the user, and accepting grants exactly that. An
undeclared capability is never granted; a declared one the user can still revoke later. Second, expect
your files to be **copied into the product's own origin**. The store is same-origin by design, so
getting listed means passing the operator's review, not hosting anything yourself. Ship a
**README.md** with your plugin: the operator copies it into the store next to your files and the
store's detail pane renders it in-app. It is your plugin's storefront page. (The testbed's
`store-full` plugin is the worked example.)

## Shipping a new version

Updates ride on the catalogue's `version` field: the operator raises it together with your files, and
every installed user is offered an update that swaps the entry and respawns your plugin live. Two
consequences for you. Keep the version **monotonic**: segments are compared numerically, `1.10.0`
beats `1.9.0`, and only a strictly newer version is offered. And a version which **declares
capabilities the user never consented to** asks for consent again, listing exactly the added ones, so
growing your declaration is safe but never silent.

## Settings: declare data, the host renders and stores

A sandboxed plugin can contribute a settings section over RPC, but in a **data-only** form. Each row
declares a control kind and its **default value** instead of `value()`/`set()` callbacks, which cannot
cross the wire. The host renders the controls. It also owns the storage (user-local
through the distribution's settings store). It **pushes the current values back** by calling the
`settingsChanged(sectionId, values)` method you expose on your RPC channel. That call comes once after
registration with the restored state, then on every change, **including a change made in another
browser window**. Plugin settings ride the shell's cross-tab sync, so every window's copy stays
current; there is nothing to wire. Labels may be plain literals (you cannot contribute
translations). The host decides where your section appears: an _installed_ plugin's section lands
under the **"Community plugins"** nav group, a composed frame plugin's under **"App plugins"**. The
group is never your choice, so nothing can masquerade as the app.

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

- [Frame plugins](../distribution/frame-plugins.md): how a distribution composes a sandboxed plugin and serves the kit.
- [Plugin store](../distribution/plugin-store.md): the catalogue, runtime install and updates on the operator's side.
- [Your plugin's own store](plugin-state.md): the store both documents of a sandboxed plugin share.
