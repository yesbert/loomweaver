# LoomWeaver documentation

**LoomWeaver is a domain-agnostic plugin & UI platform.** Your domain UI is written as plugins
("weavers"); a product is a thin **distribution** that composes them with the published
`@loomweaver/*` npm packages. You never need this repository to build one. The platform is frontend-only; your product brings its own backend.

It speaks **[AG-UI](https://docs.ag-ui.com)** as well, so an agentic backend that already talks that
standard can run your product's own commands.

## Pick your path

| You want to…                               | Start here                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **See it running first**                   | the live demo at [demo.loomweaver.dev](https://demo.loomweaver.dev) — a product built on the published packages |
| **Try it in five minutes**                 | [Getting started](getting-started.md) — scaffold a running, branded product                                |
| **Understand how it works**                | [Architecture](architecture.md), then the [concept pages](#concepts) for why the workbench behaves as it does |
| **Build a plugin (a "weaver")**            | [Authoring a weaver](authoring-a-weaver.md), with copyable recipes in [Samples](samples.md)                |
| **Compose and brand a product**            | [Building a distribution](building-a-distribution.md)                                                      |
| **Use Bootstrap or your own CSS framework**| [Manual setup → bring your own CSS framework](manual-setup.md#bringing-your-own-css-framework)             |
| **Let an AG-UI agent drive your product**  | [Driving your product with an AG-UI agent](ag-ui-agents.md)                                                |
| **Wire your own backend**                  | [Backend integration](backend-integration.md)                                                              |
| **Do something from my own code**          | [Distribution API](distribution-api/index.md) — indexed by "I want to …"                             |
| **Look something up**                      | the [reference pages](#reference) below                                                                    |

## Guides

1. [Architecture](architecture.md) — the mental model: platform / weaver / distribution, the uniform
   `ctx`, default-deny capabilities, auth-aware access gating, the two RPC boundaries. **Read this first.**
2. [Getting started](getting-started.md) — scaffold a running, branded product with a plugin in it (~5 min).
3. [Manual setup](manual-setup.md) — the same app wired by hand, plus the Nx, SSR and Module
   Federation answers (~15 min).
4. [Samples](samples.md) — complete, copyable recipes: a sidebar view with persisted state, a routable
   surface, a command with its triggers, a settings section, access gating, dialogs. It says which of
   them the generator already writes, so you only type the rest.
5. [Authoring a weaver](authoring-a-weaver.md) — the shape of a weaver and the map of fifteen how-to pages
   under `weaver/`: surfaces in a sidebar, the content area, containers, commands, menus, unsaved changes,
   sandboxed surfaces, access gating, settings, i18n. One task per page.
6. [Building a distribution](building-a-distribution.md) — the composition root and the map of sixteen
   how-to pages under `distribution/`: layout, routing, workspaces, switching capabilities off, branding,
   capabilities, auth, persistence, frame plugins, the plugin store, PWA. One decision per page.
7. [The plugin system](plugins.md) — the three rungs of trust and the four ways a plugin arrives (trusted, frame plugin, operator-deployed, community-installed),
   default-deny capabilities, and what the user can revoke, disable or uninstall.
8. [Scaffolding](scaffolding.md) — generate weavers, distributions and integrations with the
   `@loomweaver/cli` command line, the `@loomweaver/devkit` Nx generators or the `@loomweaver/mcp` server for AI
   assistants, all in your own repository.
9. [Driving your product with an AG-UI agent](ag-ui-agents.md) — generate the AG-UI connection,
   watch a call go through, decide which calls to ask about, and replace the stand-in with your own
   transport.
10. [Backend integration](backend-integration.md) — the product hand-off: settings, session and
    translations against your own backend. The platform ships no server.

## Concepts

Why the workbench behaves as it does, each short, each linking to the how-to pages that act on it.

- [Surfaces and panes](concepts/surfaces-and-panes.md) — one contract for everything shown, and a pane as a tab group.
- [The address](concepts/the-address.md) — what the address bar means with several panes open.
- [Retention and unsaved work](concepts/retention-and-unsaved-work.md) — hiding is not closing, and who asks about unsaved work.
- [Capabilities and trust](concepts/capabilities-and-trust.md) — default-deny, the three rungs, and why access is not a capability.
- [Workspaces](concepts/workspaces.md) — a whole way of working, its baseline, and its two origins.

## Distribution API

- [Distribution API](distribution-api/index.md) — everything your product's own code may inject
  and call, indexed by intent: switches, tabs, panes, workspaces, sidebars, dialogs, settings,
  commands, session, appearance, plugins at runtime, windows and sync, reset. Everything a user does
  by hand, your code can do too, with the same guards.

## Platform reference

- [Shell anatomy](reference/shell-anatomy.md) — the region vocabulary (rail / panel / bar / content)
  and docks a distribution declares.
- [Access gating](reference/access-gating.md) — the complete `access` reference: what gates where,
  identity changes, and why client-side gating is not a security boundary.
- [Routing](reference/routing.md) — the content area is the Angular router: what carries over
  unchanged, where a route comes from, and the two places a surface is mounted off-router.
- [Callable commands](reference/callable-commands.md) — opening a command to a caller that is not the
  user: described arguments, answers, the `automation` capability and why the default is closed.
- [Agent tools](reference/agent-tools.md) — `@loomweaver/ag-ui`: letting an AG-UI agent reach the
  workbench's own commands, with a hook for confirming or declining a call before it runs.
- [Design tokens & `<lw-*>` vocabulary](reference/design-tokens.md) — the semantic tokens and host UI
  building blocks to use in templates (never raw palette colors).
- [Icons](reference/icons.md) — every icon name the workbench ships, with its glyph, and how a
  weaver or a distribution adds its own.
- [Operations](reference/operations.md) — what bites when you run, edit or verify something here,
  and the guards that fail on it
- [Accessibility](reference/accessibility.md) — the WCAG 2.1 AA guardrail the host meets and weavers
  inherit.
- [Glossary](glossary.md) — the words these pages use, and the four that name the same thing
  (platform, shell, host, workbench).

The per-symbol reference is the packages themselves: `@loomweaver/plugin-sdk` and `@loomweaver/shell` ship typed
declarations with JSDoc on every public member, which your editor shows in place. The pages above
cover the concepts; a repository check verifies that no published export is missing from them.

## For AI assistants

[`../llms.txt`](../llms.txt) (curated map) and [`../llms-full.txt`](../llms-full.txt) (the full set,
inlined) let an assistant ingest everything needed to build a distribution.

`llms.txt` stays a curated map and never becomes a dump of everything written here. Its worth is the
choosing: an assistant reading it under a tight context budget should reach the pages that matter,
not the longest ones. `llms-full.txt` is where completeness belongs.

## License

[Apache License 2.0](../LICENSE).
