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
[defining your own custom element](weaver/sidebar-surfaces.md#your-own-custom-element--the-escape-hatch). That path is an escape
hatch, and its costs are ones the platform cannot absorb for you.

Nothing in that contract changes how you write Angular. Your views are ordinary standalone
components, the router is the one you already use, and the iframe sandbox is for code you did not
write. The smallest useful weaver is a single surface that owns your whole route tree, which is how
an application you already have moves in behind one plugin.

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

## The pages

- [Surfaces in a sidebar](weaver/sidebar-surfaces.md)
- [View state that survives](weaver/view-state.md)
- [Unsaved changes](weaver/unsaved-changes.md)
- [Your plugin's own store](weaver/plugin-state.md)
- [Containers: a workspace in a tab](weaver/containers.md)
- [The content area: routes and tabs](weaver/content-area.md)
- [Sub-routes, the rest, and tabs that follow](weaver/sub-routes-and-follows.md)
- [Context menus](weaver/menus.md)
- [Sandboxed surfaces](weaver/sandboxed-surfaces.md)
- [Commands and their triggers](weaver/commands.md)
- [Access gating in a weaver](weaver/access-gating.md)
- [Icons and theme](weaver/icons-and-theme.md)
- [Host UI and host facts](weaver/host-ui-and-facts.md)
- [Settings sections](weaver/settings.md)
- [Translations](weaver/i18n.md)

Each page is one task with complete, copyable code. [Samples](samples.md) has the same material as whole files, and [Concepts](concepts/surfaces-and-panes.md) explains why the workbench behaves as it does.
