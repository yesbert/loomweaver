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

popout.active;                    // is *this* window a pop-out?
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
updates.enabled;              // is a service worker registered at all?
updates.updateAvailable();    // a new version has been fetched
updates.updateFailed();       // installation failed / worker unrecoverable — do not claim "up to date"
await updates.checkForUpdate();
await updates.activateUpdate();
```

## Pop-out windows, in depth

`open` duplicates rather than moves — the original tab stays. `active` is decided once from the URL
at startup, which is why it is a plain boolean and not a signal.

## Cross-tab sync, in depth

Every write through either persistence port (`SETTINGS_STORE` / `WORKING_STATE_STORE`)
broadcasts its **key** to the app's other windows; a window that registered a reaction reads the
fresh value back through the registered source's store and applies it. The shell registers its own
keys, so plugin state inherits the behaviour. A distribution registers whatever else should follow
— most usefully its product session key:

Two rules: an applier must **not** write back (or two windows ping-pong forever), and a broadcast
never fires in the window that made the change — a `BroadcastChannel` does not deliver to its own
sender. `notifyRemoteChange` is the deliberate exception: a backend-backed store with a push
transport calls it to apply a change made on another device.

## Version and updates, in depth

The shell already drives a toast and the update badge from these signals; inject the service only if
you want your own affordance. `updateFailed` exists because a silent failure is worse than a visible
one — see [PWA & delivery](../../distribution/pwa.md).

## Where the story is told

- [Pop-out windows](../../distribution/windows-and-sync.md#pop-out-windows), [Cross-tab live sync](../../distribution/windows-and-sync.md#cross-tab-live-sync) and [PWA & delivery](../../distribution/pwa.md) in the guide.
