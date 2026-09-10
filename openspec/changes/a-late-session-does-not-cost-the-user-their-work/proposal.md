> **Status:** approved

## Why

A product that answers who the user is only after its server has replied loses the user's stored
arrangement, and the workbench takes it from them silently.

Measured on `main`, with a stored arrangement in the signed-in namespace and an identity that
becomes known one asynchronous step after the first paint:

| moment | what the workbench holds | what is stored for the user |
|---|---|---|
| opening, identity unknown | the declaration, read from the anonymous namespace | the user's own arrangement |
| identity becomes known | unchanged, nothing is read again | unchanged |
| any ordinary action afterwards | the declaration | **the declaration** — the user's arrangement is gone |

The workbench reads the anonymous namespace, finds nothing, takes that for a first visit, builds the
declared arrangement, and then adopts the user's namespace and writes that arrangement over what was
stored there. The contract already allows the adoption — "the first sign-in of an anonymous session
may adopt the new namespace directly" — but says nothing about what may be carried into it.

The second fault is what made this visible at all, and is a defect of its own. The workbench
remembers the address the application was opened at and completes that opening when the content it
names becomes reachable, without noticing that the user has since gone somewhere else. Measured:
opened at `/dashboard`, user navigates to `/knowledge-base`, a plugin registers a route afterwards,
and the workbench pulls the user back to `/dashboard`.

## What Changes

- Adopting an identity's namespace SHALL re-read what the workbench holds before anything is written
  back into it, so state stored for a person is never replaced by what was built while nobody was
  known.
- Completing the opening address SHALL stop where the user has navigated since: the workbench
  finishes an opening, it does not overrule a person.
- No new surface, no new option. Both are the existing behaviour, made safe.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `persistence-ports`: adds what adopting a namespace may and may not carry into it.
- `routing`: adds the limit on completing the address the application was opened at.

## Impact

- `platform/libs/core/shell/src/lib/persistence/boot-latched-scope.ts` — decides the namespace and
  latches it, without telling anyone that it did.
- `platform/libs/core/shell/src/lib/persistence/identity-scoped-stores.ts` — wraps both ports.
- `platform/libs/core/shell/src/lib/persistence/state-sync.service.ts` — already re-reads state that
  changed elsewhere; the same channel is what an adoption needs.
- `platform/libs/core/shell/src/lib/regions/content/routing/content-router.ts` — completes the
  opening address without a guard against the user having moved.
- Every distribution whose identity is not answerable at the first paint. NextPA Studio is one: its
  session service holds no last-known subject, so the first paint is anonymous. The upgrade removes
  the loss for them; the flash of the declared arrangement before the session lands remains until a
  product answers the identity at boot.
