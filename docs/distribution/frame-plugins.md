# Frame plugins

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-sandbox`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`providePlugins(...)` loads **trusted, in-process** weavers (Angular, composed at build time). A
distribution can also load a **sandboxed** plugin — code it does not fully trust, or that is not Angular
— with `provideFramePlugins(...)`. Its code runs in an isolated `<iframe sandbox>` and receives `ctx`
over RPC (Penpal), through the **same** default-deny broker:

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

Grants work identically (default-deny, same map). The plugin contributes content views with the
[`iframe` route surface](../weaver/content-area.md). A
plain-string, data-oriented `ctx` slice crosses the boundary; an Angular class cannot. Everything
arriving over the wire is re-validated at the RPC seam. Only the `{ iframe }` surface form is
accepted. The surface URL must be **same-origin** (distribution-served) — foreign origins,
`javascript:` and `data:` URLs are rejected. This is the **first sandbox
rung** — the exposed `ctx` is currently minimal (routes, navigation, toasts) and grows as the rung
matures, so treat it as experimental. The isolation guarantee is the iframe sandbox: the plugin runs in
its own JS context and origin, with no access to the host DOM, variables or storage.

Because a sandboxed surface has none of the host's `--lw-*` design tokens, the host **pushes the resolved
token values** to the surface (alongside the active locale and light/dark theme); the surface sets them as
CSS variables and paints with `var(--lw-…)` just like host chrome. The push carries the **full `--lw-*`
vocabulary** (every `LW_TOKENS` entry), and the values are the *effective* ones, so
a theme switch — and any tenant/product token override, plus the user's text size — carries into the sandbox
with no hardcoded colours or fonts to keep in sync.

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
host omits the field entirely — default-deny reaches the sandbox surface, not just `ctx`. Revoking the
capability in the Permissions settings stops the push live, with no reload.

Ship a Content-Security-Policy `<meta>` in your `index.html` with at least `frame-src 'self'` (both
in-repo distributions do — plus `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`): it pairs
with the same-origin surface check at the RPC seam as defense in depth for sandboxed surfaces. Angular's
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

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../reference/distribution/index.md): everything your own code can do once the product runs.
