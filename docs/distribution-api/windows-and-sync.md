# Windows, sync and updates

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `popout-windows` · `persistence-ports` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Pop-out windows, state that follows across windows, and the version and update flow.

## Do it

```ts
const popout = inject(PopoutService);

popout.open('view:acme.inspector');
popout.open('doc/readme');
```

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

```ts
const version = inject(VersionService);
version.version.set(await fetchBuildVersion());   // writable: point it at your own build info

const updates = inject(UpdateService);
await updates.checkForUpdate();
await updates.activateUpdate();
```

## Read it

```ts
popout.active;                // is *this* window a pop-out? A plain boolean, fixed at startup

version.version();            // the running build's version
version.isPreview();          // whether that version is a preview of an unreleased line

updates.enabled;              // is a service worker registered at all?
updates.updateAvailable();    // a new version has been fetched
updates.updateFailed();       // installation failed / worker unrecoverable — do not claim "up to date"
updates.updateBroken();       // the harsher half of updateFailed: the worker cannot repair itself
```

`register` and `registerPrefix` return a disposer; there is nothing else to read on `StateSyncService`.

## What asks about unsaved work

Nothing on this page asks. `open` duplicates rather than moves, so the original tab stays. `activateUpdate` reloads the window once the new version is active.

## Switched off

`windows.popout` takes "Open in new window" off the tab menu and the docked view's menu; `popout.open` keeps working for you. Sync, version and updates have no switch.

## In depth

**Pop-out windows.** `open` duplicates rather than moves: the original tab stays. `active` is decided
once from the URL at startup, which is why it is a plain boolean and not a signal. If the pop-up
blocker swallows the window, the user gets a dialog whose button is a fresh gesture.

**Sync across windows.** Every write through either persistence port (`SETTINGS_STORE`,
`WORKING_STATE_STORE`) broadcasts its **key** to the app's other windows. A window that registered a
reaction reads the fresh value back through the registered source's store and applies it. The shell
registers its own keys, so plugin state inherits the behaviour. A distribution registers whatever
else should follow, most usefully its product session key, as the `acme.session` registration under
*Do it* shows.

**Two rules.** An applier must **not** write back, or two windows ping-pong forever. A broadcast
never fires in the window that made the change, because a `BroadcastChannel` does not deliver to its
own sender. The deliberate exception is `notifyRemoteChange`: a backend-backed store with a push
transport calls it to apply a change made on another device.

**Version and updates.** The shell already drives a toast and the update badge from these signals;
inject the service only if you want your own affordance. The signal `updateFailed` exists because a
silent failure is worse than a visible one; see [PWA & delivery](../distribution/pwa.md). Its harsher
half is `updateBroken`: the worker cannot repair itself, and `activateUpdate` drops the worker
instead of reloading into the same wall. Announcing `isPreview` is yours: the workbench marks a
preview nowhere on its own.

## Where the story is told

- [Pop-out windows](../distribution/windows-and-sync.md#pop-out-windows): what a pop-out shows and what it refuses.
- [Cross-tab live sync](../distribution/windows-and-sync.md#cross-tab-live-sync): the ports, the channel and the shell's own registrations.
- [PWA & delivery](../distribution/pwa.md): the service worker, the badge and the failure toast.
- [Sync your own state across browser windows](../samples.md#9--sync-your-own-state-across-browser-windows): a complete recipe.
