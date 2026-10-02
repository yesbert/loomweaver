> **Status:** approved.

## Why

A plugin author cannot tell from the plugin guides that `ctx.state` is kept per person. It is: the
store writes through the working-state port, and where a product supplies an identity that port
keeps each identity's state apart. TreeWeaver's knowledge-base plugin did not know, kept its listing
memory under one key, cleared it on every sign-out to protect the next person, and asked for the
session to name its subject so that it could separate people itself (its finding #45). The clearing
destroys exactly what the platform would have kept apart.

The contract already holds this: *Stored state belongs to the person it was stored for* and
*A plugin has a private place to keep working state* (persistence-ports). What fails is the telling,
and nothing pins the combination with a test.

## What Changes

- **The plugin-state guide, the JSDoc on the plugin's store and the brief say whose the store is:**
  per person where the product supplies an identity, shared by everyone on the browser where it does
  not, and never something the plugin has to clear on sign-out.
- **The session's documentation says why it names no subject** and points at the store for
  per-person state, so the next author who looks for `subject` finds the answer where they look.
- **A test pins it:** two identities in turn write the same plugin key under identity-scoped stores
  and each reads back its own.
- The storage-key inventory lists the plugin store's keys with their scope, if it does not already.

No new call, option or type. `subject` is not added to the session a plugin sees: the claim bag is
deliberately withheld from plugins, and the one use named for it is already served.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Both requirements named above already promise the behaviour.

## Impact

- `docs/weaver/plugin-state.md`, `llms-full.txt`.
- `platform/libs/core/plugin-sdk/src/lib/plugin/plugin-state.ts` and
  `platform/libs/core/plugin-sdk/src/lib/host-ui/host-services.ts`: JSDoc only.
- `platform/libs/core/shell/src/lib/plugin/plugin-state.service.spec.ts` or the identity-scope
  specs: the pinning test.
- TreeWeaver's finding #45 is answered rather than built; its plugin can drop the clear on sign-out.
- No legacy source is dissolved.
