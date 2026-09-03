# Plugin store

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-store`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`provideFramePlugins(...)` composes sandboxed plugins at build time. On top of that, a distribution
can offer a **plugin store**: a curated catalog of sandboxed plugins the *user* installs at runtime —
no rebuild, no reload:

Opening the store from your own control is `PluginStoreService` in the
[host services](../distribution-api/plugins-at-runtime.md).

```ts
// src/app/app.config.ts — in the providers array
import { providePluginCatalog } from '@loomweaver/shell';

// in providers, after provideShell():
...providePluginCatalog('/plugins/catalog.json'),
```

The catalog is a same-origin JSON array; each entry (`PluginCatalogEntry`) is the installable part —
`InstalledPlugin`, the same shape `provideFramePlugins` takes and the shape that is persisted once
the user installs it — plus display metadata for the store:

```json
[
  {
    "id": "report-tool",
    "name": "Report tool",
    "author": "Jane Weaver",
    "category": "Productivity",
    "description": "Generates weekly reports.",
    "version": "1.0.0",
    "downloads": 12842,
    "updated": "2026-07-15",
    "repository": "https://github.com/acme/report-tool",
    "readmeUrl": "/report-tool/README.md",
    "iconUrl": "/report-tool/icon.svg",
    "entryUrl": "/report-tool/plugin.html",
    "capabilities": ["contributions", "ui"]
  }
]
```

**Check the catalog before you ship it.** Everything below is parsed defensively — an unrecognised
field is skipped, a malformed one dropped, an entry without `id` or `entryUrl` discarded, all
silently, because a store that throws on one bad entry serves nobody. That makes a typo invisible
until a user notices something missing, so run the validator in the pipeline that publishes it:

```bash
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json --strict
```

It reports what the host will actually do — an unknown capability is filtered out and the plugin
then throws `CapabilityError`, a missing `version` means the store can never offer an update — and
`--strict` turns the warnings into a failing exit code. See
[scaffolding](../scaffolding.md#the-cli--loomweavercli).

Providing a catalog adds the store's entry points: a **Plugin store** settings section (id
`setting:shell.pluginStore`, `omit`-able) that shows the
**searchable installed-plugins list right on the page** (per plugin the icon actions: open its
settings · uninstall [with a danger-toned confirmation] — both tooltipped — and the standard enable/disable switch) next to a Browse button; that button — and
the palette command `shell.openPluginStore` — opens the **store dialog**, a wide two-pane browse
surface: a **searchable list** (name, author, category and description
are matched; each card shows the plugin icon, name, author, category badge, download count, a
**relative** last-update time — "2 days ago", localized — and the short description, plus an
*Installed* badge) and a **detail pane**. The detail pane shows the metadata, a plain external `repository` link and
the plugin's **README rendered in-app**. The README is fetched from the same-origin `readmeUrl` and
sanitized: the detail view renders the author's text itself and never embeds a foreign page. A second, equally searchable **Installed** view manages
what is installed: per plugin an icon-action row (open its *Community plugins* settings section ·
enable/disable · uninstall — all tooltipped) plus an **Update to vX.Y.Z** button whenever the catalog
carries a newer version. `iconUrl` is a **same-origin image** the operator
ships with the plugin (a not-yet-installed plugin cannot contribute registry icons); `category` is
your curated taxonomy; `downloads`/`updated` are display-only operator stats. All metadata is
parsed defensively (a foreign-origin `readmeUrl`/`iconUrl` or a non-http `repository` is dropped,
the entry stays). Both the settings dialog and the store dialog are near-full-height, and every
dialog can offer a **maximize** control (`OpenOptions.maximizable`; bare dialogs draw their own via
`DialogRef.toggleMaximized`). **The store is the management surface** for installed plugins; brand its
title per product with `providePluginCatalog(source, { title: 'product.marketplace' })` (a Transloco
key you own). Installing shows a **consent dialog listing the
declared capabilities**, with the plugin's description and an icon. Accepting grants exactly that
declaration. For installed plugins the user's consent therefore replaces the
`provideCapabilityGrants` map; that map keeps governing your composed plugins. Afterwards the normal lifecycle applies: installed
plugins appear in the **Permissions** section like every plugin (on/off toggle + capability
switches), an install spawns the plugin immediately, an uninstall in the store unloads it live, and
the installed set persists through the [settings store](persistence.md) — user-local by
default, tenant- or server-held when your store backend decides so.

**Updates** ride on the catalog's `version` field. Raise it (together with the entry's files) and
every installed user sees an *Update available* badge in the store list and an **Update to vX.Y.Z**
button in the detail pane and the installed list; pressing it swaps the persisted entry and respawns
the plugin live — no reload. The respawn re-creates the plugin's iframe, so the browser re-fetches the
entry document under your **cache headers**: serve plugin files so they revalidate, or an updated
plugin can come back from cache as the old build. Versions are compared segment by segment, numerically (`1.10.0` beats
`1.9.0`; a pre-release suffix is not ordered), and only a strictly newer version is offered, so
pinning a catalog back never nags the user. If the new version **declares capabilities the user never
consented to**, the update asks again and lists exactly the added ones — the persisted entry *is* the
grant for installed plugins, so an update can never widen it silently. A version that asks for no
more than before applies straight away.

The settings nav separates plugin *settings* by provenance: sections your
composed weavers register group under **"App plugins"** (they ship with the app), while an installed
plugin that [declares its own settings](../weaver/settings.md#settings-sections)
gets its own entry under a **"Community plugins"** group — the host stamps the group, a plugin cannot
choose it, so a community plugin can never masquerade as part of the app.

The curation is yours and happens **before** the frontend: whatever is not in the catalog does not
exist for the shell. Everything stays same-origin — the catalog URL, each `entryUrl`, and every
surface a plugin registers. The RPC seam enforces this. "Reviewing a plugin" therefore means *you
copy its files into your own origin*. That copy is the integrity boundary. Entries are parsed defensively (junk
shapes, foreign-origin URLs and unknown capability names are dropped), an installed id can never
shadow a composed plugin, and the persisted install set is re-validated on every load. Per-tenant
curation = your backend answering the catalog request tenant-dependently; for a non-JSON source,
provide your own `PluginCatalog` implementation instead of a URL.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
