> **Status:** approved.

## Why

NextPA found in 0.17.0 (finding F-046) that a change of person reloads at the previous person's
address. With `onIdentityChange: 'reload'`, the workbench reloads the page when an established
subject is replaced by a different one. A sign-out does not reload and keeps the address, so that
the same person signing in again is back where they were. When a different person signs in after
that sign-out, the reload loads the address the previous person left: in NextPA's chat application
the previous person's assistant, in the Studio a record of another tenant, answered "not found".

The identity-scoped stores do their part. The address is the one piece of the previous person's
state that survives, and it decides what the next person sees first. The option's own documentation
promises "the guaranteed-clean user switch", and the contract says only that a change of person
takes effect across a reload, not where that reload lands.

## What Changes

- **A change of person opens the application afresh.** The reload no longer reloads the current
  address. It opens the application at its start, exactly as a person opening it without a path
  would: the new person lands in their own arrangement or in the declared start workspace.
- **A pop-out window closes on a change of person.** It shows one surface of the previous person and
  has nothing of the next person's to show.
- The policy itself enters the contract: when it fires, when it does not, and where it lands. Until
  now only the guide described it.
- No option. The value `'reload'` keeps its name and gains the landing; there is no `'here'`,
  because no case is known in which a different person wants the previous person's address.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `persistence-ports`: a requirement for the opt-in reload on a change of person, including where it
  lands.

## Impact

- `platform/libs/core/shell/src/lib/auth/identity-change.ts` and its spec: the reload opens the
  served base, and a pop-out window closes.
- `platform/libs/core/shell/src/lib/auth/auth-context.ts`: the JSDoc of `onIdentityChange` says
  where the reload lands.
- `docs/distribution/auth.md`, `llms-full.txt`: the same in the guide and the agent reference.
- A testbed case for the chat scenario: one person, sign-out, a different person, assert the address
  after the reload.
- NextPA finding **F-046**. Once a release carries this, NextPA adds the scenario "Another person
  signs in after a sign-out" and its browser test.
- Behaviour change without an API change. Ships as a patch.
