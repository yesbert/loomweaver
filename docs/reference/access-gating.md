# Access gating

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `access-gating`. Where this page and a specification
> disagree, the specification is right, and that is a defect in this page: change the behaviour
> there, then explain it here.

LoomWeaver owns no authentication. A distribution feeds it a session snapshot; contributions declare
an `access` requirement; the host hides, disables or blocks them. This page is the complete
reference: the vocabulary, exactly which surface reacts how, and the boundaries of the mechanism.

> Snippets starting with `ctx.` go inside your plugin's `activate(ctx)`; snippets starting with
> `provide…` go in the distribution's `src/app/app.config.ts` providers array.

Narrative introductions live elsewhere —
[wiring the session](../backend-integration.md#2--auth--session--authsource) for a distribution,
[`access` and `ctx.session`](../weaver/access-gating.md) for a weaver.

## The snapshot

```ts
interface AuthSnapshot {
  readonly authenticated: boolean;
  readonly roles: readonly string[];                                   // opaque tokens
  readonly claims: Readonly<Record<string, string | readonly string[]>>;
  readonly subject?: string;                                           // stable identity anchor
  readonly displayName?: string;                                       // display only
}
```

`ANONYMOUS` is the exported baseline (`{ authenticated: false, roles: [], claims: {} }`) and the
default when no distribution provides a source.

`claims` is yours alone: no access requirement evaluates it and no plugin receives it — a plugin
permitted the session is told `authenticated` and `roles`, and nothing else. Read it from your own
composition.

Roles are **opaque**: the platform compares strings and never parses them. `admin`, `tenant:42/owner`
and a GUID are all equally valid — the meaning is yours.

`subject` is worth setting even though it is optional: it is the anchor for the identity-change
policy and for identity-scoped settings. Encode the tenant into it if switching tenants should count
as switching identity.

## The requirement

```ts
interface AccessRequirement {
  readonly authenticated?: boolean;        // true = signed in, false = only anonymous
  readonly anyRole?: readonly string[];    // at least one of these
  readonly allRoles?: readonly string[];   // every one of these
  readonly mode?: 'hide' | 'disable';      // effect when unmet; default 'hide'
}
```

All present fields must hold. An omitted requirement always passes.

The requirement rides as the `access` property on the contribution itself — the same key on every
carrier from the table below:

```ts
ctx.registerRailItem({ id: 'acme.admin', rail: 'activity', icon: 'settings', title: 'acme.admin',
  command: 'acme.admin', access: { anyRole: ['admin'], mode: 'disable' } });

ctx.registerSurface({ id: 'acme.audit', title: 'acme.audit', component: AuditView,
  routable: { path: 'audit' }, access: { anyRole: ['admin'] } });
```

**`claims` is not matched.** The field travels in the snapshot and your own code can read it through
`AuthContext`, but no `AccessRequirement` field selects on it — gating is deliberately coarse, with
no expression parser (the same choice as menu `when` filters). If you need claim-based gating today,
reduce the claim to a role token when you build the snapshot.

## Where it applies

| Carries `access` | Unmet, `hide` (default) | Unmet, `disable` |
| --- | --- | --- |
| Rail item | not rendered | rendered, inert |
| Bar item (host-drawn button) | not rendered | rendered, inert |
| Bar item (your component) | not rendered | *not supported* — it owns its cell, so it is only hidden |
| View action | not rendered | rendered, inert |
| View (panel surface) | tab and body hidden | *ignored* — a view is present or it is not |
| Command | omitted from the palette, `execute()` and its keybinding no-op | *ignored* — blocked either way |
| Content route / routable surface | placeholder at the same URL, absent from the new-tab picker | *ignored* — blocked either way |

Everything is **reactive**. A sign-in, a sign-out or a role change re-evaluates every one of these
without a reload: gated chrome appears and disappears, a gated route the user is currently on falls
back to the placeholder, and one they have just qualified for starts rendering.

Two consequences worth knowing:

- The **content tab strip does not gate content tabs.** A static or open tab whose route the session
  no longer satisfies stays in the strip and shows the placeholder when selected, rather than
  vanishing mid-session. The same holds for a `view:` tab in a pane: the tab keeps its place and the
  pane shows the placeholder. (In a **sidebar**, a gated view is hidden outright — there the tab strip
  *is* the list of views.)
- A gated route is excluded from the pane pickers and from drag-hosting **based on the live session**,
  not on the mere presence of a requirement — so "split editor" and friends work normally in a fully
  gated app.

### What an empty pane says

A pane that cannot show its surface tells you which of three things happened, so nobody goes hunting
for a layout problem that does not exist:

| Situation | What the pane shows |
| --- | --- |
| The surface exists, the session does not qualify | a padlock, "sign-in required" when signed out and "no access" when signed in without the role |
| The surface exists but cannot be mounted outside the URL pane | "this view can't be shown in a split yet" |
| Nothing by that name is registered | "view not available" — a stale link, or a plugin that is no longer composed |

The padlock uses the `lock` icon, so a distribution can replace it through `provideIcons`, and the two
messages come from `auth.requiredTitle`/`requiredMessage` and `auth.deniedTitle`/`deniedMessage`, which
[translation overrides](../distribution/icons-and-i18n.md#rewording-the-shell) can reword.

## Gated routes

A gated route registers as a real route plus a **placeholder twin** at the same path. When the
requirement is unmet the twin renders — the URL stays put and explains itself instead of silently
redirecting to home. If you would rather send the user somewhere:

```ts
// src/app/app.config.ts — in the providers array
provideUnauthorizedRedirect((attemptedPath) =>
  attemptedPath.startsWith('admin') ? `/login?from=${encodeURIComponent(attemptedPath)}` : null,
);
```

Returning `null` keeps the in-place placeholder, so one handler can do both. The decision is the
distribution's, because only it knows whether a login route exists. The complete flow — the login
page reading `?from=` and navigating back, the dialog variant, sign-out — is worked through with
copyable components in
[building a distribution → Auth integration](../distribution/auth.md).

The placeholder covers the **tab root**. A deep link into a sub-route of a gated surface falls back
to home rather than to the placeholder.

## Reading the session

Three readers, one snapshot:

```ts
// distribution code
const auth = inject(AuthContext);
auth.authenticated(); auth.roles(); auth.hasRole('admin'); auth.meets(req);

// trusted plugin — needs the `session` capability
ctx.session.authenticated(); ctx.session.roles(); ctx.session.hasRole('admin');

// sandboxed plugin surface — no ctx in the frame; the host pushes the state into your
// render(state) handler (see authoring-a-weaver → the frame UI kit), also gated by `session`,
// and re-pushes on every session change:
state.session?.roles ?? [];
```

For a sandboxed surface, **absent is not signed-out**: if the plugin was not granted `session`, the
field is missing entirely, which is a different fact from "nobody is signed in". Read it defensively
and render nothing session-dependent when it is absent. Revoking the capability at runtime stops the
push live.

One retention boundary: when the session loses access to a **retained or dirty sandboxed
surface's** route, the host stops rendering it but parks the iframe hidden instead of destroying it —
its script keeps running until the tab closes. Client-side gating is presentation, not enforcement;
real enforcement stays server-side, as everywhere on this page.

## Identity changes

Signing in as somebody else is not the same event as signing in:

```ts
// src/app/app.config.ts — in the providers array
provideAuthSource(() => mySessionSignal, { onIdentityChange: 'reload' }),
```

With this policy the app performs a full reload when an **established** `subject` is replaced by a
*different* one. First sign-in (anonymous → subject) and sign-out never fire, so an asynchronous
session restore at boot causes no flicker. A reload is a blunt instrument on purpose: it is the only
way to guarantee that no in-memory state of the previous user survives.

Pair it with
[identity-scoped stores](../distribution/persistence.md#identity-scoped-stores-multi-user-browsers)
so the stored state is separated too. That store latches the first non-empty identity per boot and
never follows a live switch, which is what keeps a write still in flight during the login transition
out of the next user's namespace.

## Two axes that look alike

| | Capability grants | Access gating |
| --- | --- | --- |
| Answers | may this **plugin** use this platform surface? | may this **user** see this contribution? |
| Granted by | the distribution (or the install dialog) | nobody — it is evaluated per session |
| Enforced at | the `ctx` broker | the host chrome, the router, the command seam |
| Fails as | `CapabilityError` | hidden, disabled, or a placeholder |

They compose without interacting: a plugin holding every capability still hides an admin-only rail
item from a non-admin, and revoking `session` from a plugin does not change what the *user* is
allowed to see.

## What this is not

Client-side gating is **presentation**. Everything it hides is still in the bundle the browser
downloaded, and the requirement itself is data an attacker can read. It exists so the UI tells the
truth about what a user can do — not to keep anyone out.

The boundary is your backend: it authenticates the session and rejects unauthorized calls. Gate the
UI for clarity; enforce on the server for real.

---

**See also:** [backend integration](../backend-integration.md) ·
[authoring a weaver](../weaver/access-gating.md) ·
[host services](../distribution-api/session.md)
