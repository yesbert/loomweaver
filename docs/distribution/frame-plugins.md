# Frame plugins

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-sandbox` · `plugin-permissions`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`providePlugins(...)` loads **trusted, in-process** weavers (Angular, composed at build time). A
distribution can also load a **sandboxed** plugin — code it does not fully trust, or that is not Angular
— with `provideFramePlugins(...)`. Its code runs in an isolated `<iframe sandbox>` and receives `ctx`
over RPC (Penpal), through the **same** broker a trusted weaver uses:

```ts
// src/app/app.config.ts — in the providers array
import { provideFramePlugins } from '@loomweaver/shell';

// in providers:
provideCapabilityGrants({ 'report-tool': ['contributions', 'ui', 'navigation'] }),
...provideFramePlugins({
  id: 'report-tool',
  name: 'Report tool',                  // what the user reads; omit it and the id is shown
  entryUrl: '/report-tool/plugin.html', // the plugin's entry document, served by the distribution
  capabilities: ['contributions', 'ui', 'navigation'],
}),
```

`name` is what the workbench calls the plugin wherever it names it to the user — the permissions
surface above all. Omit it and the id is shown unchanged, which is a poor name but a correct one:
nothing prettier is derived from it. Everything else keeps following the `id`, so naming a plugin
changes what is read and nothing about what it holds.

What the entry document itself must contain — the Penpal handshake that receives `ctx` — is worked
through with a complete example in
[authoring a weaver → the sandbox bootstrap](../weaver/sandboxed-surfaces.md#the-sandbox-bootstrap--how-a-sandboxed-plugin-gets-ctx).

Grants work identically, from the same default-deny map that
[Capabilities and trust](../concepts/capabilities-and-trust.md#default-deny) explains. The plugin contributes content views with the
[`iframe` route surface](../weaver/content-area.md). A
plain-string, data-oriented `ctx` slice crosses the boundary; an Angular class cannot. Everything
arriving over the wire is re-validated at the RPC seam. Only the `{ iframe }` surface form is
accepted. The surface URL must be **same-origin** (distribution-served) — foreign origins,
`javascript:` and `data:` URLs are rejected. What the sandboxed `ctx` carries, and how a surface
paints and talks back, is [Sandboxed surfaces](../weaver/sandboxed-surfaces.md). The isolation
guarantee is the iframe sandbox: the plugin runs in its own JS context and origin, with no access to
the host DOM, variables or storage.

Because a sandboxed surface has none of the host's `--lw-*` design tokens, the host **pushes the resolved
token values** to the surface (alongside the active locale and light/dark theme); the surface sets them as
CSS variables and paints with `var(--lw-…)` just like host chrome. The push carries the **full `--lw-*`
vocabulary** (every `LW_TOKENS` entry), and the values are the *effective* ones, so
a theme switch — and any tenant/product token override, plus the user's text size — carries into the sandbox
with no hardcoded colours or fonts to keep in sync.

## The level a frame plugin runs at

**How a plugin arrives and how much the browser holds it back are two questions.** A frame plugin
runs at one of two levels, and the composition chooses:

| | `isolated` (the default) | `embedded` |
| --- | --- | --- |
| The frame | `<iframe sandbox="allow-scripts">`, no origin of its own | a plain `<iframe>`, it keeps its origin |
| Storage, cookies, the session they carry | none | whatever the browser grants that origin |
| Can reach the hosting document | no | **yes** when served from the same origin; a sibling subdomain keeps it out |
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

`origins` names the origins this plugin's own surfaces may be served from, beyond the application's
own; omit it and the application's origin is the only one, which is the right answer for a plugin
whose files you serve yourself. A sibling subdomain belongs there: it gives an embedded application
its own storage and keeps it out of the hosting document, while a session cookie scoped to the shared
domain still reaches it.

**`embedded` is not a weaker sandbox. It is not a sandbox.** An embedded application served from your
origin can reach the hosting document, its storage and your session. The level exists to separate *deployments*, so
several teams can ship independently into one workbench, and it is a decision about trust that the
composition makes on the operator's behalf. Compose only code you would ship yourself, exactly as
with a trusted weaver.

A plugin never decides this for itself. A catalogue entry may *ask* for a level, and the wiring for
that catalogue carries the highest one it may confer: `providePluginCatalog(source, { maxLevel })`,
strict by default. An entry at or below the cap runs at what it asked for. One above it is refused
and reported rather than started lower, because something running below what it needs fails in ways
nobody traces back to a line of configuration.

### Where to serve an embedded application from

This is a deployment decision with consequences the platform cannot take back for you, so it is
worth making deliberately. Measured against a child frame burning CPU for 1.5 s:

| | Re-hosted under one origin | Sibling subdomain | Cross-site origin |
| --- | --- | --- | --- |
| Session from a domain-wide cookie | yes | yes, same site | no |
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
  convention and review; there is no technical separation to lean on.

If you set `Origin-Agent-Cluster`, set it on **every** response from that origin. Whether an origin
is origin-keyed is decided once per browsing context group, so a single load without the header
settles it for everything that follows.

## Frame UI kit (`@loomweaver/frame-kit`)

Frame surfaces paint with the host's primitives through the **frame UI kit**: a small
npm package of static assets — `lw-elements.global.js` (the whole `<lw-*>` element family + the built-in
icon set + the `LwFrame` helper API), `lw-frame.css` (the `.lw-*` class contracts compiled to plain
CSS on `var(--lw-*)`) and `penpal.global.js` (the RPC transport). The **distribution serves it
same-origin under the well-known path `/frame-kit/`** with an assets glob:

```jsonc
// project.json → build.options.assets
{ "glob": "**", "input": "node_modules/@loomweaver/frame-kit/dist", "output": "frame-kit" }
```

Plugins reference those paths instead of vendoring copies — so the kit's version always matches the
`@loomweaver/shell` your distribution actually runs (`@loomweaver/frame-kit` shares the platform's version line;
keep the two in lockstep when you update). If you host sandboxed plugins — composed or through the
plugin store — serving the kit is part of the contract those plugins rely on.

The **session is pushed the same way, but only when you grant it.** A surface whose plugin holds the
`session` capability receives `{ authenticated, roles }` and can gate its own UI; without the grant the
host omits the field entirely, so the grant governs the push as well as `ctx`. Revoking the
capability in the Permissions settings stops the push live, with no reload.

Ship a Content-Security-Policy `<meta>` in your `index.html` with at least `frame-src 'self'` (both
in-repo distributions do — plus `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`): it pairs
with the same-origin surface check at the RPC seam as defence in depth for sandboxed surfaces. Angular's
component styles need `style-src 'unsafe-inline'`.

**`frame-src` is yours to decide, and it is the real gate for trusted embeds.** A *sandboxed* plugin can
never choose the origin — the RPC seam rejects anything not same-origin. A *trusted* weaver, however, may
point an [`iframe` surface](../weaver/content-area.md) at a foreign
origin on purpose (a Grafana dashboard, a docs site, a video), and that is an intended capability, not a
defect: the platform does not second-guess code you compiled in. What stops it is your CSP, which the
browser enforces and no plugin can talk around. So with `frame-src 'self'` such a surface is simply
blocked — if you want it, widen `frame-src` deliberately to the origins you trust, and no further.

> **CSP × production build — `inlineCritical` must be off.** With a strict `script-src 'self'` (no
> `'unsafe-inline'`/`'unsafe-hashes'`), Angular's critical-CSS inlining has to be **off** in the
> production build: `optimization.styles.inlineCritical: false`, in the build target's `production`
> configuration. Otherwise Angular emits the full stylesheet as
> `<link media="print" onload="this.media='all'">` and the **inline `onload` handler is blocked by the
> CSP** — the stylesheet never activates and the app renders unstyled. **The scaffold sets this for
> you**; it is written down here because it is invisible in `ng serve` dev builds, which do not inline
> critical CSS, so a hand-wired policy meets it for the first time in production. Verify against a
> production build.

## Where next

- [Sandboxed surfaces](../weaver/sandboxed-surfaces.md): the bootstrap, the pushed tokens and the frame kit from the plugin's side.
- [Plugin store](plugin-store.md): the same sandboxed plugins, installed by the user at runtime instead of composed.
- [Capabilities and trust](../concepts/capabilities-and-trust.md): default-deny, the three rungs and where the sandbox sits among them.
- [The plugin system](../plugins.md): the four ways a plugin arrives and what the user may revoke, disable or remove.
