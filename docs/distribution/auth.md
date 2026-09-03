# Auth integration

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `access-gating`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

LoomWeaver owns **no** authentication — login, session, tokens and the identity provider live in your
product (OIDC / your own identity platform / …). The platform only *reacts* to a **session snapshot** so contributions can
gate themselves by login state and roles (see [Access gating in a weaver](../weaver/access-gating.md)).
Integrating a real product is two providers plus your own login UI.

## 1 · Feed the session — `provideAuthSource`

Map your product's session into a `Signal<AuthSnapshot>`. The factory runs in the injection context, so
it can `inject()` your own session service. The bare default is anonymous.

```ts
// src/app/app.config.ts — in the providers array
import { provideAuthSource } from '@loomweaver/shell';
import { AuthSnapshot, ANONYMOUS } from '@loomweaver/plugin-sdk';

provideAuthSource(() => {
  const session = inject(MyProductSession);          // your product's auth (OIDC/custom/…)
  return computed<AuthSnapshot>(() => {
    const u = session.currentUser();                 // reactive source of truth
    return u
      ? { authenticated: true, roles: u.roles, claims: u.claims, displayName: u.name }
      : ANONYMOUS;
  });
}),
```

This signal is the **single hook**: when it changes — login, logout, a role change — the whole shell
re-gates **reactively**. Rail/bar/view/view-action items, the command palette, keybindings, the pane
toolbar's New-Tab picker and the content-route guards all re-evaluate automatically; you never call the
host to "refresh".
`AuthSnapshot` is `{ authenticated, roles, claims, subject?, displayName? }`. `roles`/`claims` are
opaque strings the host matches but never interprets, and `claims` goes no further than your own
code — a plugin permitted the session is told `authenticated` and `roles` alone. `subject` is the
**identity anchor**: set it
whenever your product can name the signed-in principal. Encode the tenant into it if tenant switches
should count as identity changes. The identity features below stay inert without `subject`.

**Identity-change policy (multi-user browsers).** Gating is presentation-only: when user B signs in
after user A on the same browser, A's pane trees, tab titles, workspaces and every plugin's in-memory
state would otherwise stay alive. Opt in to the platform's policy instead of hand-rolling
subject-change detection:

```ts
// src/app/app.config.ts — in the providers array
provideAuthSource(() => mySnapshot, { onIdentityChange: 'reload' }),
```

With `'reload'`, the shell performs a full `location.reload()` when one **established** subject is
replaced by a **different** one. First sign-in (anonymous → subject) and sign-out (subject →
anonymous) never fire — an async session restore at boot causes no reload flicker. Pair it with
[identity-scoped stores](persistence.md#identity-scoped-stores-multi-user-browsers): the namespace then only
ever changes across a reload boundary, so the new session re-hydrates entirely from its own state.

## 2 · Own the login UI (page or dialog)

The platform ships **no** login screen — and it never opens yours on its own. Knowing exactly *when*
an unmet `access` requirement leads to your login UI is the key to wiring it correctly. There are
three situations:

| Where access fails                                                    | What the shell does                                                              | Where your login UI comes in                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Chrome — rail/bar items, view actions, commands, palette entries       | Hides the item (or disables it with `mode: 'disable'`). **Nothing opens.**        | Offer your own always-visible entry point (a "Sign in" rail item or command).           |
| A gated **content route** — deep link, tab click, in-app navigation    | Shows a neutral "sign-in required" placeholder at the same URL.                   | Register a redirect to your login page instead — step 3 below. This is the only place the platform actively sends anyone towards a login. |
| Inside your own components                                             | Nothing — `AuthContext` (distribution) / `ctx.session` (plugin) just report state. | Open your login dialog imperatively wherever your UX calls for it.                      |

**Shape A — a login page.** An ordinary, ungated routable surface. The component reads the path the
visitor was originally headed to (the `from` query parameter your redirect handler sets in step 3),
signs in through *your* product's auth service — which flips the `provideAuthSource` signal — and
navigates back. Reactivity does the rest: the route guard now passes, and every gated rail item,
command and tab appears without a reload.

```ts
// In the weaver's activate():
ctx.registerSurface({
  id: 'app.login',
  title: 'app.login.title',
  routable: { path: 'login' },
  component: LoginView,
});
```

```ts
// src/app/login-view.ts — your own component, not the platform's
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MyProductSession } from './my-product-session';

@Component({
  selector: 'app-login-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <h2 class="text-lg font-semibold text-content">Sign in to continue</h2>
      <button type="button" class="lw-btn lw-btn--primary" (click)="signIn()">Sign in</button>
    </div>
  `,
})
export class LoginView {
  private readonly session = inject(MyProductSession);
  private readonly router = inject(Router);
  // Set by the provideUnauthorizedRedirect handler (step 3); '' → land on home after sign-in.
  protected readonly from =
    inject(ActivatedRoute).snapshot.queryParamMap.get('from') ?? '';

  protected async signIn(): Promise<void> {
    await this.session.signIn(); // your auth; on success the AuthSnapshot signal flips
    await this.router.navigateByUrl('/' + this.from); // back to where the visitor was headed
  }
}
```

(The in-repo testbed ships exactly this flow — `testbed-login-view.ts` in `@loomweaver/testbed-weaver` plus the
`admin-area` redirect in `loom-testbed/main.ts` — if you want to see it run.)

**Shape B — a login dialog.** Opened from your own entry points through the host dialog service. On
success it just closes itself — no navigation needed, because every gated surface re-evaluates the
moment the signal changes. The opened component injects `DialogRef` to close itself:

```ts
// Entry point — a command; bind it to a rail item, bar button, shortcut or leave it in the palette:
ctx.registerCommand({
  id: 'app.signIn',
  title: 'app.signIn',
  run: () => {
    ctx.ui.open(SignInDialog, { title: 'app.signIn.title', icon: 'settings' });
  },
});
ctx.registerRailItem({
  id: 'app.rail.signIn',
  rail: 'activity',
  icon: 'settings',
  title: 'app.signIn.title',
  anchor: 'bottom',
  command: 'app.signIn',
});
```

```ts
// src/app/sign-in-dialog.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@loomweaver/plugin-sdk';
import { MyProductSession } from './my-product-session';

@Component({
  selector: 'app-sign-in-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-sm text-content-muted">Use your organisation account.</p>
      <button type="button" class="lw-btn lw-btn--primary" (click)="signIn()">Sign in</button>
    </div>
  `,
})
export class SignInDialog {
  private readonly ref = inject(DialogRef);
  private readonly session = inject(MyProductSession);

  protected async signIn(): Promise<void> {
    await this.session.signIn(); // flips the AuthSnapshot signal → the shell re-gates live
    this.ref.close();
  }
}
```

A declaratively gated "Sign in" entry that only shows while signed **out** is intentionally not
expressible: `access` can require a session, never forbid one. Leave the entry ungated — it is
harmless while signed in. Or hide it from your own component by reading `AuthContext`.

**Sign out** is symmetric and needs no platform call: your product resets its own session, which
flips the snapshot back to `ANONYMOUS` — the shell hides everything that required a login the moment
the signal changes. Give it an entry point that is itself gated, so it only shows while signed in:

```ts
// `run` executes outside Angular's injection context — resolve your session facade in activate()
// (or use a module-level facade, as the in-repo testbed's `testbedAuth` does), not via inject() in run().
ctx.registerCommand({
  id: 'app.signOut',
  title: 'app.signOut',
  access: { authenticated: true },
  run: () => myProductAuth.signOut(), // sets the snapshot back to ANONYMOUS
});
```

## 3 · Redirect gated routes to your login — `provideUnauthorizedRedirect`

**When it fires:** every time a navigation targets a gated content route whose `access` the current
session does not meet. That covers a deep link on first load, a tab click, and an in-app
`navigateContent`. It also fires *live*: if the session changes while the visitor is standing on a
gated route (a role drop, a sign-out in another tab), the shell re-runs the navigation and the
handler fires again. It is **route-only**: hidden chrome items never trigger it.

Without this provider, the unauthorized visit shows the host's neutral "sign-in required"
placeholder **at the same URL** — fine as a default, but it is not your branded login. The handler
receives the attempted path (URL segments without a leading slash or query string, e.g.
`admin-area` or `doc/42`) and returns an in-app URL to go to instead — or `null` to keep the
placeholder for that route:

```ts
// src/app/app.config.ts — in the providers array
import { provideUnauthorizedRedirect } from '@loomweaver/shell';

// In your bootstrap providers, next to provideAuthSource:
provideUnauthorizedRedirect(
  (attemptedPath) => `/login?from=${encodeURIComponent(attemptedPath)}`,
),
```

The `from` parameter closes the loop with the login page from step 2: after a successful sign-in the
page navigates back to `'/' + from`, and the guard — now met — lets the visitor through.

The decision can differ per route; returning `null` keeps the placeholder for routes where an
in-place message is the better UX:

```ts
// src/app/app.config.ts — in the providers array
provideUnauthorizedRedirect((attemptedPath) =>
  attemptedPath.startsWith('admin')
    ? `/login?from=${encodeURIComponent(attemptedPath)}`
    : null, // every other gated route keeps the in-place placeholder
),
```

**Dialog instead of a page:** the handler returns only URLs, so route the redirect at a small
ungated "gate" surface whose component opens your sign-in dialog (shape B above) and resolves the
outcome — forward on success, home on dismiss:

```ts
// src/lib/plugin/notes.plugin.ts — in activate(ctx)
ctx.registerSurface({
  id: 'app.signInGate',
  title: 'app.signIn.title',
  routable: { path: 'sign-in-gate' },
  component: SignInGateView,
});
```

```ts
// src/lib/views/sign-in-gate-view.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@loomweaver/shell';
import { SignInDialog } from './sign-in-dialog';

@Component({
  selector: 'app-sign-in-gate-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="py-12 text-center text-sm text-content-muted">Sign-in required…</p>`,
})
export class SignInGateView {
  private readonly router = inject(Router);
  private readonly from =
    inject(ActivatedRoute).snapshot.queryParamMap.get('from') ?? '';

  constructor() {
    void inject(DialogService)
      .open(SignInDialog, { title: 'Sign in' })
      .closed.then(() => this.router.navigateByUrl('/' + this.from));
  }
}
```

with `provideUnauthorizedRedirect((path) => '/sign-in-gate?from=' + encodeURIComponent(path))`. If
the visitor dismissed the dialog without signing in, the navigation to `'/' + from` simply runs into
the guard again and shows the placeholder — no loop, because the gate route itself is ungated.

**Client-side gating is presentation, not security** — your own backend is the real boundary, and a
hidden control is a UX affordance, not an access check. Auth gating (what a *user* may see) is orthogonal
to capability grants (what a *plugin* may do, see [Capabilities](capabilities.md)).

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../reference/distribution/index.md): everything your own code can do once the product runs.
