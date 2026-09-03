# Architecture

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `plugin-runtime`. Where this page
> and a specification disagree, the specification is right, and that is a defect in this page:
> change the behaviour there, then explain it here.

LoomWeaver is a **domain-agnostic plugin & UI platform** — the *loom* on which products weave.
This page is the mental model you need before building on it. (The [live
demo](https://demo.loomweaver.dev) is a product built exactly this way, from the published packages.)

Four words in these pages name the same thing: the **platform**, the **shell** (its package), the
**host** (its role towards a plugin) and the **workbench** (what the user sees). The
[glossary](glossary.md) has the rest.

```
┌───────────────────────────────────────────────┐
│ DISTRIBUTION — your deployable product        │   branding · layout · grants  (~1 file)
│                                               │
│    Weaver A      Weaver B      …              │   your domain UI  (plugins)
│       └─────────── ctx ──┘                    │   one uniform contract
│                                               │
│    LoomWeaver platform (@loomweaver/shell)          │   chrome · broker · routing
│                                               │   — zero domain logic
└───────────────────────┬───────────────────────┘
                        │  frontend ports (settings · working state · auth)
                        ▼
         your own backend — any stack, or none
```

## The one rule: the core has zero domain logic

The model is a **thin core that can only do plugins**. The "actual app" — whatever product you build
on the platform — is a **first-party plugin bundle**, mechanically indistinguishable from a
third-party one. Domain concepts (documents, trees, tickets) live in a plugin, **never** in the
platform. The anti-pattern is a core that grows: once one domain feature is let in because it was
convenient, the next one has a precedent, and the platform ends up doing too much.

Three roles, and nothing blurs them:

- **Platform (LoomWeaver):** renders neutral chrome, holds contributions, brokers capabilities,
  routes RPC. Knows nothing about any domain.
- **Weaver (a plugin):** contributes views, commands and content. All domain logic lives here.
- **Distribution (a product):** a thin composition that picks a layout, loads weavers, and brands
  itself. This is what you deploy.

## Product = distribution

A product is a **distribution** of LoomWeaver: it **consumes the platform packages and composes
them** — it never forks the core.

- **Frontend:** a thin Angular app composes `@loomweaver/shell` (the host chrome) + one or more weavers,
  declares a layout, grants capabilities, and sets its branding. `@loomweaver/shell` and the weaver both
  come from packages; the distribution is ~1 file of wiring. See
  [Building a distribution](building-a-distribution.md).
- **Backend (optional, product-owned):** the platform ships **no server**. It defines frontend
  **ports** with local/anonymous defaults (the settings store, the working-state store and the
  auth source — `provideSettingsStore`, `provideWorkingStateStore`, `provideAuthSource`); a product implements them
  against **its own backend** (any stack). The UI runs standalone with no backend. See
  [Backend integration](backend-integration.md).

- **Driving it:** the distribution injects the shell's published services to do from its own code
  what its users do by hand: switch capabilities on and off at runtime, split and close panes,
  switch and reset workspaces, collapse sidebars, set the text size, open the plugin store. A switch
  removes the user's control, never the capability, and every service action is the same code the
  control runs, guards included. See [Host services](reference/distribution/index.md).

You never need this repository to build a distribution — the published packages plus these docs are
enough. (Building a real product from the outside is exactly how we validate that.)

## The plugin contract: one uniform `ctx`

A weaver is an object with a `manifest` and an `activate(ctx)` method. On activation it receives a
uniform **`ctx`** (a `PluginContext`) and contributes through it — the same surface for every
plugin, trusted or sandboxed:

```ts
// src/lib/plugin/notes.plugin.ts
import { Plugin } from '@loomweaver/plugin-sdk';

export const myWeaver: Plugin = {
  manifest: { id: 'my', name: 'My Weaver', capabilities: ['contributions', 'ui', 'host'] },
  activate(ctx) {
    ctx.registerSurface(/* … */);
    ctx.registerCommand(/* … */);
    // ctx.ui.confirm(...), ctx.host.version(), …
  },
};
```

There is **no privileged host API**. A domain capability like `acme.search` is *provided by* the
product's own weaver and consumed by others through the broker — the same path a third-party plugin
uses. Everything a plugin may import is in `@loomweaver/plugin-sdk`; nothing else is public API.

## Capabilities are default-deny

A plugin **declares** the capabilities it needs in its manifest; the **distribution grants** them
(`provideCapabilityGrants`). A declaration alone grants nothing — a plugin that was not granted a
capability gets a loud `CapabilityError`, not a silent no-op. The capabilities are coarse on purpose
(`contributions`, `ui`, `host`, `navigation`, `session`, `theme`, `automation`) and can split into finer
ones later
without changing the model. Wiring and examples:
[building a distribution → capabilities](building-a-distribution.md#capabilities-default-deny).

## Auth-aware access gating

LoomWeaver owns **no** authentication — login, session, tokens and the identity provider live in the
product's own stack. The platform only *reacts* to a session snapshot the distribution supplies
via `provideAuthSource` (a reactive `AuthSnapshot` signal; roles/claims are opaque strings). On top of
that, a contribution declares an `access` requirement, and the host reacts to the session by login
state and roles:

- **Chrome items** (rail, bar, views, view actions) are hidden or disabled.
- **Commands** are blocked at the one `execute` seam — keybindings and the palette included.
- **Content routes** show a neutral "sign-in required" placeholder in place (or redirect via
  `provideUnauthorizedRedirect`), and are offered in the New-Tab picker — and mountable for
  split/drag hosting — only once the session qualifies.

A plugin can
also read the session imperatively through `ctx.session` (gated by the `session` capability), and the
host push-adapts it into a sandboxed surface so an iframe plugin self-gates too. This is orthogonal to
capabilities (what a *plugin* may do vs. what a *user* may see). **Client-side gating is presentation,
not security** — the real boundary is server-side. The complete matrix of every gated surface is
[reference → access gating](reference/access-gating.md); the wiring, login UI and redirect with full
examples are [building a distribution → auth
integration](building-a-distribution.md#auth-integration-access-gating).

## The two RPC boundaries (never conflated)

A plugin only ever sees the uniform `ctx`; a **broker** routes each call to the right boundary:

1. **Plugin ↔ Core** — in-browser `postMessage` (Worker/iframe when sandboxed). This is the `ctx`
   proxy the plugin holds.
2. **Core ↔ product server** — the product's own HTTP API (its backend behind the settings-store /
   auth-source ports, or a weaver's domain API). LoomWeaver ships no server of its own here.

## The server/security seam is the product's

LoomWeaver does **not** reinvent tenant identity, auth/session, secret storage, key material or CQRS
— those live in the **product's own backend**, whatever stack that is. Secrets
are per-tenant and injected **server-side**; they never reach the browser. The platform ships no
server for this — it defines the frontend ports and the default-deny broker, and the product supplies
the implementation.

## What's built today

The platform is built and **published as seven versioned npm packages** on one shared version line:
`@loomweaver/shell` (the host chrome), `@loomweaver/plugin-sdk` (the contract), `@loomweaver/frame-kit` (assets for
sandboxed plugins), the scaffolding trio `@loomweaver/cli`, `@loomweaver/devkit` and `@loomweaver/mcp`, and
`@loomweaver/ag-ui` (the [AG-UI](reference/agent-tools.md) adapter, whose stability follows that protocol
rather than the platform). There is no LoomWeaver server package. The in-repo dogfood is **the testbed weaver**, a distribution built from
source that exercises every contract. The [live demo](https://demo.loomweaver.dev) is a separate
product that installs the published packages instead, which is how real products build: against the
registry, in their own repos, with their own backend.

---

**Next:** [Getting started](getting-started.md) — scaffold a running product in ~5 minutes, or
[set it up by hand](manual-setup.md) to see every seam.
