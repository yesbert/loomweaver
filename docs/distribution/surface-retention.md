# Surface retention

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page is the product-wide answer to what happens to a surface the user cannot see: destroy it, or
keep the instance alive. You need it when you flip that default with `provideShell({ retention })`,
and to know which of your own actions ask about unsaved work before anything is destroyed.

## The default

A hidden surface is destroyed as soon as it is clean; what "hidden" and "clean" mean, and why the
rule is what makes many open tabs affordable, is on
[Retention and unsaved work](../concepts/retention-and-unsaved-work.md#hiding-is-not-closing). The
product sets the default for every surface that says nothing about itself:

```ts
provideShell({ retention: 'retain' })   // default: 'destroy'
```

A surface's own declaration wins over that default in either direction: `retain: 'always'` keeps an
instance alive under `'destroy'`, `retain: 'never'` destroys it under `'retain'`.

## What flipping the default costs

A kept surface is mounted off the router, in every pane that shows it, and sees a fabricated route
without resolvers, query parameters or sub-routes
([A kept surface lives off the router](../concepts/retention-and-unsaved-work.md#a-kept-surface-lives-off-the-router)).
Flipping the default to `'retain'` applies that trade to every surface that does not opt out with
`'never'`, so a product that flips it should know which of its surfaces rely on live routing.

A sandboxed (`iframe`) surface is hidden in place rather than destroyed, and is moved without a reload
where the browser can move an element atomically; where it cannot, and on a split or a drag into
another pane everywhere, it is rebuilt
([A sandboxed surface and the atomic move](../weaver/view-state.md#a-sandboxed-surface-and-the-atomic-move)).
`container` surfaces are always rebuilt.

## Which of your actions ask

"Clean" is the plugin's word: a surface that implements `DirtySurface`
([Unsaved changes](../weaver/unsaved-changes.md)) is never destroyed while it reports unsaved changes,
and the workbench asks before any action would destroy it
([The unsaved-work question](../concepts/retention-and-unsaved-work.md#the-unsaved-work-question)).
Three of those actions are the product's own:

- Disabling, uninstalling or updating a plugin, from the switches in *Permissions* and from the plugin
  store, runs the unsaved-changes dialog over the affected instances before anything is destroyed. The
  surface's `surfaceBeforeClose` veto is deliberately not consulted there: a plugin cannot veto its
  own removal.
- Resetting a workspace asks the same way, and the reset call answers whether it ran
  ([Resetting](../distribution-api/reset.md)).
- Switching a workspace never asks. Each workspace remembers its own arrangement, and a dirty surface
  survives the switch parked, under the same rule as any hidden surface
  ([Workspaces](../concepts/workspaces.md)).

## Nothing to wire

All of this rides on `provideShellRouter()`; there is nothing to provide. The complete author-side
recipe (component, save flow, `saveOn: 'hide'`, veto, and the sandboxed variant) is
[recipe 8 in Samples](../samples.md#an-editor-with-unsaved-changes).

## Where next

- [Retention and unsaved work](../concepts/retention-and-unsaved-work.md): why hiding is not closing, and who asks.
- [Unsaved changes](../weaver/unsaved-changes.md): `DirtySurface` and the veto on the weaver side.
- [View state that survives](../weaver/view-state.md): `VIEW_STATE` and `retain` as a surface author meets them.
