# The plugin system

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-runtime` · `plugin-permissions` · `plugin-sandbox` ·
> `plugin-store`. Where this page and a specification disagree, the specification is right, and
> that is a defect in this page: change the behaviour there, then explain it here.

LoomWeaver is a plugin platform with no domain logic of its own. That means "how plugins are loaded,
trusted and controlled" *is* the platform. This page describes it from the distribution's point of
view. It covers three things: the four ways a plugin can reach a running app, what the capability
broker does in each case, and what the user can turn off.

For the plugin author's view — what `ctx` offers and how to build a weaver — see
[authoring a weaver](authoring-a-weaver.md).

## Four ways in, one contract

Every plugin implements the same `Plugin` interface and receives the same `ctx`. What differs is
isolation, how it arrives — and **whose decision it was**:

| | Trusted | Frame plugin | Operator-deployed | Community-installed |
| --- | --- | --- | --- | --- |
| Arrives via | `providePlugins()` | `provideFramePlugins()` | a catalog entry marked `deployed` | the user, from a catalog |
| Runs in | the app itself | an `<iframe>`, at the level below | an `<iframe>`, at the level below | `<iframe sandbox="allow-scripts">` |
| `ctx` is | a direct object | a Penpal RPC proxy | a Penpal RPC proxy | a Penpal RPC proxy |
| Written in | Angular | anything | anything | anything |
| Grant comes from | your composition root | your composition root | the entry itself | the install dialog |
| Decided at | build time | build time | run time, by the operator | run time, by the user |
| The user may turn it off, or revoke a capability | yes | yes | **no** | yes |
| The user may remove it | no | no | no | yes |

The ladder is deliberate: the transport changes, the broker does not. A capability check runs at
exactly the same place for all four.

### The level a frame plugin runs at

**How it arrives and how much the browser holds it back are two questions.** A frame plugin runs at
one of two levels, and the composition chooses:

| | `isolated` (the default) | `embedded` |
| --- | --- | --- |
| The frame | `<iframe sandbox="allow-scripts">` — no origin of its own | a plain `<iframe>` — it keeps its origin |
| Storage, cookies, the session they carry | none | whatever the browser grants that origin |
| Can reach the hosting document | no | **yes** |
| Written for | code you did not write | your own teams, deploying separately |

```ts
...provideFramePlugins({
  id: 'treaties',
  entryUrl: '/treaties/plugin.html',
  capabilities: ['contributions'],
  level: 'embedded',                          // omit it and you get 'isolated'
  origins: ['https://treaties.example.com'],  // where its own surfaces may come from
}),
```

**`embedded` is not a weaker sandbox — it is not a sandbox.** An embedded application can reach the
hosting document, its storage and your session. The level exists to separate *deployments*, so
several teams can ship independently into one workbench, and it is a decision about trust that the
composition makes on the operator's behalf. Compose only code you would ship yourself, exactly as
with the trusted rung.

A plugin never decides this for itself. A catalog entry may *ask* for a level, and the wiring for
that catalog carries the highest one it may confer (`providePluginCatalog(source, { maxLevel })`,
strict by default). An entry at or below the cap runs at what it asked for; one above it is refused
and reported rather than started lower, because something running below what it needs fails in ways
nobody traces back to a line of configuration.

### Where to serve an embedded application from

This is a deployment decision with consequences the platform cannot take back for you, so it is
worth making deliberately. Measured against a child frame burning CPU for 1.5 s:

| | Re-hosted under one origin | Sibling subdomain | Cross-site origin |
| --- | --- | --- | --- |
| Session from a domain-wide cookie | yes | yes — same site | no |
| Storage of its own | no | yes | yes |
| Can corrupt the hosting document | yes | no | no |
| Can seize the origin's service worker | yes, unless you prevent it | no | no |
| Survives a frozen application | no | **Chromium only** | yes |

**The sibling subdomain is the recommendation, and fault isolation is not the reason.** It buys the
three properties that hold in every engine while leaving single sign-on free. Surviving a frozen
application needs the `Origin-Agent-Cluster: ?1` response header **and** Chromium: Firefox honours
the header and freezes anyway, Safari does not implement it. If that matters everywhere, it costs a
cross-site origin and with it the easy session.

Two things the workbench cannot enforce for you, and which belong in your serving layer:

- **Service-worker scope.** A worker's scope is limited to its script's path unless the
  `Service-Worker-Allowed` header widens it. Never pass that header through for an application's
  path, and no team can take over the whole origin.
- **Storage keys.** Under one origin every team shares one store. Prefix per application, by
  convention and review — there is no technical separation to lean on.

If you set `Origin-Agent-Cluster`, set it on **every** response from that origin. Whether an origin
is origin-keyed is decided once per browsing context group, so a single load without the header
settles it for everything that follows.

**Authority is the axis the last three rows describe, and it is worth stating on its own.** What the
user chose is theirs end to end: they consented to it, and they can revoke, disable and remove it.
What the operator decided is not theirs to remove — and for a *deployed* plugin, not theirs to
disable either. The difference between composed and deployed is deliberate: a composed plugin ships
as part of one artefact the user can see whole, while a deployed one is managed centrally and can be
withdrawn centrally, which only works if the centre can rely on what it rolled out being there.
Authority also settles an identity collision: composed wins over deployed, and deployed wins over
what the user installed.

### Trusted — composed at build time

```ts
// src/app/app.config.ts — in the providers array
provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),
...providePlugins(notesPlugin),
```

The plugin is a normal dependency of your distribution. It can register Angular components as
surfaces, and it runs in your app's JavaScript context — which is also the honest limit: **a trusted
plugin is not sandboxed**. Compose only code you would ship yourself.

Sharing the context also means sharing globals the platform does not broker. The custom element
registry is one of them. A trusted plugin can define its own element. Nothing can take that tag back
for the lifetime of the document — not disabling the plugin, not uninstalling it. That is a
[documented escape hatch](authoring-a-weaver.md#your-own-custom-element--the-escape-hatch) rather than
a supported path. It is also one more reason the trusted rung is a review decision, not a default.

### A frame plugin — an iframe over RPC

```ts
// src/app/app.config.ts — in the providers array
...provideFramePlugins({
  id: 'charts',
  entryUrl: '/charts/plugin.html',
  capabilities: ['contributions', 'ui'],
}),
```

At the default level the entry document is loaded into a hidden `<iframe sandbox="allow-scripts">`.
The sandbox has no `allow-same-origin`, so the plugin gets an opaque origin. It cannot touch your DOM, cookies or
storage. It talks to the host over [Penpal](https://github.com/Aaronius/penpal) RPC. The host's end
of that channel is the very same broker object the trusted runtime uses. On the plugin's side the
whole activation is the handshake:

```js
// inside /charts/plugin.html (or a script it loads):
const messenger = new Penpal.WindowMessenger({
  remoteWindow: globalThis.parent,
  allowedOrigins: ['*'], // opaque origin; isolation comes from the sandbox attribute
});
Penpal.connect({ messenger }).promise.then((ctx) =>
  ctx.registerSurface({
    id: 'charts.view',
    title: 'Charts',
    iframe: '/charts/view.html',
    routable: { path: 'charts' },
  }),
);
```

The complete worked example — both documents, the flat RPC `ctx` surface, receiving pushed state —
is in [authoring a weaver → the sandbox
bootstrap](authoring-a-weaver.md#the-sandbox-bootstrap--how-a-sandboxed-plugin-gets-ctx); the
`scaffold_frame_plugin` generator emits this exact layout ([scaffolding](scaffolding.md)).

`entryUrl` must be **same-origin**: you serve the plugin's files yourself. That is what makes review
a meaningful control. The plugin's visible UI is a second iframe, called the surface. The host
paints the design tokens into it, so a sandboxed plugin looks native without importing anything from
you — see [the frame UI kit](authoring-a-weaver.md#the-frame-ui-kit).

Only data crosses an RPC boundary, so a sandboxed plugin reaches a **subset** of `ctx`:

| Reaches the host | Trusted only |
| --- | --- |
| `registerSurface` (`{ iframe }` or `{ container }`, routable **or** docked) | `registerCommand`, `registerBarItem`, `registerRailItem` |
| `registerMenuItem`, `registerSettingsSection`¹ | `contributeIcons`, `contributeTheme` |
| `navigateContent`, `openContentTab`, `keep/pin/unpin/closeContentTab`, `revealSurface` | `ui` beyond `toast` — dialogs, prompts, `openMenu`, `openSettings` |
| `ui.toast` | `ctx.host`, `ctx.activeContent`, `ctx.session`² |

¹ as **data** — the control kinds carry values, not callbacks, and the host owns the storage.
² the session is *pushed* into the plugin's surface instead, if it was granted `session`.

The pattern behind the split is simple. Anything whose contract is a function cannot be serialised —
`run`, `onClose`, a notification action. A sandboxed plugin therefore does that work itself, for
instance drawing its own `<lw-menu>` at the cursor rather than asking the host to.

A sandboxed surface is not confined to a content tab. It may declare `docks` and appear as a sidebar
view, or declare a `container` and host a nested tree of child surfaces; a docked surface has no
address, so its channel's `navigate` is a no-op with a development warning and its pushed `tab` is
always empty. What the host pushes tells it where it is: `instanceId` (the pane or named instance) and
`params` (route params, or the container's `:id` for a container child). `access` is the one field the
seam still rejects — a sandboxed surface gates itself from the pushed session state.

The retention protocol follows the same pattern. A surface that declares `retain: 'always'` is
**hidden in place** rather than destroyed: no reload, no new handshake per tab switch. A collapsed
sidebar and a closed pane are safe too, wherever the browser can move a node without detaching it
(Chromium and Firefox today; WebKit rebuilds instead). **A split, a drag into another pane and a
minimise rebuild it everywhere**, because moving an `<iframe>` the ordinary way reloads it. That is
the one place where a sandboxed surface is weaker than a trusted one, and it is worth weighing before
you choose the rung: a surface a user is likely to want *beside* something else pays for it. Nothing
is lost that the surface has written to `ctx.state`. And instead of the trusted `DirtySurface`
interface, the surface channel carries `setDirty(true|false)` plus an optional `beforeClose()`
veto — see [recipe 8](samples.md#an-editor-with-unsaved-changes).

### Operator-deployed — the organisation decides

The same catalog can carry plugins that are not offered but **issued**. An entry marked `deployed`
is active for every user on their next load, holding exactly the capabilities the entry names, with
no consent dialog in the way:

```jsonc
// /plugins/catalog.json
{ "id": "treaties", "name": "Treaties", "entryUrl": "/treaties/plugin.html",
  "capabilities": ["contributions"], "deployed": true }
```

This is the shape a business deployment wants: a team publishes an application, an administrator
enters it with the rights it needs, and it simply appears — or disappears, when the entry is
withdrawn. Asking each user to consent to software they cannot decline is a dialog in the way of
their work, not a safeguard.

Three consequences follow, and none of them is decoration:

- **A catalog that deploys is read at startup**, not only when someone opens the store. What it last
  deployed is remembered separately from what the user installed, so a catalog that cannot be
  reached leaves those plugins running rather than starting an application without its features. A
  catalog that *answers* is authoritative: an entry it no longer carries stops running.
- **The user sees it and cannot remove it.** It is listed, badged as provided, its own settings are
  one click away — and there is no off switch, no removal, and no switch in the permissions surface.
  Withdrawing a capability from software somebody was issued does not restrain it, it breaks it.
- **A deploying catalog issues rights.** Without a consent dialog in the path, what an entry declares
  is what the plugin holds — so whoever can write that catalog can grant capabilities. Serve it
  through the `PluginCatalog` port from your own backend, where writing it is an authenticated act,
  rather than as a static document whose integrity rests on file permissions.

### Community-installed — the user decides

A distribution can offer a curated catalog; the user installs from it at runtime:

```ts
// src/app/app.config.ts — in the providers array
...providePluginCatalog('/plugins/catalog.json', { title: 'acme.store.title' }),
```

Installation is **user-local** and persisted through the settings store, so it follows the user the
same way their other state does. Everything else is identical to the sandboxed rung: same iframe,
same broker, same same-origin rule. The catalog lives on your origin, and you copy approved plugins
into it. Operator review plus same-origin *is* the integrity boundary. That is why plugin signatures
are not part of the model today.

The install dialog lists the capabilities the plugin declares, and **agreeing is the grant** — there
is no separate grant map for installed plugins. Consequently an update that widens the declaration
asks again, listing only what was added; an update that does not, applies silently.

See [plugin store](building-a-distribution.md#plugin-store-runtime-install) for the catalog schema.

## Capabilities: default-deny

There are seven coarse capabilities. They are exported as `CAPABILITIES` in canonical order, so a
product building its own permissions UI iterates the list instead of hard-coding it. A plugin
**declares** what it needs. The distribution **grants**. The effective set is the intersection. A
declaration alone grants nothing, and a grant for something undeclared does nothing.

| Capability | Unlocks |
| --- | --- |
| `contributions` | `registerSurface` / `Command` / `BarItem` / `RailItem` / `SettingsSection` / `MenuItem`, `contributeIcons` |
| `ui` | `ctx.ui.*` — dialogs, toasts, settings, context menus |
| `host` | `ctx.host` — version and update state |
| `navigation` | driving and reading the content area, incl. `ctx.activeContent` |
| `session` | `ctx.session` — login state and roles, for self-gating |
| `theme` | `ctx.contributeTheme` — re-colouring the whole app |
| `automation` | `ctx.invokeCommand` / `ctx.invocableCommands` — running actions **other** plugins contributed |

Using a surface you were not granted raises a `CapabilityError` rather than failing quietly, and the
shell turns that into a toast offering to open the permissions settings. A missing grant is a
misconfiguration, and misconfigurations should be loud.

Granularity is coarse on purpose. Splitting a capability later is compatible; merging two is not.

## What the user controls

**Over the plugins that are theirs**, three independent switches, all persisted and all reversible:

- **Revoke a capability** — the plugin stays loaded, but that `ctx` surface starts refusing. It
  takes effect at the *next* call, so contributions already registered stay. Revocation works
  forward. Only capabilities that were granted can be revoked; a grant is never widened past the
  distribution. `contributions` is not revocable at runtime. It is checked at registration time, so
  turning it off after activation would change nothing.
- **Disable a plugin** — the whole plugin is unloaded and its contributions disappear; re-enabling
  spawns it again. Live, without a reload.
- **Uninstall** — only for community-installed plugins. Its settings are deliberately kept, so a
  reinstall picks up where the user left off.

For a plugin the operator **deployed**, none of the three is offered: it was not the user's
decision, and central management only works if what was rolled out is actually running. A disabling
stored before that identity was deployed is disregarded rather than honoured, so withholding the
switch can never strand someone with something turned off and no way to turn it on. A **composed**
plugin keeps its revoke and disable switches — that is long-standing behaviour this did not
revisit.

The built-in **Permissions** and **Plugin store** settings sections expose all three. Your own
front-end can drive the same state through `CapabilityGrantService`, `PluginEnablementService` and
`PluginInstallService` — see [host services](reference/host-services.md#plugins-at-runtime).

You can also remove those sections entirely (`provideShell({ omit: ['setting:shell.permissions'] })`)
if your product decides these are not the user's call.

## Lifecycle

Two runtimes implement the rungs behind the same abstraction: `PluginRuntime` for composed plugins
and `FramePluginRuntime` for iframe ones. That is why a plugin's lifecycle reads the same either
way. Neither is something a distribution wires up — `providePlugins` and `provideFramePlugins` do
that. The services in [host services](reference/host-services.md#plugins-at-runtime) are the
supported way to intervene.

`activate(ctx)` runs once when the plugin loads; whatever it registers returns a `Disposable`, and
the runtime disposes all of them on deactivation — so disabling, uninstalling or updating a plugin
leaves no orphaned chrome behind. A plugin that starts something of its own implements
`deactivate()`:

```ts
// src/lib/plugin/charts.plugin.ts
import { Plugin } from '@loomweaver/plugin-sdk';

export const chartsPlugin: Plugin = {
  manifest: { id: 'charts', name: 'Charts', capabilities: ['contributions'] },
  activate(ctx) {
    ctx.registerRailItem({ id: 'charts.rail', rail: 'activity', icon: 'document',
      title: 'charts.title', command: 'charts.open' }); // tracked — undone for you on deactivation
    startPolling();                                     // your own resource: undo it yourself
  },
  deactivate() {
    stopPolling();
  },
};
```

Activation is resilient: a plugin that throws during `activate` is rolled back and logged, and the
others still come up. One broken plugin cannot take the app with it.

A sandboxed plugin is re-spawned when its **signature** changes. The signature is the entry URL, the
declared capabilities, the granted capabilities and the version. The version matters for updates at
the same URL. Without it in the signature, replacing the files would leave the running iframe on the
old code while the UI claimed it had updated. The browser re-fetches the entry document on respawn.
So serve plugin files with revalidating cache headers, or the "update" hands the user a cached old
build.

## Contribution ids and collisions

Contributions are addressed by id, and registering an existing id **replaces** it. That is the
mechanism behind distribution-level recomposition (override a default by re-registering it) and it
applies to plugins too: a later contribution wins.

Plugin **ids** themselves are guarded: an installed plugin cannot claim the id of a composed one.
Individual contribution ids are not guarded. An installed plugin can therefore replace a menu entry
or a content route that something else registered. That is a deliberate consequence of the
same-origin, operator-review boundary — what you copy into your catalog is code you have reviewed.
If that trade does not fit your product, do not enable the runtime store.

---

**Next:** [Backend integration](backend-integration.md) — wiring your own backend behind the three
seams. **See also:** [authoring a weaver](authoring-a-weaver.md) — the other side of this contract ·
[host services](reference/host-services.md) — the services behind the management UI
