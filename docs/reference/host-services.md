# Host services

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `ui-primitives` · `commands` · `theming` · `product-
> identity` · `host-services` · `gesture-configuration`. Where this page and a specification disagree, the specification is right, and that is
> a defect in this page: change the behaviour there, then explain it here.

The shell's runtime services are part of the published contract, so a distribution can drive the
chrome it composed: open a dialog from its own login page, register a settings section, read who is
signed in, run a command, react to an update. This page lists every service you may inject, what it
is for, and where the boundary sits.

## Who injects what

**A plugin never injects these.** A weaver gets a brokered subset through `ctx` — `ctx.ui.confirm()`,
`ctx.registerSettingsSection()`, `ctx.session` — and the broker checks a capability first
([default-deny](../building-a-distribution.md#capabilities-default-deny)). That indirection is the
whole isolation story: it is what lets the same weaver run sandboxed in an iframe, where a direct
injection would be impossible.

**Your distribution does inject them.** Your composition root, your login page and your own
components are the application, not a guest in it. Every service below is `providedIn: 'root'`, so
`inject(TheService)` is all it takes.

The `Shell` component already renders the dialog and toast outlets, so there is nothing to place in a
template. `DialogOutlet` and `ToastOutlet` are exported only for a distribution that builds its own
root component instead of using `Shell`.

## Dialogs — `DialogService`

The same three lanes `ctx.ui` exposes, plus the raw `open`. `message` is Markdown; `tone` colours the
icon and the confirming button.

This first example is complete — a component injects the service as a field and calls it from an
`async` method. **Every later snippet on this page follows the same shape** (a field-level
`inject(...)` plus a method body) and shows only the body:

```ts
// src/app/inspector.ts — an application component (not a plugin)
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogService } from '@loomweaver/shell';

@Component({
  selector: 'app-danger-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" class="lw-btn lw-btn--danger" (click)="closeAccount()">Close account</button>`,
})
export class DangerZone {
  private readonly dialogs = inject(DialogService);

  protected async closeAccount(): Promise<void> {
    if (await this.dialogs.confirm({ title: 'account.close', message: 'This **cannot** be undone.', tone: 'danger' })) {
      // …
    }
  }
}
```

```ts
// more of the same service, inside such a method:
await dialogs.alert({ message: 'Signed out.', tone: 'success' });
const name = await dialogs.prompt({ message: 'Workspace name?' });   // string | null

const ref = dialogs.open(MyLoginDialog, { size: 'md', title: 'auth.signIn' });
const result = await ref.closed;

await dialogs.withProgress({ message: 'Migrating…' }, migrateEverything());
```

`open()` returns a [`DialogRef`](../authoring-a-weaver.md#host-ui--ctxui): `closed` (a promise of the
result), `close(result)`, and `maximized`/`toggleMaximized()` for dialogs opened with
`maximizable: true`. `progress()` returns a handle you close yourself; `withProgress()` ties the
dialog to a promise and is what you want almost always.

`confirm`, `alert` and `prompt` share `title?`, `message` (Markdown), `tone?` and `icon?`, plus their
own labels. `confirm` additionally takes `requireConfirmation` — a typed guard for a destructive
action, whose `validate` returns `null` to allow and a string to block (a non-empty string is shown
as the reason, an empty one blocks silently).

`OpenOptions`, for a dialog with your own component as the body:

| Option | Effect |
| --- | --- |
| `title`, `icon`, `tone` | the host-drawn frame around your component |
| `data` | passed to your component through the `DialogRef` |
| `buttons` | host-drawn footer buttons; each `{ label, variant?, value? }` resolves `closed` with its `value` |
| `size` | `md` (default), `lg`, `xl` |
| `dismissable` | backdrop click and Escape close the dialog; default `true` |
| `maximizable` | the frame offers a maximize/restore control |
| `bare` | render only your component — no frame, no padding, no footer; you own the chrome |
| `align` | `center` (default) or `top`, which pins the panel near the top on every width |

`bare` and `align: 'top'` exist for the two cases the standard frame does not fit: a surface that
draws its own two-column chrome (the settings dialog), and a panel whose height follows a filtering
list (the command palette), which would otherwise jump around the centre as results change.

## Toasts — `NotificationService`

```ts
const toasts = inject(NotificationService);

const id = toasts.show({ message: 'settings.saved', kind: 'success', timeoutMs: 4000 });
toasts.dismiss(id);
```

`kind` is `info | success | warning | error`. **Omitting `timeoutMs` makes the toast sticky** — it
stays until the user dismisses it, which is right for "an update is waiting" and wrong for almost
everything else. A single `action` adds a button, passing the same `id` twice replaces the toast
instead of stacking a second one, and `notifications` is a signal of what is currently on screen.

## Settings — `SettingsService`

The host settings surface is a registry: the shell registers its own sections, plugins contribute
through `ctx`, and a distribution can do both — add sections and hide any of them.

```ts
// src/app/… — inside an injection context (a component, or provideEnvironmentInitializer)
const settings = inject(SettingsService);

const handle = settings.register({
  id: 'acme.workspace',
  title: 'acme.workspace.title',
  group: 'settings.group.options',
  order: 20,
  rows: [
    { id: 'acme.autosave', label: 'acme.autosave.label', control: {
        kind: 'toggle', value: () => prefs.autosave(), set: (v) => prefs.setAutosave(v),
    } },
  ],
});

settings.open('acme.workspace');   // open the dialog on a specific section
handle.dispose();                  // remove the section again
```

Control kinds and the "each control owns its own storage" rule are the same ones a weaver uses —
see [authoring a weaver](../authoring-a-weaver.md#settings-sections). Registering an existing id
replaces that section in place. To *remove* built-in settings, prefer
`provideShell({ omit: ['setting:…'] })`, which is declarative and lasting;
[curating the settings surface](../building-a-distribution.md#curating-the-settings-surface) lists
the ids.

## Commands — `CommandService`

One behaviour, many triggers. Anything a rail item, menu entry, keybinding or the palette can run,
your code can run too — and through the same access check, so a command your session may not use
stays unavailable everywhere at once.

```ts
// src/app/… — inside an injection context
const commands = inject(CommandService);

commands.execute('shell.openSettings');
commands.execute('shell.tab.close', { tabId: 'doc/readme', closable: true });   // with a menu context

commands.commands();                       // every registered command (signal)
commands.available(someCommand);           // does the current session satisfy its `access`?

await commands.run(someCommand);           // fire a resolved command and get what it answered
```

`execute` fires and forgets; `run` is the same one place the behaviour happens, but it answers what
the command returned and rejects with what it threw, for a caller that has to tell the two apart. A
plugin reaches the same thing through `ctx.invokeCommand` — see
[callable commands](callable-commands.md).

The seam a plugin reaches through has a name of its own: `CommandInvoker`, bound to the
`COMMAND_INVOKER` token and implemented by `CommandInvocationService`. `provideShell()` binds it, and
an injector without the shell composed gets one that reaches nothing and says so. You need it only
where you compose plugin runtimes yourself, which a distribution does through `provideShell()`
anyway.

`execute` on an unknown id is a no-op with a console warning, and on a command the session may not
run it is a no-op too — so a command a plugin removed, or one the current user has no right to,
cannot break your chrome. `KeybindingService` is what binds every command's `shortcut` globally;
`provideShell()` starts it, and there is nothing to call yourself.

To render a shortcut in your own UI, use `formatChord('mod+k')` (exported from `@loomweaver/shell`) — it
returns ⌘K on macOS and Ctrl+K elsewhere, using the same platform detection as the shell, so your
hint can never disagree with the binding.

## Session — `AuthContext`

The read side of [auth](../backend-integration.md#2--auth--session--authsource). `provideAuthSource`
feeds the snapshot in; this reads it back out — including the exact predicates the chrome uses to
hide or disable contributions.

```ts
const auth = inject(AuthContext);

auth.state();                                 // the whole AuthSnapshot
auth.authenticated();                         // boolean signal
auth.roles();                                 // readonly string[] signal
auth.hasRole('admin');
auth.meets({ anyRole: ['admin', 'owner'] });  // "may this happen at all?"
auth.visible(access) / auth.disabled(access); // "how should a chrome item render?"
```

Client-side gating is presentation. Enforce for real in your backend.

## Content tabs — `ContentTabsService`

The content area is router-addressed, so most navigation is just routing. This service is for the
things routing alone cannot express — the tab strip's own state.

```ts
const tabs = inject(ContentTabsService);

tabs.navigateTo('doc/readme');                 // navigate, fire-and-forget
tabs.open({ path: 'doc/readme', title: 'README.md', titleIsLiteral: true });
tabs.keep('doc/readme');                       // promote a preview tab
tabs.pin('doc/readme'); tabs.unpin('doc/readme');
tabs.close('doc/readme'); tabs.closeOthers('doc/readme');
tabs.revealContentTab('doc/readme');           // focus the tab where it already lives

tabs.activeContent();                          // { surfaceId, path, params } | null
tabs.tabs();                                   // the visible strip
tabs.quickOpenTargets();                       // everything `mod+p` can reach
```

`revealContentTab` is the one to reach for when a tab may live in a split pane: it activates it in
place instead of re-opening a duplicate in the primary pane.

## Version and updates — `UpdateService`, `VersionService`

```ts
const version = inject(VersionService);
version.version.set(await fetchBuildVersion());   // writable: point it at your own build info

const updates = inject(UpdateService);
updates.enabled;              // is a service worker registered at all?
updates.updateAvailable();    // a new version has been fetched
updates.updateFailed();       // installation failed / worker unrecoverable — do not claim "up to date"
await updates.checkForUpdate();
await updates.activateUpdate();
```

The shell already drives a toast and the update badge from these signals; inject the service only if
you want your own affordance. `updateFailed` exists because a silent failure is worse than a visible
one — see [PWA & delivery](../building-a-distribution.md#pwa--delivery).

## Light and dark — `ThemeService`

```ts
const theme = inject(ThemeService);

theme.mode();            // ThemeMode — what the user picked: 'light' | 'dark' | 'system'
theme.resolvedTheme();   // ResolvedTheme — what is actually rendered: 'light' | 'dark'
theme.setMode('dark');   // persists, and mirrors to other tabs
```

The shell already ships a mode switch, persists the choice through the settings store and toggles
the `dark` class on `<html>`, which is what flips the `--lw-*` token ladder. Inject the service when
**your own UI has to agree with it** — most often to mirror the mode onto another framework's
switch, so the page cannot end up half dark:

```ts
// Bootstrap 5.3 reads data-bs-theme; keep it in step with ours.
effect(() => {
  document.documentElement.setAttribute('data-bs-theme', theme.resolvedTheme());
});
```

Use `resolvedTheme` for that, never `mode`: `mode` can be `system`, which is not a value any other
framework understands. See [bringing your own CSS
framework](../manual-setup.md#bringing-your-own-css-framework).

## Switches — `FeatureSwitches`

```ts
const switches = inject(FeatureSwitches);

switches.content.splitRight();                        // Signal<boolean>: the current value
switches.current();                                   // the whole ShellFeatures set as it stands
switches.update({ content: { splitRight: false } }); // change switches while the app runs
```

Each group (`switches.content`, `switches.sidebar`, `switches.rail`, `switches.workspaces`,
`switches.windows`, `switches.commands`) is a `SwitchSignals<…>`: one read-only `Signal<boolean>` per
switch, under the same names as the declaration. What you pass to `provideShellFeatures` is the **starting value**. From there the switches are live:
`update` takes the same partial shape as the declaration, merges group by group, and every control,
menu entry, drop target and shortcut that honours a switch follows it at once. Read a switch where you
draw your own control for the same capability, so the two never disagree:

```ts
// Your own split button, shown only while the capability is on.
@if (switches.content.splitRight()) { <button (click)="split()">Split</button> }
```

Three rules to know before you reach for `update`:

- **A switch moves the control, it does not remove the capability.** With `content.close` off, the ×
  and the close entries are gone for the user, and `ContentTabsService.close()` still works for you,
  with the same unsaved-work question the × would have asked. That is what lets you hide our control
  and offer the action from your own.
- **Switching off acts forward, not backward.** A pane the user split stays split when you turn
  `splitRight` off; a collapsed sidebar stays collapsed when you turn `sidebar.collapse` off, with no
  control left to expand it. Put the state where you want it before you take the way away.
- **The shell does not remember a switch.** `update` writes nothing to any store, and the next start
  begins from the declaration. If a change should survive, and for whom (device, user, tenant), store
  it yourself with the [persistence stores](../building-a-distribution.md#persistence-stores-optional)
  and replay it with `update` at start.

`SHELL_FEATURES` stays exported as the declaration itself; read the current value from the service,
never from the token.

## Pop-out windows — `PopoutService`

```ts
const popout = inject(PopoutService);

popout.active;                    // is *this* window a pop-out?
popout.open('view:acme.inspector');
popout.open('doc/readme');
```

`open` duplicates rather than moves — the original tab stays. `active` is decided once from the URL
at startup, which is why it is a plain boolean and not a signal.

## Cross-tab sync — `StateSyncService`

Every write through either persistence port (`SETTINGS_STORE` / `WORKING_STATE_STORE`)
broadcasts its **key** to the app's other windows; a window that registered a reaction reads the
fresh value back through the registered source's store and applies it. The shell registers its own
keys, so plugin state inherits the behaviour. A distribution registers whatever else should follow
— most usefully its product session key:

```ts
const sync = inject(StateSyncService);

// The first argument names where the fresh value is read back from: 'settings',
// 'working-state', or 'external' for state persisted outside both ports (the applier
// then receives undefined and re-reads its own storage).
const off = sync.register('external', 'acme.session', () => session.reloadWithoutPersisting());
sync.registerPrefix('settings', 'acme.doc:', (raw, key) => docs.apply(key, raw));
sync.announce('acme.session');        // announce a write to out-of-port state to the OTHER windows
sync.notifyRemoteChange('acme.doc:1'); // run the applier in THIS window (backend push transport)
```

Two rules: an applier must **not** write back (or two windows ping-pong forever), and a broadcast
never fires in the window that made the change — a `BroadcastChannel` does not deliver to its own
sender. `notifyRemoteChange` is the deliberate exception: a backend-backed store with a push
transport calls it to apply a change made on another device.

## Plugins at runtime

Three services back the plugin management UI. Everything they do is also reachable from the built-in
Permissions and Plugin store settings, so reach for them only when your product needs its own
front-end for it.

```ts
// src/app/… — inside an injection context
inject(CapabilityGrantService).setGranted('notes', 'navigation', false);  // user revocation
inject(PluginEnablementService).setEnabled('notes', false);               // unload the whole plugin
inject(PluginInstallService).uninstall('community-charts');               // installed-at-runtime only
```

They are described together in [the plugin system](../plugins.md).

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
contribution — which is how the testbed moves the update badge into a sidebar footer. `provideShell({
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

---

**See also:** [building a distribution](../building-a-distribution.md) ·
[backend integration](../backend-integration.md) · [authoring a weaver](../authoring-a-weaver.md)
