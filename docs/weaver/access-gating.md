# Access gating in a weaver

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `access-gating`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Your contributions can react to the signed-in user's login state and roles, without the platform owning
any authentication. LoomWeaver only reacts to a session snapshot the **distribution** supplies (see
[building a distribution](../building-a-distribution.md)); a weaver just declares an `access` requirement on
a contribution and the host hides, disables or blocks it. Roles are opaque strings — the host
matches, never interprets. The snapshot's claim bag reaches neither your `access` requirements nor
`ctx.session`; only the login state and the roles do.

```ts
// Rail item only an admin sees (default: hidden when unmet).
ctx.registerRailItem({ id: 'notes.admin', rail: 'primary', icon: 'settings',
  title: 'notes.admin', command: 'notes.admin', access: { anyRole: ['admin'] } });

// View action visible but inert until someone is signed in (disable mode) — actions are not
// registered separately, they ride in the surface's `actions` array:
ctx.registerSurface({ id: 'notes.list', title: 'notes.list', docks: ['left-panel'], component: NotesList,
  actions: [{ id: 'notes.sync', icon: 'upload', title: 'notes.sync', command: 'notes.sync',
    access: { authenticated: true, mode: 'disable' } }] });

// A command is blocked at the one execute() seam — its keybinding no-ops and the command palette
// omits it — until the requirement is met.
ctx.registerCommand({ id: 'notes.purge', title: 'notes.purge', access: { anyRole: ['admin'] },
  run: () => purge() });

// A whole content route: unmet → the host shows a neutral "sign-in required" placeholder at the
// same URL, and the route is not offered in the New-Tab pane picker (the surface appears in both
// once the session qualifies, no reload).
ctx.registerSurface({ id: 'admin', title: 'admin.title', component: AdminView,
  access: { anyRole: ['admin'] }, routable: { path: 'admin' } });
```

`access` fields: `authenticated?` (must be signed in / only-anonymous), `anyRole?` (at least one),
`allRoles?` (every), and `mode?: 'hide' | 'disable'` for chrome items (default `hide`). `mode` is
ignored where an item is inherently present-or-not (a whole view, a command, a route). **Client-side
gating is presentation, not security** — enforce for real on your server; a hidden control is not a
boundary. Gating is orthogonal to plugin **capabilities** (what your plugin may do): a granted plugin
can still gate an individual contribution by user role.

For **imperative** self-gating (branching your own logic, or gating your own view body), read the session
through `ctx.session` — the counterpart to declarative `access`, gated by the `session` capability:

```ts
// src/lib/plugin/session.ts — a module-level facade your components inject
// signal-shaped, so a template/computed re-reads reactively on login/logout
ctx.session.authenticated();   // boolean
ctx.session.roles();           // readonly string[] (opaque tokens)
ctx.session.hasRole('admin');  // convenience
```

Components hold no `ctx`, so hand the session through the same module-level bridge as any other
`ctx` piece (see ["Calling `ctx` from a component"](content-area.md#calling-ctx-from-a-component)):

```ts
// bridge:  in activate(ctx): notesSession.bind(ctx.session);
export const notesSession = { session: undefined as PluginSession | undefined,
  bind(s: PluginSession): void { this.session = s; } };

// in a component — reactive, because PluginSession is signal-shaped:
protected readonly canPurge = computed(() => notesSession.session?.hasRole('admin') ?? false);
```

A **sandboxed** surface has no `ctx` in its own frame, so the host _pushes_ the session into the surface
state instead. The same capability gates it: declare `session` (and have it granted) or the host omits
the field, and your surface sees `state.session === undefined`. That is deliberately **not** a signed-out
snapshot — "not granted" and "signed out" are different facts, so read it defensively
(`state.session?.roles ?? []`) and draw nothing session-dependent when it is absent. Revoking the
capability at runtime stops the push live, without a reload.

The **login UI itself is yours**, not the platform's — and the platform never opens it on its own.
Unmet chrome simply hides or disables; only a gated **content route** actively sends the visitor
anywhere, and only if the distribution registered a redirect. So a login has two shapes, and both are plain weaver contributions. A login **page** is an ungated
routable surface:
`ctx.registerSurface({ id: 'login', title: 'login.title', routable: { path: 'login' }, component: MyLoginView })`.
The distribution's `provideUnauthorizedRedirect` points gated routes at it. A login **dialog**
opens from your own entry point through `ctx.ui.open(MyLoginDialog)`. Either way its "sign in"
action calls your product's auth service, which updates the session snapshot the distribution feeds
to the platform — the whole shell re-gates reactively, no reload (**signing out** just resets that
snapshot to anonymous). Complete, copyable components for both shapes — including the
`?from=` return-path round trip — live in
[building a distribution → Auth integration](../distribution/auth.md).

## Where next

- [Auth integration](../distribution/auth.md): the distribution's `provideAuthSource`, and complete login page and dialog components.
- [Access gating](../reference/access-gating.md): the complete `access` reference, gated routes and the readers of the session.
- [Capabilities and trust](../concepts/capabilities-and-trust.md): why access is not a capability.
