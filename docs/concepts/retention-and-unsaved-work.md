# Retention and unsaved work

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page explains what happens to a surface the user can no longer see. The how-to pages linked at
the end show the code.

## Hiding is not closing

A user who splits a pane, switches a tab or collapses a sidebar expects to come back to what they were
doing. The workbench has to decide, for every surface at every one of those moments, whether to keep
it alive or let it go. One rule covers all of them: **a hidden surface is destroyed as soon as it is
clean, and unsaved work is what keeps it alive.**

That rule is what makes a workbench with many open tabs affordable. Fifty hidden editors do not mean
fifty live component trees; they mean fifty tabs, each of which is recreated when it is shown again.

## What survives a destroy

The surface's own memory does not, unless the plugin puts it somewhere. View state is that
somewhere ([View state that survives](../weaver/view-state.md)): the filter, the active sub-tab, the
expanded nodes, the scroll position, written as one shape and restored on the next mount. It travels
with the tab when the tab moves, so a split or a drag into a sidebar changes nothing the user can see.

A surface may ask to be kept regardless, or never to be kept
([Keeping a hidden surface alive](../weaver/view-state.md#keeping-a-hidden-surface-alive)). Keeping
has a price: a kept instance lives off the router, so it has no resolvers, no query parameters and no
sub-routes. [The address](the-address.md#what-has-no-address) says why.

## The unsaved-work question

Wherever an action would destroy work, the workbench asks: Save, Discard or Cancel. Closing a tab,
disabling or uninstalling a plugin and resetting a workspace all ask, because the question is asked
by the action, not by the button that triggered it. Closing the browser window asks too, in the
browser's own words. A distribution
that closes a tab from its own code asks the same question, and its call answers whether it ran.

A plugin takes part by implementing the unsaved-changes contract
([Unsaved changes](../weaver/unsaved-changes.md)): it reports whether it is dirty, it saves on
request, and it may say what should happen before a close. A sandboxed surface pushes the same facts
over its channel. The owner of the work decides; the workbench only asks. If the owner does not answer within a
bounded wait, the user is offered a way to close anyway, and an answer that still arrives counts.

## Where to act on it

- [Unsaved changes](../weaver/unsaved-changes.md): implementing `DirtySurface`.
- [View state that survives](../weaver/view-state.md): `VIEW_STATE`.
- [Surface retention](../distribution/surface-retention.md): the product-wide default.
- [Workspaces](../distribution-api/workspaces.md), [Resetting](../distribution-api/reset.md)
  and [Tabs](../distribution-api/tabs.md): which calls ask, and how they answer.
