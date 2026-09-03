# Authoring a weaver

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surfaces` · `plugin-runtime` · `commands` · `menus` ·
> `content-tabs` · `routing` · `surface-retention` · `containers` · `ui-primitives` · `theming` ·
> `i18n`. Where this page and a specification disagree, the specification is right, and that is a
> defect in this page: change the behaviour there, then explain it here.

A **weaver** is a LoomWeaver plugin — where all your domain UI and logic live. It imports only
`@loomweaver/plugin-sdk` (nothing else is public API) and contributes through the uniform `ctx` it receives
on activation. This page gives the shape of a weaver and maps the how-to pages that follow. `ctx` is
the supported surface throughout. There is one deliberate way past it:
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

The order follows a weaver from its first surface to what it needs once it is shipped.

- [Surfaces in a sidebar](weaver/sidebar-surfaces.md): a docked surface, what its body may use, and the custom-element escape hatch.
- [The content area](weaver/content-area.md): routable surfaces, tabs per pane, chromeless, closable, preview and pinned tabs, panes and tab groups.
- [Containers](weaver/containers.md): a workspace in a tab, a child per item, relative addresses.
- [Sub-routes and follows](weaver/sub-routes-and-follows.md): `subRoutes`, sub-tabs when the host mounts you off-router, the rest of the address, tabs that follow the selection, `activeContent`.
- [Commands and their triggers](weaver/commands.md): one behaviour behind shortcut, bar and rail items, palette and menu.
- [Menus](weaver/menus.md): `registerMenuItem`, a menu on a rail or bar item, and the menu you draw in a sandbox.
- [Host UI and host facts](weaver/host-ui-and-facts.md): `ctx.ui` dialogs, toasts and `openMenu`, `ctx.host`.
- [View state that survives](weaver/view-state.md): `VIEW_STATE`: filter, sub-tab, scroll position in one shape.
- [Unsaved changes](weaver/unsaved-changes.md): `DirtySurface` and the Save, Discard, Cancel question.
- [Your plugin's own store](weaver/plugin-state.md): `ctx.state`, one store shared by every surface of your plugin.
- [Settings sections](weaver/settings.md): `registerSettingsSection`, controls the host draws and you store.
- [Access gating](weaver/access-gating.md): `access` on contributions and `ctx.session`.
- [Sandboxed surfaces](weaver/sandboxed-surfaces.md): `component` or `iframe`, the sandbox bootstrap, the frame UI kit, the plugin store.
- [Translations](weaver/i18n.md): titles and labels as keys in a namespace of your own; body text stays yours.
- [Icons and theme](weaver/icons-and-theme.md): `ctx.contributeIcons`, `ctx.contributeTheme`.

Each page opens with what it does and when you need it, and closes with where to go next. [Samples](samples.md) has the same material as whole files, and [Concepts](concepts/surfaces-and-panes.md) explains why the workbench behaves as it does.
