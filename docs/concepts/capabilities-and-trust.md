# Capabilities and trust

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `plugin-permissions` · `plugin-sandbox` · `plugin-store` · `access-gating`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page explains who may do what in a product built on the platform. The how-to pages linked at the
end show the code.

## Default-deny

A plugin reaches host services and host state through one context object, `ctx`, and what that
context will do for it is decided by grants. The model is default-deny: a plugin holds only what it
was explicitly granted, the grant can never exceed what the plugin itself declared, and the person
using the application can take any of it back. A plugin that acts beyond its grant gets a
`CapabilityError`, never a quiet no-op.

Everything a plugin declares about itself is a request. That is why "this plugin is required" is not
a manifest field: a distribution says it, so the one exemption a plugin could award itself does not
exist.

## Three rungs

A plugin runs at one of three levels of trust. **Trusted and in-process**: composed at build time,
the same code as the product. **Sandboxed in a frame**: the browser enforces the boundary, and
everything that crosses it is data. **Installed at runtime**: offered by a catalogue the operator
curates, consented to by the user, revocable by the user.

The frame exists for two different reasons, and the composition chooses which. Distrust: code the
operator did not write should not reach into the application hosting it. Independence: teams deploy
separately, the code is trusted, and the plugin needs the session and storage that the first reason
denies. The contract, the contributions and the permission model are the same at either level; only
what the browser enforces around the plugin changes.

The catalogue carries two different things too. What it **offers**, the user browses, consents to and
installs. What it **deploys**, the operator has already decided: active without being asked about,
with no on/off switch, because the decision was made before the user opened the application.

## Access is not a capability

A capability answers what a *plugin* may do. Access gating answers who a contribution is *for*: a
contribution says which login state and roles it needs, and the workbench hides, disables or blocks
it as the session changes. The platform owns no sign-in; it only reacts to a session snapshot the
product feeds it. The two are orthogonal, and neither is security. A grant governs a brokered call; a
gate governs presentation. Enforcement belongs to the product's backend.

## Where to act on it

- [Capabilities](../distribution/capabilities.md): granting, and naming a required plugin.
- [Frame plugins](../distribution/frame-plugins.md) and
  [Sandboxed surfaces](../weaver/sandboxed-surfaces.md): the second rung from both sides.
- [Plugin store](../distribution/plugin-store.md): the catalogue.
- [The plugin system](../plugins.md): the rungs and the lifecycle in full.
- [Access gating in a weaver](../weaver/access-gating.md), [Auth integration](../distribution/auth.md)
  and the [Access gating reference](../reference/access-gating.md).
