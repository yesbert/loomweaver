# Session

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `access-gating` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The read side of [auth](../backend-integration.md#2--auth--session--authsource). `provideAuthSource`
feeds the snapshot in; this reads it back out, including the exact predicates the chrome uses to
hide or disable contributions.

## Do it

```ts
const auth = inject(AuthContext);

auth.hasRole('admin');
auth.meets({ anyRole: ['admin', 'owner'] });  // "may this happen at all?"
auth.visible(access); auth.disabled(access);  // "how should a chrome item render?"
```

## Read it

```ts
auth.state();                                 // the whole AuthSnapshot
auth.authenticated();                         // boolean signal
auth.roles();                                 // readonly string[] signal
```

`state()` is the whole `AuthSnapshot`; `authenticated()` and `roles()` are derived from it. `hasRole`, `meets`, `visible` and `disabled` read the same snapshot, so they are reactive where they are called.

## What asks about unsaved work

Nothing on this page asks; reading the session closes nothing.

## Switched off

No switch governs the session. `provideAuthSource` decides what the snapshot holds, and the `access` on a contribution decides what the chrome does with it.

## In depth

**Presentation, not security.** Client-side gating is presentation. Enforce for real in your backend.

**The chrome's own predicates.** `visible(access)` and `disabled(access)` are the exact predicates
the chrome uses to hide or disable a contribution, so a control of yours can agree with a built-in
one.

## Where the story is told

- [Access gating](../reference/access-gating.md): the complete `access` reference.
- [Auth integration](../distribution/auth.md): feeding the session, owning the login UI, redirecting gated routes.
