# Persistence stores

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `persistence-ports`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The shell persists its user-local state through **two** ports of the same `KeyValueStore` shape,
split by what the data *is*:

- **`SETTINGS_STORE`** carries genuine **settings** — deliberate decisions: theme, language, text
  size, plugin settings, installed/disabled plugins, capability revocations and the
  saved-workspaces list. Rare, small, roaming-worthy writes; this is the port you back with your
  product backend.
- **`WORKING_STATE_STORE`** carries **working state** — what accrues from using the app: view state
  and view instances, the palette's recently-used list, and the window-local layout keys (pane
  trees, panel sizes, collapse state, item order, view placement). Frequent debounced writes; it
  defaults to the device and usually stays there.

The split is structural: nothing but settings can ever reach your settings backend, no matter what
keys the shell adds later. Both ports default to `localStorage`, so the bare platform and tests
need no wiring. A distribution that wants **settings** to follow the user across devices (or be
tenant-scoped) provides its own settings store — e.g. one backed by your own backend over `/api`
(the platform ships no server; the backend is yours):

```ts
// src/app/http-settings-store.ts
import { inject } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { provideSettingsStore, type KeyValueStore } from '@loomweaver/shell';

// provideSettingsStore(Class) constructs the class inside the injection context,
// which is what makes the field-level inject() here legal.
class BffSettingsStore implements KeyValueStore {
  private readonly http = inject(HttpClient);

  get(key: string): Promise<string | undefined> {
    return firstValueFrom(this.http.get(`/api/settings/${key}`, { responseType: 'text' }));
  }
  set(key: string, value: string): Promise<void> {
    return firstValueFrom(this.http.put(`/api/settings/${key}`, value)).then(() => undefined);
  }
  delete(key: string): Promise<void> {
    return firstValueFrom(this.http.delete(`/api/settings/${key}`)).then(() => undefined);
  }
  // No `peek`: a network store can't answer synchronously — the shell hydrates asynchronously and,
  // for bootstrap-critical values (theme/language), reconciles once the store resolves. Own Transloco's
  // `defaultLang` yourself if you need the very first render in the user's language.
}

// in the bootstrap providers — don't forget the HttpClient itself:
provideHttpClient(),
// place AFTER provideShell() — last provider for SETTINGS_STORE wins:
provideSettingsStore(BffSettingsStore),
```

`KeyValueStore` is a plain string key-value shape (`get`/`set`/`delete`, optional synchronous
`peek`); callers serialise/validate their own payloads. The same shape backs the working-state
port: `provideWorkingStateStore(...)` swaps it for a backend-backed one when working state should
travel across devices — a fresh tab then continues where another device left off. For *live*
cross-device updates, pair that store with a push transport (SSE, WebSocket) and call
`StateSyncService.notifyRemoteChange(key)` when your backend reports a change; conflicts stay
last-write-wins per key (state convergence, not collaborative editing).

**A rejecting store is safe.** Prefer resolving with `undefined` over rejecting — but the store above
rejects as written, because `firstValueFrom` on a 401 does. The shell therefore treats a rejected `get`
as "no value" everywhere it reads: the setting falls back to its default instead of leaving an unhandled
rejection. The user silently loses that setting, so a store that answers `undefined` on an expected miss
and rejects only on real faults still gives you the better signal.

**The boot never overwrites your saved layout.** With a `peek`-less store the pane tree
(`lw.shell.pane-trees:<workspaceId>`) loads asynchronously, so the shell holds back every layout write until that load
resolves — a tab auto-opened by the boot navigation cannot persist a half-empty tree over the real one,
and if the load *fails* nothing is written at all (a rejection is not an empty layout). A failed first
load is retried once after a short delay to ride out a transient fault; if that retry also fails the
shell keeps layout writes disabled for the session rather than overwrite a tree it never read. Once the
tree resolves, an auto-opened deep-link tab is reconciled back into it rather than dropped, and a deep
link survives a programmatic redirect during boot (only a real back/forward navigation abandons it).

## Storage-key inventory

The shell persists its state under the keys below. This list is authoritative — a distribution that
swaps or wraps the store (for example to scope state per signed-in identity) keys its decisions off
it. Each key has three independent axes. **Port** — which store it flows through.
**Scope** — **device** keys hold preferences that reasonably stay with the browser. Every other key
holds **identity** state. With the default `localStorage` store on a shared browser, identity state
survives sign-out and reload, and is re-hydrated for whoever uses the app next. **Sync** — a
**synced** key follows across the app's other windows of the same origin live ([cross-tab sync](windows-and-sync.md#cross-tab-live-sync)). **Per-window** keys stay local, so two windows can look different. The
layout keys are per-window on purpose — and they share **one** persisted slot per workspace: the
window that last changed its layout shapes the next boot (a permanently different setup is its own
workspace). The layout keys are sliced **per workspace** (`…:<workspaceId>`; the built-in default
workspace uses the id `default`), so a backend store never re-uploads every workspace on one change.
Two keys deserve extra care: `lw.shell.pane-trees:<workspaceId>` serialises
each tab's `path`, **literal `title`**, `icon` and `instance` in clear text, and
`lw.plugin-settings:*` carries plugin-owned data.

| Key | Holds | Port | Scope | Sync |
| --- | --- | --- | --- | --- |
| `lw.shell.theme` | light/dark choice | settings | device | synced |
| `lw.shell.lang` | active language | settings | device | synced |
| `lw.shell.font-scale` | text-size setting | settings | device | synced |
| `lw.shell.active-workspace` | id of the active workspace | working state | identity | per-window |
| `lw.shell.pane-trees:<workspaceId>` | pane/tab layout of every dock, incl. per-tab path/title/icon/instance, the **order of each pane's tabs** and which pane carries the URL (per-dock `{ tree, primary }` — pane ids are stable, the URL role is the pointer) | working state | identity | per-window |
| `lw.shell.hidden-views:<workspaceId>` | which sidebar views that workspace hides | working state | identity | per-window |
| `lw.shell.rail-items` | which rail entries the user hid, and which rail each one sits in | settings | identity | synced |
| `lw.shell.panels` | which sidebars the user collapsed | working state | identity | per-window |
| `lw.shell.panel-sizes` | sidebar widths | working state | identity | per-window |
| `lw.shell.item-order` | user reorder of rail items and sidebar views (content tabs order on their pane, above) | working state | identity | per-window |
| `lw.shell.workspaces` | user-defined workspaces — name + saved baseline | settings | identity | synced |
| `lw.shell.view-instances:<viewId>` | named saved instances of a view | working state | identity | synced |
| `lw.shell.view-state:<instanceId>` | a view instance's opaque `VIEW_STATE` blob | working state | identity | synced |
| `lw.shell.disabled-plugins` | plugins the user turned off | settings | identity | synced |
| `lw.shell.capability-revocations` | user capability revocations | settings | identity | synced |
| `lw.shell.installed-plugins` | community plugins installed at runtime | settings | identity | synced |
| `lw.shell.command-mru` | recently used palette commands ("Recently used" section) | working state | identity | synced |
| `lw.plugin-settings:<pluginId>:<sectionId>` | a sandboxed plugin's settings values | settings | identity | synced |
| `lw.plugin-state:<pluginId>:<key>` | a plugin's own working state (`ctx.state`) | working state | identity | synced |
| `lw.plugin-state-keys:<pluginId>` | which keys that plugin has used, so an uninstall can delete them | working state | identity | synced |

Two resets divide this table between them. `shell.workspace.reset` clears the two
`<workspaceId>`-scoped keys of the active workspace; **`shell.app.reset`** clears
`lw.shell.rail-items`, `lw.shell.panels`, `lw.shell.panel-sizes`, `lw.shell.item-order` and every
`lw.shell.view-instances:*` with the `lw.shell.view-state:*` blobs behind them. Everything else in the
table is a choice rather than an arrangement, and neither reset touches it.

The shell does not namespace these keys by user or tenant itself — scoping is a distribution
decision, made at the seams above (`provideSettingsStore` / `provideWorkingStateStore`, or the
identity wrapper below). The **sync** axis is likewise handled for you: the shell registers each
synced key with `StateSyncService`; a distribution only wires its own keys ([Windows and sync](windows-and-sync.md#cross-tab-live-sync)).

## Identity-scoped stores (multi-user browsers)

With the default store on a shared browser, one user's identity-level state (pane trees with
clear-text tab titles, workspaces, plugin settings) is re-hydrated for whoever signs in next. A
distribution with a real login scopes it per identity with the built-in wrapper instead of
hand-rolling one:

```ts
// src/app/app.config.ts — in the providers array
import { provideIdentityScopedStores, DEVICE_LEVEL_KEYS } from '@loomweaver/shell';

provideIdentityScopedStores({
  // Synchronous discriminator — null/undefined/'' = anonymous (keys stay unscoped, exactly the
  // default behaviour). Typically your session's stable subject; encode the tenant into it if
  // tenant switches should separate state. Read it from a synchronous cache (below), NOT from an
  // async session restore.
  identity: () => localStorage.getItem('acme.last-subject'),
  // Optional: exact keys that stay device-level. REPLACES the default — spread to extend:
  deviceKeys: [...DEVICE_LEVEL_KEYS, 'acme.kiosk-mode'],
  // Optional: the stores to wrap (your backend-backed ones). Both default to localStorage.
  // The instances are constructed OUTSIDE the injection context — keep them inject()-free
  // (a fetch-based store qualifies; the HttpClient-based BffSettingsStore above does not).
  settingsStore: new FetchSettingsStore(),
  // workingStateStore: new FetchWorkingStateStore(),
});
```

The wrapper covers **both** persistence ports with one shared boot latch — another user's view
state and layout are scoped away exactly like their settings. Never list `provideSettingsStore`
*next to* this provider — both fill the same `SETTINGS_STORE`
token, the later silently discards the other. One port, one provider; the composition with a
remote store is worked through in
[backend integration → One port, one provider](../backend-integration.md#putting-it-together).

While signed in, identity-level keys are stored as `lw.id.<identity>:<key>`; device keys and the
anonymous session keep the plain keys, so a distribution without auth is untouched. The shell peeks
bootstrap-critical keys before first paint, so `identity()` must answer synchronously at boot —
persist the last-known subject yourself whenever your session resolves, e.g.:

```ts
// wherever your session becomes known (login success, session restore):
localStorage.setItem('acme.last-subject', session.subject);
// and clear it on sign-out:
localStorage.removeItem('acme.last-subject');
```

Pair the store with `provideAuthSource(..., { onIdentityChange: 'reload' })` so a user switch
re-hydrates cleanly (see [Auth integration](auth.md)).

The stores **latch the first non-empty identity per boot** and never follow a live switch. A change
to a *different* subject only takes effect through the reload boundary. Writes still in flight
during the login transition — a pending debounce, a commit from the closing login dialog — therefore
land in the departing user's namespace, never the next user's. The anonymous→first-sign-in upgrade
— which deliberately never reloads — still re-latches once; after sign-out the latch keeps pointing
at the signed-out user for the rest of the boot. Return the live session's subject; the store owns
the latching.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
