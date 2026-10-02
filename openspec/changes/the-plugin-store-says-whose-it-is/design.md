## Context

`PluginStateService` reads and writes through the working-state store. `provideIdentityScopedStores`
wraps that store, so a plugin key lands under the identity's namespace like every other identity
key. The guides for plugin authors describe the store as "namespaced to your plugin id" and stop
there; the identity scoping is told only to the distribution author.

## Goals / Non-Goals

**Goals:** an author reading the plugin guide or the SDK types knows the store is per person and
what follows from that.

**Non-Goals:** exposing `subject`, `displayName` or any claim to plugins; an identity-scoped variant
of the store; changing what happens on uninstall.

## Decisions

**Answer with documentation and a test, not with `subject`.** The finding offers two remedies:
`subject` on the session, or an identity-scoped store a plugin can rely on. The second exists. The
first would give every plugin holding the `session` capability a stable identifier for the person,
which the session's contract withholds on purpose, in order to rebuild what the store already does.

**State the dependency honestly.** The separation exists where the product supplies an identity. A
product that does not has one namespace per browser, and the plugin cannot change that. The guide
says so, and says that this is the product's decision to make, not the plugin's to repair.

**Pin it at the service, not end to end.** One spec composing the identity-scoped store with the
plugin store shows the key landing in the identity's namespace and being read back per identity. The
identity-change policy and the reload have their own tests.

## Risks / Trade-offs

- [The test finds that plugin state is not in fact separated, for instance through the key index] →
  then this is a code defect against the requirement, and the change grows a fix task before the
  documentation is written; the proposal is revised rather than the finding ignored.
