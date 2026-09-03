# Composition: the provider surface

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

There is no single god-provider, on purpose: each decision has its own provider, so the same decision never has two doors. This page is the whole surface indexed by what you want; each row points at the guide section that tells the story.

**What the product *is***

| I want to … | provider |
| --- | --- |
| set the name, logo and tagline | `provideProductIdentity` ([Branding](../distribution/branding.md#branding)) |
| decide which regions exist and where | `provideLayout` ([Layout](../distribution/layout.md)) |
| recolour the whole app | the design tokens ([tokens](../reference/design-tokens.md)) |
| change sizes, radii, density | your own CSS on the class contracts ([tokens](../reference/design-tokens.md)) |
| replace a built-in icon | `provideIcons` ([Icons](../distribution/icons-and-i18n.md#icons)) |
| reword the shell itself ("Folder" instead of "View") | `provideTranslationOverrides` ([Rewording](../distribution/icons-and-i18n.md#rewording-the-shell)) |
| ship my own translations | `provideTranslationNamespaces` ([i18n](../distribution/icons-and-i18n.md#i18n)) |

**What users are allowed to *do***

| I want to … | provider |
| --- | --- |
| take a gesture away (splitting, pinning, pop-out, shortcuts …) | `provideShellFeatures` ([Switching capabilities off](../distribution/switching-capabilities-off.md#switching-capabilities-off)) |
| change a switch while the app runs, or read it | `FeatureSwitches` ([Switches](switches.md)) |
| offer a pane, workspace, sidebar or reset action from my own control | the services on these pages ([Panes](panes.md), [Workspaces](workspaces.md), [Sidebars](sidebars.md), [Resetting](reset.md)) |
| drop a built-in command, item, settings row, menu entry or route | `provideShell({ omit })` ([Recomposing host chrome](../distribution/recomposing-chrome.md)) |
| hand out layouts the product defines | `provideWorkspaces` ([Developer-defined workspaces](../distribution/workspaces.md#developer-defined-workspaces)) |
| let users put the arrangement back | nothing: `shell.app.reset` ships ([Resetting](../distribution/resetting.md)) |

**What ships inside**

| I want to … | provider |
| --- | --- |
| compose my weaver | `providePlugins` + `provideCapabilityGrants` ([Capabilities](../distribution/capabilities.md)) |
| keep a plugin from being switched off | `provideRequiredPlugins` ([A plugin your application cannot run without](../distribution/capabilities.md#a-plugin-your-application-cannot-run-without)) |
| run an isolated plugin | `provideFramePlugins` ([Frame plugins](../distribution/frame-plugins.md)) |
| offer a plugin catalogue | `providePluginCatalog` ([Plugin store](../distribution/plugin-store.md)) |
| add chrome of my own | `provideBarItems`, `provideRailItems`, `provideViews` ([Recomposing](../distribution/recomposing-chrome.md)) |
| put a search entry in a bar | `provideCommandPaletteEntry`, `provideQuickOpenEntry` ([Command palette entry](../distribution/recomposing-chrome.md#command-palette-entry)) |

**What it talks to**

| I want to … | provider |
| --- | --- |
| feed the signed-in user in | `provideAuthSource` ([Auth integration](../distribution/auth.md)) |
| send gated routes to my login | `provideUnauthorizedRedirect` ([Redirect](../distribution/auth.md#3--redirect-gated-routes-to-your-login--provideunauthorizedredirect)) |
| store settings in my backend | `provideSettingsStore` ([Persistence stores](../distribution/persistence.md)) |
| store working state in my backend | `provideWorkingStateStore` ([Persistence stores](../distribution/persistence.md)) |
| keep two users in one browser apart | `provideIdentityScopedStores` ([Identity-scoped stores](../distribution/persistence.md#identity-scoped-stores-multi-user-browsers)) |
| compute a following tab's address myself | `provideTabAddressResolver` ([Following tabs](../distribution/content-routing.md#following-tabs)) |
| route the content area | `provideShellRouter` ([Content-area routing](../distribution/content-routing.md)) |
| ship without a service worker | `provideShell({ serviceWorker: false })` ([PWA](../distribution/pwa.md)) |
| keep hidden surfaces alive by default | `provideShell({ retention })` ([Surface retention](../distribution/surface-retention.md#surface-retention)) |

## Contributing chrome without a plugin

A distribution does not need a plugin to add chrome. Three providers contribute the same shapes a
weaver contributes, statically at composition time:

```ts
// src/app/app.config.ts — in the providers array
...provideViews({ id: 'acme.inspector', title: 'acme.inspector.title', region: 'primary', component: Inspector }),
...provideBarItems({ id: 'acme.status', bar: 'status-bar', slot: 'end', component: BuildStatus }),
...provideRailItems({ id: 'acme.help', rail: 'activity', icon: 'help', title: 'acme.help', anchor: 'bottom',
                      command: 'acme.openHelp' }),
```

`region` / `bar` / `rail` must name a region id declared in your `provideLayout` (the ids above match
the [getting-started layout](../getting-started.md)) — a contribution addressing an id no region
declares simply renders nowhere (views log a dev-mode warning).

Because ids are the addressing scheme everywhere, using an existing id **replaces** that
contribution — which is how the demo moves the update badge into a sidebar footer. `provideShell({
omit: [...] })` removes one. `ContributionRegistry` is the registry underneath; injecting it lets you
add and remove contributions at runtime (`addRailItem` returns a disposer), but prefer the providers
when the answer is known at composition time.

Two signals on it answer questions about your own composition, and are what
[`loomweaver.report()`](../building-a-distribution.md#seeing-what-you-composed) reads:

| Signal | Holds |
| --- | --- |
| `omitted` | the ids your `omit` list names, exactly as you wrote them, prefixes and all |
| `registeredIds` | every id registered so far, of any kind, **including** the ones `omit` hides |
| `registeredCommands` | every command with the plugin the host stamped on it as its owner (`RegisteredCommand`) — what tells one plugin's commands from another's and from the shell's own, which carry no owner |

`registeredIds` is the only way to tell an `omit` that hid something from one that hit nothing at all:
an omitted contribution is by construction absent from every other signal here. Reach for the report
first — it already phrases the answer, including which prefix you probably meant.

## Where the story is told

- [Building a distribution](../building-a-distribution.md): the composition root and every provider in context.
- [Seeing what you composed](../building-a-distribution.md#seeing-what-you-composed): the development-time composition report.
