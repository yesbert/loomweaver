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
store.title();  // the title the catalogue configured
```

```ts
// src/app/… — inside an injection context
inject(CapabilityGrantService).setGranted('notes', 'navigation', false);  // user revocation
inject(PluginEnablementService).setEnabled('notes', false);               // unload the whole plugin
inject(PluginInstallService).uninstall('community-charts');               // installed-at-runtime only
```

## The store, in depth

Opening works whether or not you kept the built-in entries (`setting:shell.pluginStore`,
`shell.openPluginStore`), and with no catalogue composed the store opens and offers nothing to
install, showing only what is installed or deployed. `configure(title)` is what
`providePluginCatalog` uses to brand the title; you do not call it yourself.

## Managing plugins, in depth

Three services back the plugin management UI. Everything they do is also reachable from the built-in
Permissions and Plugin store settings, so reach for them only when your product needs its own
front-end for it.

They are described together in [the plugin system](../../plugins.md).

## Where the story is told

- [Plugin store](../../distribution/plugin-store.md): the catalogue and the consent dialog.
- [The plugin system](../../plugins.md): the three rungs, capabilities and what the user controls.
