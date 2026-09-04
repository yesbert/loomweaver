# Surfaces and panes

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surfaces` · `panes` · `content-tabs`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A plugin declares one kind of thing, a surface, and the user decides where it appears. The how-to
pages linked at the end show the code.

## One contract for everything shown

A plugin author declares a **surface**: a title, a component (or an iframe, or an arrangement of
child surfaces) and what the surface can do, such as having an address of its own or existing as
several named copies. The plugin does not say where the surface will appear. The workbench decides
that, and the user changes it.

A docked view and an addressable screen are one declaration. A user can drag a sidebar view into the
main area and it keeps working, because the surface never knew which of the two it was.

## A pane is a tab group

The work area is a tree of **panes** the user shapes: split one in two, drag work from one to
another, blow one up to fill the screen, collapse one away. Every pane is the same thing wherever it
sits. A sidebar is a pane too, which is what lets work move between a sidebar and the content area at
all.

Work that is open appears as a strip of **tabs** on the pane holding it. A tab has a lifetime the user
controls: a transient preview that the next click replaces, an ordinary tab, a tab pinned in place.
The workbench's job is to make those transitions predictable and to lose no work in any of them.

## What follows from it

- A surface fills its pane; the host insets nothing of its own. A product asks for an inset once, and
  a single surface may differ.
- State that should survive a move travels with the tab, not with the pane
  ([Retention and unsaved work](retention-and-unsaved-work.md#what-survives-a-destroy)).
- The arrangement of panes and the content inside them are two things with two owners. A tab is
  content and belongs to the plugin that contributed the surface; the split around it is arrangement
  and belongs to the user, or to the distribution when it declares a [workspace](workspaces.md).

## Where to act on it

- [Surfaces in a sidebar](../weaver/sidebar-surfaces.md) and
  [The content area](../weaver/content-area.md): declaring a surface for either place.
- [Containers](../weaver/containers.md): a surface that is itself a small arrangement.
- [Layout](../distribution/layout.md): which regions a product has for panes to live in.
- [Panes](../distribution-api/panes.md) and [Tabs](../distribution-api/tabs.md): the
  same splits, moves and tab changes from a distribution's own code.
