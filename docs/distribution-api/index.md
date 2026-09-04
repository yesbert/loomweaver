# Distribution API

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `host-services` · `gesture-configuration` · `platform-composition`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Everything a user does in the workbench by hand, your product's own code can do too. This area is the
lookup for it: what a distribution may inject and call, the rules behind it, and one page per area.

**A plugin never injects these.** A weaver gets a brokered subset through `ctx` (`ctx.ui.confirm()`,
`ctx.registerSettingsSection()`, `ctx.session`), and the broker checks a capability first
([default-deny](../distribution/capabilities.md)). That indirection is the
whole isolation story: it is what lets the same weaver run sandboxed in an iframe, where a direct
injection would be impossible.

**Your distribution does inject them.** Your composition root, your login page and your own
components are the application, not a guest in it. Every service below is `providedIn: 'root'`, so
`inject(TheService)` is all it takes.

`Shell` renders the dialog and toast outlets, so there is nothing to place in a template.
`DialogOutlet` and `ToastOutlet` exist for a distribution that builds its own root component instead.

## The rules behind every page

- **A switch moves the control, it does not remove the capability.** `provideShellFeatures` and
  [`FeatureSwitches`](switches.md) take a gesture away from the user; the service that performs it
  keeps working for you.
- **The twin is the same code.** Every action on these pages is the one the built-in control runs,
  with the same guards. Closing a pane from code asks about unsaved work exactly as the × does.
- **Facts are signals.** What you can read re-evaluates where you read it; there is no separate
  event saying the same thing.
- **Prevention belongs to the owner.** The surface that holds unsaved work decides whether it may be
  closed; a service asks it, and answers whether it ran where a caller needs to know.

## I want to …

| I want to …                                             | Call                                                                                                                | Page                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| decide what the product is made of                      | the providers, indexed by intent                                                                                    | [Composition](composition.md)                            |
| add chrome without a plugin                             | `provideViews`, `provideBarItems`, `provideRailItems`                                                               | [Composition](composition.md#do-it)                      |
| read a capability switch                                | `switches.content.splitRight()`                                                                                     | [Switches](switches.md#read-it)                          |
| change a switch while the app runs                      | `switches.update({ content: { splitRight: false } })`                                                               | [Switches](switches.md#do-it)                            |
| open a document as a tab                                | `tabs.open({ path, title })`, `tabs.navigateTo(path)`                                                               | [Tabs](tabs.md#do-it)                                    |
| pin, keep or close a tab                                | `tabs.pin(path)`, `tabs.keep(path)`, `tabs.close(path)`                                                             | [Tabs](tabs.md#do-it)                                    |
| bring a tab to the front where it already lives         | `tabs.revealContentTab(path)`                                                                                       | [Tabs](tabs.md#do-it)                                    |
| know which tab is active                                | `tabs.activeContent()`, `tabs.tabs()`                                                                               | [Tabs](tabs.md#read-it)                                  |
| split the content area                                  | `panes.splitRight()`, `panes.splitDown(handle)`                                                                     | [Panes](panes.md#do-it)                                  |
| close a pane or undo the split                          | `panes.closePane(handle)`, `panes.unsplit()`                                                                        | [Panes](panes.md#do-it)                                  |
| fill the area with one pane, or collapse one            | `panes.maximize(handle)`, `panes.minimize(handle)`, `panes.restore()`                                               | [Panes](panes.md#do-it)                                  |
| move the address to a pane, move a tab into one         | `panes.focus(handle)`, `panes.moveTab(path, handle)`                                                                | [Panes](panes.md#do-it)                                  |
| read the arrangement                                    | `panes.panes()`, `panes.isSplit()`, `panes.activePane()`                                                            | [Panes](panes.md#read-it)                                |
| switch to a workspace                                   | `workspaces.switchTo(id)`                                                                                           | [Workspaces](workspaces.md#do-it)                        |
| save the arrangement as a workspace, or as the baseline | `workspaces.saveCurrent(name)`, `workspaces.saveBaseline()`                                                         | [Workspaces](workspaces.md#do-it)                        |
| reset one workspace, or all                             | `await workspaces.reset(id?)`, `await workspaces.resetAll()`                                                        | [Workspaces](workspaces.md#do-it)                        |
| rename or remove a saved workspace                      | `workspaces.rename(id, name)`, `await workspaces.remove(id)`                                                        | [Workspaces](workspaces.md#do-it)                        |
| know which workspace is active, and which changed       | `workspaces.activeId()`, `workspaces.hasChanges()`, `workspaces.changedIds()`                                       | [Workspaces](workspaces.md#read-it)                      |
| collapse or expand a sidebar                            | `sidebars.collapse(regionId)`, `sidebars.expand(regionId)`, `sidebars.toggle(regionId)`                             | [Sidebars](sidebars.md#do-it)                            |
| set a sidebar's width                                   | `sidebars.setWidth(regionId, px)`                                                                                   | [Sidebars](sidebars.md#do-it)                            |
| hide a view, or show it again                           | `sidebars.hideView(viewId)`, `sidebars.showView(viewId)`                                                            | [Sidebars](sidebars.md#do-it)                            |
| read the sidebars                                       | `sidebars.regions()`, `sidebars.hiddenViews()`                                                                      | [Sidebars](sidebars.md#read-it)                          |
| put the whole arrangement back                          | `await appReset.reset({ workspaces: true })`                                                                        | [Resetting the application](reset.md#do-it)              |
| ask the user something                                  | `dialogs.confirm(…)`, `dialogs.prompt(…)`, `dialogs.open(MyDialog)`                                                 | [Dialogs and toasts](dialogs-and-toasts.md#do-it)        |
| show progress while a promise runs                      | `await dialogs.withProgress({ message }, work)`                                                                     | [Dialogs and toasts](dialogs-and-toasts.md#do-it)        |
| show a toast, or take it down again                     | `toasts.show({ message, kind })`, `toasts.dismiss(id)`                                                              | [Dialogs and toasts](dialogs-and-toasts.md#do-it)        |
| add or open a settings section                          | `settings.register(…)`, `settings.open(sectionId)`                                                                  | [Settings](settings.md#do-it)                            |
| remove a settings section again                         | `handle.dispose()` on what `register` returned                                                                      | [Settings](settings.md#do-it)                            |
| run a command from code                                 | `commands.execute(id)`, `await commands.run(command)`                                                               | [Commands](commands.md#do-it)                            |
| show a shortcut the way the shell does                  | `formatChord('mod+k')`                                                                                              | [Commands](commands.md#in-depth)                         |
| know who is signed in                                   | `auth.authenticated()`, `auth.roles()`, `auth.meets(access)`                                                        | [Session](session.md#read-it)                            |
| follow light and dark in my own UI                      | `theme.resolvedTheme()`, `theme.setMode(mode)`                                                                      | [Appearance](appearance.md#read-it)                      |
| set the text size                                       | `textSize.setScale('lg')`                                                                                           | [Appearance](appearance.md#do-it)                        |
| open the plugin store                                   | `store.open()`                                                                                                      | [Plugins at runtime](plugins-at-runtime.md#do-it)        |
| turn a plugin off, revoke a capability, uninstall       | `enablement.setEnabled(plugin, false)`, `grants.setGranted(plugin, capability, false)`, `install.uninstall(plugin)` | [Plugins at runtime](plugins-at-runtime.md#do-it)        |
| open a surface in its own window                        | `popout.open(target)`                                                                                               | [Windows, sync and updates](windows-and-sync.md#do-it)   |
| make my own state follow across windows                 | `sync.register(…)`, `sync.announce(key)`                                                                            | [Windows, sync and updates](windows-and-sync.md#do-it)   |
| apply a change my backend pushed from another device    | `sync.notifyRemoteChange(key)`                                                                                      | [Windows, sync and updates](windows-and-sync.md#do-it)   |
| point the version at my own build info                  | `version.version.set(v)`                                                                                            | [Windows, sync and updates](windows-and-sync.md#do-it)   |
| react to a new version                                  | `updates.updateAvailable()`, `await updates.activateUpdate()`                                                       | [Windows, sync and updates](windows-and-sync.md#read-it) |
| check for a new version by hand                         | `await updates.checkForUpdate()`                                                                                    | [Windows, sync and updates](windows-and-sync.md#do-it)   |

## The pages

- [Composition](composition.md): the provider surface, and chrome without a plugin
- [Switches](switches.md) · [Tabs](tabs.md) · [Panes](panes.md) · [Workspaces](workspaces.md) · [Sidebars](sidebars.md) · [Resetting the application](reset.md)
- [Dialogs and toasts](dialogs-and-toasts.md) · [Settings](settings.md) · [Commands](commands.md) · [Session](session.md)
- [Appearance](appearance.md) · [Plugins at runtime](plugins-at-runtime.md) · [Windows, sync and updates](windows-and-sync.md)

The per-symbol reference is the package itself: `@loomweaver/shell` ships typed declarations with JSDoc
on every public member, which your editor shows in place. A plugin never injects any of this; it goes
through `ctx`, which is described in [Authoring a weaver](../authoring-a-weaver.md).
