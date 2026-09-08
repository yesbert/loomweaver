# LoomWeaver documentation

**Build Angular workbenches that grow with your product.**

LoomWeaver gives your product its entire workbench UI, panes, tabs, command palette and plugin store
included, without you building any of it. It is a domain-agnostic plugin and UI platform: your domain
UI is written as plugins ("weavers"), and a product is a thin **distribution** that composes them with
the published `@loomweaver/*` npm packages. You never need this repository to build one. The platform
is frontend-only; your product brings its own backend.

It speaks **[AG-UI](https://docs.ag-ui.com)** as well, so an agentic backend that already talks that
standard can run your product's own commands.

<!-- cards -->

- [Getting started](getting-started.md): One command takes an Angular application to a running, branded product with a plugin in it.
- [Building with an AI assistant](building-with-an-assistant.md): The same path, with an assistant doing the typing and one run recorded as it happened.

## Why LoomWeaver exists

A product where several things are open at once raises its hardest questions late. What happens to
unsaved work when a pane is hidden? What does the address bar mean with three panes open? What may a
plugin reach, and what can the user take back? Each of those arrives after somebody has already met
it, and each answer reaches back into everything built so far.

The extension surface is where that hurts most. Fitted afterwards, it grants a plugin more than it
declared or less than it needs, and both are discovered in production. LoomWeaver answers these
questions in the platform, before your product meets them. Your domain stays a plugin, and the
workbench around it is not yours to maintain.

## What is different here

**It sits above your component framework, not beside it.** The platform draws the workbench itself:
the rail, the panes and their tabs, the command palette, dialogs, settings and the plugin store.
Inside a surface you keep whatever you already build interfaces with. Tailwind is how the shell is
built rather than something it imposes, so a product themed with Bootstrap, or with hand-written CSS,
imports the compiled stylesheet and keeps its own palette.

**It stays Angular, and a plugin does not have to be.** Your product's own code is Angular
throughout: the content area is the Angular router, so routes, guards and resolvers carry over
unchanged. A plugin contributes its view across a Web Component boundary, and a sandboxed one is an
iframe the host mounts in isolation. That is how a plugin written in any technology takes part, and a
frame kit gives its surfaces the theme, the translations and the navigation the rest of the workbench
has.

**Capabilities are default-deny, and the user can take them back.** A plugin declares what it needs
and gets nothing that it did not declare. What was granted is visible to the user, who can revoke,
disable or uninstall it. Three rungs of trust decide how far a plugin runs from the host, down to an
iframe reached over RPC.

**There is no privileged host API.** The published contract is the only contract there is, so a gap
in it is a defect rather than a private route around it. What the typed declarations show your
editor is what the platform can do.

**An agent reaches your product's own commands.** A command can be opened to a caller that is not
the user, with described arguments and an answer, and your product may confirm or decline each call
before it runs. Scaffolding has a server of its own, so an assistant generates a weaver rather than
guessing one.

## Pick your path

| You want to…                                | Start here                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **See it running first**                    | the live demo at [demo.loomweaver.dev](https://demo.loomweaver.dev): a product built on the published packages, and the [assistant workbench](https://github.com/yesbert/loomweaver/tree/main/examples/assistant-workbench), a smaller one an AI assistant operates through its own commands |
| **See what changed**                        | the [changelog](https://loomweaver.dev/changelog/): every release, newest first, from the pull requests it merged                                                                                                                                                                            |
| **Try it in five minutes**                  | [Getting started](getting-started.md): one command scaffolds a running, branded product with a plugin in it                                                                                                                                                                                  |
| **Build it with an AI assistant**           | [Building with an AI assistant](building-with-an-assistant.md): the MCP server registered per tool, the prompts that reach it, one run recorded as it happened                                                                                                                               |
| **Wire it by hand instead**                 | [Manual setup](manual-setup.md): the same application without the generator, plus the Nx, SSR and Module Federation answers                                                                                                                                                                  |
| **See what a product gets for free**        | [The workbench your users get](the-workbench.md): every dialog, menu and search, one picture each                                                                                                                                                                                            |
| **Understand how it works**                 | [Architecture](architecture.md), then the [concept pages](#concepts) for why the workbench behaves as it does                                                                                                                                                                                |
| **Build a plugin (a "weaver")**             | [Authoring a weaver](authoring-a-weaver.md), with copyable recipes in [Samples](samples.md) that say which parts the generator already writes                                                                                                                                                |
| **Compose and brand a product**             | [Building a distribution](building-a-distribution.md): the composition root, and one decision per page under `distribution/`                                                                                                                                                                |
| **Know what a plugin may do**               | [The plugin system](plugins.md): the three rungs of trust, the four ways a plugin arrives, and what a user can revoke, disable or uninstall                                                                                                                                                  |
| **Generate the next piece**                 | [Scaffolding](scaffolding.md): the `@loomweaver/cli` command line, the `@loomweaver/devkit` Nx generators and the `@loomweaver/mcp` server, all in your own repository                                                                                                                       |
| **Use Bootstrap or your own CSS framework** | [Bringing your own CSS framework](distribution/css-frameworks.md)                                                                                                                                                                                                                            |
| **Let an AG-UI agent drive your product**   | [Driving your product with an AG-UI agent](ag-ui-agents.md)                                                                                                                                                                                                                                  |
| **Wire your own backend**                   | [Backend integration](backend-integration.md): settings, session and translations against your own; the platform ships no server                                                                                                                                                             |
| **Do something from your own code**         | [Distribution API](distribution-api/index.md): indexed by "I want to …"                                                                                                                                                                                                                      |
| **Look something up**                       | the [reference pages](#platform-reference) below                                                                                                                                                                                                                                             |

## Concepts

Why the workbench behaves as it does, each short, each linking to the how-to pages that act on it.

- [Surfaces and panes](concepts/surfaces-and-panes.md): one contract for everything shown, and a pane as a tab group.
- [The address](concepts/the-address.md): what the address bar means with several panes open.
- [Retention and unsaved work](concepts/retention-and-unsaved-work.md): hiding is not closing, and who asks about unsaved work.
- [Capabilities and trust](concepts/capabilities-and-trust.md): default-deny, the three rungs, and why access is not a capability.
- [Workspaces](concepts/workspaces.md): a whole way of working, its baseline, and its two origins.

## Distribution API

- [Distribution API](distribution-api/index.md): everything your product's own code may inject
  and call, indexed by intent. Switches, tabs, panes, workspaces, sidebars, dialogs, settings,
  commands, session, appearance, plugins at runtime, windows and sync, reset. Everything a user does
  by hand, your code can do too, with the same guards.

## Platform reference

- [Shell anatomy](reference/shell-anatomy.md): the region vocabulary (rail / panel / bar / content)
  and docks a distribution declares.
- [Access gating](reference/access-gating.md): the complete `access` reference. What gates where,
  identity changes, and why client-side gating is not a security boundary.
- [Routing](reference/routing.md): the content area is the Angular router. What carries over
  unchanged, where a route comes from, and the two places a surface is mounted off-router.
- [Callable commands](reference/callable-commands.md): opening a command to a caller that is not the
  user. Described arguments, answers, the `automation` capability and why the default is closed.
- [Agent tools](reference/agent-tools.md): `@loomweaver/ag-ui`, letting an AG-UI agent reach the
  workbench's own commands, with a hook for confirming or declining a call before it runs.
- [Design tokens & `<lw-*>` vocabulary](reference/design-tokens.md): the semantic tokens and host UI
  building blocks to use in templates (never raw palette colours).
- [Icons](reference/icons.md): every icon name the workbench ships, with its glyph, and how a
  weaver or a distribution adds its own.
- [Accessibility](reference/accessibility.md): the WCAG 2.1 AA guardrail the host meets and weavers
  inherit.
- [Glossary](glossary.md): the words these pages use, and the four that name the same thing
  (platform, shell, host, workbench).

The per-symbol reference is the packages themselves: `@loomweaver/plugin-sdk` and `@loomweaver/shell` ship typed
declarations with JSDoc on every public member, which your editor shows in place. The pages above
cover the concepts; a repository check verifies that no published export is missing from them.

## For AI assistants

Two files are written for the assistant itself: [`../llms.txt`](../llms.txt), the curated map, and
[`../llms-full.txt`](../llms-full.txt), the whole contract inlined for a single fetch. `@loomweaver/mcp`
gives it the generators and validators as tools. [Building with an AI assistant](building-with-an-assistant.md)
is the guide for the person working with one: registering the server per tool, the prompts, and a
run recorded as it happened.

## For contributors

- [Operations](reference/operations.md): what bites when you run, edit or verify something here,
  and the guards that fail on it.
- [Contributing](https://github.com/yesbert/loomweaver/blob/main/CONTRIBUTING.md): how work happens
  here, from fork and branch to the checks a pull request has to pass.

## Where this stands

It is for Angular teams building a product that is a workbench: several things open at once, and a
surface other people extend. It is not for a site of plain pages. It is maintained by one person, its
API still moves on patch releases before 1.0, and the demo application is its reference consumer.

## License

[Apache License 2.0](../LICENSE).
