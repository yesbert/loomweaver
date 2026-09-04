# Plugins at runtime

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-store` · `plugin-permissions` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Opening the store, and doing from your own code what the Permissions and Plugin store settings do.

## Do it

```ts
const store = inject(PluginStoreService);
store.open();   // the store dialog, as from the settings row or the palette command
```

```ts
// src/app/… — inside an injection context
const grants = inject(CapabilityGrantService);
const enablement = inject(PluginEnablementService);
const install = inject(PluginInstallService);

grants.setGranted('notes', 'navigation', false);   // user revocation
enablement.setEnabled('notes', false);             // unload the whole plugin
install.uninstall('community-charts');             // installed-at-runtime only
```

## Read it

```ts
store.title();                              // the title the catalogue configured

grants.permissions();                       // every plugin with its base-granted capabilities and their effective state
grants.isGranted('notes', 'navigation');    // base-granted and not revoked by the user

enablement.plugins();                       // every known plugin with its enabled state
enablement.disabled();                      // the disabled plugin ids
enablement.isEnabled('notes');

install.installed();                        // the plugins installed at runtime
install.isInstalled('community-charts');
install.byId('community-charts');           // the installed entry, or undefined
```

`permissions()`, `plugins()` and `installed()` are the rows the built-in Permissions and Plugin store settings draw. The predicates read the same signals and are reactive where they are called.

## What asks about unsaved work

Nothing on this page asks by itself. The built-in Permissions and Plugin store settings ask about unsaved work before they call `setEnabled(id, false)` or `uninstall`; the services do not repeat the question. A front-end of your own is what asks.

## Switched off

No switch governs the store or plugin management. `provideShell({ omit })` can drop the settings row and the palette command, and `open()` still works.

## In depth

**The store.** Opening works whether or not you kept the built-in entries
(`setting:shell.pluginStore`, `shell.openPluginStore`). With no catalogue composed the store opens
and offers nothing to install, showing only what is installed or deployed. `configure(title)` is what
`providePluginCatalog` uses to brand the title; you do not call it yourself.

**Managing plugins.** Three services back the plugin management UI:

- `CapabilityGrantService` holds the user's revocations of base-granted capabilities.
- `PluginEnablementService` turns a whole plugin on or off, and the runtimes load or unload it.
- `PluginInstallService` holds the plugins installed at runtime; `uninstall` also deletes the
  plugin's own store, while its settings survive for a reinstall.

Everything they do is also reachable from the built-in Permissions and Plugin store settings, so
reach for them only when your product needs its own front-end.

**Required plugins.** Turning off a plugin the distribution declared it cannot run without does
nothing: the surface offers no switch for one, and `setEnabled` gives the same answer.

## Where the story is told

- [Plugin store](../distribution/plugin-store.md): the catalogue and the consent dialog.
- [The plugin system](../plugins.md): the three rungs, capabilities and what the user controls.
