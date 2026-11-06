> **Status:** approved.

## Why

Two moments of a session end worse than they have to when something underneath does not answer.

Applying an update reloads the page even where activating the new version failed. The user has
just agreed to discard unsaved work for that update, so the reload throws the work away and lands
on the version they were already running. Nothing was gained and the work is gone.

The first sign-in of a session that began anonymously adopts the person's namespace. Where the
port never answers the read, or a handler registered for the adoption never returns, the adoption
never settles. Writes stay held for the rest of the session and reads keep falling through to the
anonymous namespace, so nothing the user does reaches the person's namespace.

## What Changes

- An update whose activation fails does not reload. The session stays as it was, the update stays
  on offer, and the user is told it could not be activated and to try again later.
- The update asks about unsaved work through the same question service the rest of the workbench
  uses, instead of reading the open dialogs to learn when the question was answered. No behaviour
  changes with that.
- An adoption that has not settled after ten seconds is given up. The workbench carries on in the
  person's namespace, writes held during the adoption are stored there as after an adoption that
  found nothing, the anonymous data stays where it is, and the user is told that local work could
  not be taken over and stays on this device. A later session that begins anonymously adopts again.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: an update whose activation fails keeps the session.
- `persistence-ports`: an adoption that never answers is given up after a bounded time, which is a
  limit of the requirement that an adoption reads before it writes.

## Impact

- The shell's update service, the unsaved-work question service and the identity-scoped stores.
- Two new translation keys in every shipped language.
- `docs/updating.md`, the guides on offline updates and identity-scoped stores, and `llms-full.txt`
  where they describe the behaviour.
