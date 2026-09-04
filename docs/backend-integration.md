# Backend integration

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `persistence-ports` · `access-gating` · `i18n`. Where this
> page and a specification disagree, the specification is right, and that is a defect in this
> page: change the behaviour there, then explain it here.

**LoomWeaver ships no server.** The platform is the frontend (`@loomweaver/shell`, `@loomweaver/plugin-sdk`) plus
its TypeScript contracts. It never owns settings persistence, authentication, secrets or egress.
Instead it defines **ports** with local/anonymous defaults, and **your product implements them
against its own backend**. Any stack you already run works: .NET, Node, Python, Go… A distribution
runs standalone with no backend at all. You wire a backend only for multi-user/tenant persistence
and real auth.

This page is the hand-off: what a product built on the platform provides.

## Three ports and a translation loader

The platform has **three ports**: the settings store, the working-state store and the auth source.
Each is a token the shell fills with a local, anonymous default and your product overrides.
Translations are the fourth thing a backend usually answers, but the loader is a Transloco provider,
not a port; it is listed here because the swap is made in the same place.

| Seam | What you provide | Without it |
| --- | --- | --- |
| Settings persistence (port) | a settings store (`KeyValueStore`) | `localStorage` |
| Working state (port, optional) | a working-state store (`KeyValueStore`) | `localStorage` |
| Auth / session (port) | an `AuthSource` signal | everyone is anonymous |
| Translations (provider) | a Transloco loader | static files under `/i18n/` |

They are independent — adopt any subset. Each is a provider in your distribution's
`bootstrapApplication` call, placed **after `provideShell()`** so it wins the last-in-wins race for
the token the shell already filled with its default.

## 1 · Settings persistence — the `SETTINGS_STORE` port

A **string key-value** port with the `KeyValueStore` shape. The shell writes its genuine
**settings** through this seam: theme, language, text size, plugin settings, installed and disabled
plugins, capability revocations and the saved-workspaces list. It writes **nothing else** here.
Working state — view state, layout, usage traces — lives behind the separate `WORKING_STATE_STORE`
port and never reaches your backend. Writes here are rare, small and worth roaming across devices.
That is what makes a REST call per write appropriate. Values are opaque — callers serialise their
own payloads — so any backend that can store a string under a string key qualifies. The default is
`LocalStorageStore`, which is exported: wrap it rather than reimplement it if you only want to
observe or mirror what the shell stores.

```ts
// src/app/http-settings-store.ts
import { KeyValueStore, provideSettingsStore } from '@loomweaver/shell';

export class HttpSettingsStore implements KeyValueStore {
  async get(key: string): Promise<string | undefined> {
    const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, { credentials: 'include' });
    return res.status === 404 ? undefined : res.text();
  }
  async set(key: string, value: string): Promise<void> {
    await fetch(`/api/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: value, credentials: 'include' });
  }
  async delete(key: string): Promise<void> {
    await fetch(`/api/settings/${encodeURIComponent(key)}`, { method: 'DELETE', credentials: 'include' });
  }
  // Omit `peek` (network stores can't answer synchronously); the shell falls back to `get` and a default.
}

// in your providers, after provideShell():
provideSettingsStore(HttpSettingsStore),
```

### Local or network — pick one, not half of each

The optional `peek` is what tells the shell which world it is in. **Its mere presence is the
switch.** Every consumer reads `peek` first. It falls back to the asynchronous path only when the
store has no `peek` at all — a store that answers synchronously is assumed to have answered. So
consider a store that implements `peek` but returns `undefined` for keys it happens not to have
cached. It does **not** quietly fall back to `get`. Those settings are lost without a trace.

Two shapes are supported, and the choice is per store, not per key:

- **`peek` present** — reads are synchronous, so theme, layout and panel sizes apply before the first
  paint. Nothing is ever re-read afterwards, so the value your `peek` returns at construction is the
  value that session uses.
- **`peek` absent** — reads are asynchronous. Each consumer starts from its default and reconciles
  when the promise resolves, which is a brief flash of the default for anything visible.

A store that answers *some* keys locally and others over the network therefore cannot be expressed
by returning `undefined` from `peek`. You have two options. Either keep everything local: mirror
writes to your API in the background and let the next load converge. Or keep everything remote and
accept the reconcile. If you wrap another store, bind `peek` only when the inner one has it. That is
what the shell's own identity-scoping and cross-tab wrappers do, so the signal stays truthful.

A *running* window does not poll your server. If your backend can push (SSE, WebSocket), call
`StateSyncService.notifyRemoteChange(key)` when it reports a changed key: the window then re-reads
that key through the store and applies it, exactly as it does for a change made in another
browser tab. Without a push transport, a reload is the refresh boundary.

Your backend keys the store **per tenant** off the authenticated session (never off the wire). It
holds no credentials, so plaintext storage is fine. It is **not all trivial preferences**, though.
It also carries the user's installed community plugins, and their persisted capability list *is*
their grant. It carries their capability revocations too, and plugin settings blobs that may
contain whatever a plugin puts there. Treat it as **user data with integrity requirements**: authorize every read/write against the
session. The authoritative storage-key inventory is in
[Persistence stores](distribution/persistence.md). It also lists
which keys are device-level and how `provideIdentityScopedStores` separates users on a shared
browser. A convenient wire shape is a flat `{ key → value }` map with `get-all` + `set-value`; the
reference implementation used it. But the shape is yours to choose. The frontend only needs the
three async methods above.

## 1b · Working state — the `WORKING_STATE_STORE` port (optional)

The second persistence port carries what accrues from *using* the app: view state and view
instances, the palette's recently-used list, and the window-local layout keys. It has the same
`KeyValueStore` shape but the opposite write profile: frequent, debounced writes. That is why it
defaults to the device (`localStorage`), and why most distributions never touch it. Three tiers:

1. **Local** (default) — do nothing.
2. **Cross-device at boot** — provide a backend-backed store with `provideWorkingStateStore(...)`;
   a fresh tab hydrates the last persisted state through the ordinary boot path. Expect the write
   volume: every filter keystroke lands here after a 400 ms debounce.
3. **Cross-device live** — additionally pair the store with a push transport and call
   `StateSyncService.notifyRemoteChange(key)` when the backend reports a change from another
   device. Conflicts stay **last-write-wins per key** — this is state convergence, not
   collaborative editing.

## 2 · Auth / session — `AuthSource`

A provider-neutral **session snapshot signal**. You reduce your product's session into an
`AuthSnapshot`. The source can be OIDC, your own identity platform, or something custom. Whenever
the signal changes, the shell reacts: it hides or disables gated chrome, gates routes, and updates
`ctx.session`. Roles are opaque strings: the platform matches them but never interprets them. The
claim bag stays in your own composition — no plugin receives it and no gate evaluates it.

```ts
// src/app/app.config.ts — in the providers array
import { provideAuthSource, provideUnauthorizedRedirect } from '@loomweaver/shell';
import { AuthSnapshot, ANONYMOUS } from '@loomweaver/plugin-sdk';

// map your session service to a Signal<AuthSnapshot>:
provideAuthSource(() => {
  const session = inject(MySessionService);
  return computed<AuthSnapshot>(() =>
    session.user()
      ? { authenticated: true, roles: session.roles(), claims: {}, displayName: session.name() }
      : ANONYMOUS,
  );
}),

// optional: where an unauthorized visit to a gated route should go (return null → in-place placeholder):
provideUnauthorizedRedirect((attemptedPath) => `/login?from=${encodeURIComponent(attemptedPath)}`),
```

Sign-in and sign-out are **yours**: there is no platform login, and the shell never opens one on its
own. Chrome whose requirement is unmet hides or disables. Only a gated content route redirects, via
the handler above. The `from` parameter is how your login page navigates back after a successful
sign-in. Render your login as a weaver surface — a page or a dialog. Sign out by setting the
snapshot back to `ANONYMOUS`.
Complete login-page and login-dialog components live in
[building a distribution → Auth integration](distribution/auth.md).
Client-side gating is **presentation, not security** — enforce for real in your backend (reject
unauthorized calls).

Your own distribution code reads the same session back through `AuthContext` — the service the host
chrome itself uses, so a component of yours and a gated rail item can never disagree:

```ts
// any distribution code inside an injection context
import { AuthContext } from '@loomweaver/shell';

const auth = inject(AuthContext);
auth.authenticated();                       // Signal<boolean>
auth.roles();                               // Signal<readonly string[]>
auth.hasRole('admin');
auth.meets({ anyRole: ['admin', 'owner'] }); // the same predicate that gates contributions
```

On a shared browser, pair `provideAuthSource` with `{ onIdentityChange: 'reload' }` and
`provideIdentityScopedStores` — the first guarantees no in-memory state of the previous user
survives a switch, the second keeps their stored state in separate namespaces. Both are described in
[building a distribution](distribution/persistence.md#identity-scoped-stores-multi-user-browsers).

## 3 · Translations — static files or your API

By default the shell fetches its host keys from `/i18n/{lang}.json`. Each namespace you registered
with `provideTranslationNamespaces('notes', 'product')` is fetched from `/i18n/<name>/{lang}.json`.
The shell then nests each namespace under its own key, so it can never collide with a host key. That
is a plain [Transloco](https://jsverse.github.io/transloco/) loader. Transloco — not LoomWeaver —
owns the seam, so you swap the source with Transloco's own provider:

```ts
// src/app/api-translation-loader.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { provideTranslocoLoader, type Translation, type TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class ApiTranslationLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  // One endpoint per language, returning the merged bundle (host keys + every namespace).
  getTranslation(lang: string) {
    return this.http.get<Translation>(`/api/i18n/${lang}`, { withCredentials: true });
  }
}

// after provideShell():
provideTranslocoLoader(ApiTranslationLoader),
```

**Your loader replaces the whole composition.** `provideTranslationNamespaces` is read by the
built-in loader and by nothing else, so once you provide your own, it stops having any effect: the
object you return *is* the translation table, and it must already contain the host keys plus each
namespace nested under its name — host keys **flat**, namespaces **nested**:

```jsonc
// GET /api/i18n/en — the merged bundle your endpoint returns
{
  "dialog": { "close": "Close" },     // …every host group, exactly as in @loomweaver/shell's en.json
  "notes": { "list": "Notes" },       // your weaver namespace, nested under its name
  "product": { "tagline": "Weave anything" }
}
```

The simplest split is to let your endpoint do the merging (as above) — your build can read the
shell's own bundles out of `node_modules/@loomweaver/shell/i18n/` and seed them into your translation
store, so the host strings stay in step with the version you ship:

```js
// tools/seed-host-i18n.mjs — run at build/deploy time
import { readFileSync } from 'node:fs';
for (const lang of ['en', 'de']) {
  const host = JSON.parse(readFileSync(`node_modules/@loomweaver/shell/i18n/${lang}.json`, 'utf8'));
  await seedTranslationStore(lang, host); // your uploader — namespaces merge in on top
}
```

Nothing else changes: the language switcher, `reRenderOnLangChange`, and the plugin-facing rule that
keys are resolved for contribution metadata all work exactly as before.

### The first paint

The active language is stored under `lw.shell.lang` and therefore travels through your
settings store like every other setting — but the *initial* language is decided **before dependency
injection exists**, when Transloco's config is built. That early read goes straight to
`localStorage`, not through your store, and falls back to the browser's languages and then English.

With a network-backed store the consequence is visible: a fresh browser boots in the browser's
language and flips to the stored one once the store answers. If you want the very first paint to be
right, write the language into `localStorage` under `lw.shell.lang` before `bootstrapApplication`
runs — for example from a cookie your server already sets:

```ts
// src/main.ts, ABOVE bootstrapApplication(…) — the value is the bare code ('de'), not JSON:
const lang = document.cookie.match(/(?:^|; )lang=([a-z-]+)/i)?.[1];
if (lang) {
  localStorage.setItem('lw.shell.lang', lang);
}
```

It acts purely as a boot cache; your store remains the durable copy.

### A language the shell does not ship

`@loomweaver/shell` ships host bundles for **English and German**, and its built-in language switcher
offers exactly those two. A distribution can go beyond that, but it takes over the whole concern:

```ts
// src/app/app.config.ts — in the providers array
provideShell({ omit: ['shell.language'] }),           // hide the built-in two-language switcher
provideTranslocoConfig({
  availableLangs: ['en', 'de', 'fr'],
  defaultLang: 'fr',
  fallbackLang: 'en',
  reRenderOnLangChange: true,
}),
```

You then serve a complete host bundle for the new language (`/i18n/fr.json` — copy the shipped
English one and translate it) **and** a bundle for every namespace you registered; a missing
namespace file is not fatal, but its keys render as raw ids with a console warning. Switching the
language at runtime and persisting the choice become yours too: call Transloco's `setActiveLang` from
your own switcher and store the value wherever you like. One rough edge to know about: the `lang`
attribute on `<html>` keeps reporting the language the shell itself resolved (English or German), so
set it yourself if you rely on it.

## Putting it together

All three ports and the loader in one composition root. Everything below `provideShell()` overrides a default the
shell already provided, which is why the order matters:

```ts
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
    provideProductIdentity(MY_IDENTITY),

    // 1 — settings live in your backend (which already scopes them to the session)
    provideSettingsStore(HttpSettingsStore),

    // 2 — your product owns the session; a different subject reloads the app
    provideAuthSource(() => {
      const session = inject(MySessionService);
      return computed<AuthSnapshot>(() =>
        session.user()
          ? { authenticated: true, roles: session.roles(), claims: {}, subject: session.subject() }
          : ANONYMOUS,
      );
    }, { onIdentityChange: 'reload' }),
    provideUnauthorizedRedirect((path) => `/login?from=${encodeURIComponent(path)}`),

    // 3 — translations come from your API instead of static files
    provideTranslocoLoader(ApiTranslationLoader),

    // your weaver(s) and their capability grants
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),
    ...providePlugins(notesPlugin),
  ],
};
```

A distribution that adopts none of this still runs — that is the point of the defaults. Adopt them
when you have a backend to put behind them, one seam at a time.

**One port, one provider.** `provideSettingsStore` and `provideIdentityScopedStores` both fill the
same `SETTINGS_STORE` token. Listing both does not combine them: the later one wins and the other is
silently discarded. Usually you want only one of the two. A backend-backed store already isolates
users on the server, and that is exactly what identity scoping simulates for `localStorage`.
Sometimes you do need both: a shared browser *and* a remote store, so that a signed-out reload
cannot re-hydrate the previous user from a local cache. In that case, pass your store **into** the
scoping provider. It wraps both ports and shares one boot latch:

```ts
// src/app/app.config.ts — in the providers array (instead of provideSettingsStore)
provideIdentityScopedStores({
  // Synchronous at boot — read a cache you maintain yourself, not the async session:
  identity: () => localStorage.getItem('acme.last-subject'),
  settingsStore: new HttpSettingsStore(), // the wrapped store goes here, not in a second provider
  // workingStateStore: ...               // optional; defaults to localStorage
}),
```

The identity discriminator must answer **before bootstrap**, because the shell peeks
bootstrap-critical keys before first paint. So persist the last-known subject whenever your session
resolves: `localStorage.setItem('acme.last-subject', session.subject)` on login/restore, and
`localStorage.removeItem('acme.last-subject')` on sign-out. This is the same pre-bootstrap-cache
idea as the language cache in [The first paint](#the-first-paint).

The wrapped instance is constructed outside an injection context, so keep such a store free of
`inject()` — the `fetch`-based one above qualifies, an `HttpClient`-based one does not.

## The security seam lives in your backend

Per-tenant secrets, credential-injecting egress and per-tenant capability grants are **your
backend's** job — you need them anyway, with or without LoomWeaver's UI, and they can't live in the
browser. If your backend platform already provides per-tenant secret storage, session context and
request dispatch, those are exactly the pieces to build on. LoomWeaver keeps only the frontend
default-deny capability broker (which plugin may do what) and the grant map your backend feeds it.

The same boundary holds for a plugin that calls an external API with a tenant secret. The secret
lives in your backend, the call is made there, and the browser never sees it. First-party weavers
call your domain API directly; a third-party plugin that needs such a call reaches it through an
endpoint your backend offers. The platform defines no egress contract and ships no server for it.

---

Back to [architecture](architecture.md) · [building a distribution](building-a-distribution.md).
