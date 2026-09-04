# Layout: regions and docks

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`provideLayout` declares which **regions** sit where in the border topology. A region has a `type`
(its anatomy) and a `dock` (where it sits):

- **Docks:** `top` · `bottom` · `left` · `right` · `center`.
- **Region types:**
  - `bar`: a thin strip of items in `start | center | end` slots (top bar, status bar).
  - `rail`: the rail, which the workbench labels _Activity bar_, holding icon triggers for commands.
  - `panel`: a sidebar surface that hosts views (the host auto-tabs multiple views).
  - `content`: the main content area (docks `center`). **URL-addressed** (routes), not views.

A weaver targets a region by its **id**, never by its dock or type: `registerSurface({ docks:
['left-panel'] })`, `registerRailItem({ rail: 'primary' })` and `registerBarItem({ bar: 'status-bar' })`
name the ids the scaffold declares. Left and right are symmetric; [shell
anatomy](../reference/shell-anatomy.md#the-region-ids-the-scaffold-declares) lists the ids.

> **Non-routable surfaces render only in `panel` regions.** A surface's home dock (`docks[0]`) may name
> any region id, but one docked into a `content` (or `bar`/`rail`) region is a silent no-op (dev-mode
> warns). The content area is **routed**: a weaver fills it with a surface that declares
> `routable: { path }` (see [The content area](../weaver/content-area.md)).

Collapsing, resizing and hiding views in the sidebars from your own code is `SidebarService` in the
[host services](../distribution-api/sidebars.md).

## Panes and splits

Every dock (centre + both sidebars) is a tree of **tab-group panes**. Users split a pane by dragging a
tab to its edge or via a tab's **Split right / Split down** menu, move tabs between groups by
dragging onto a strip, and resize with the dividers. Exactly one centre pane is the **address pane** (it
drives deep links / back-forward); the rest are workspace state. The whole arrangement (pane trees,
sizes, active tabs) is persisted user-locally and reload-safe. Each of these gestures has its switch
in [Switching capabilities off](switching-capabilities-off.md).

## Curating a sidebar

The user curates a sidebar the way they curate the rail. A right-click on a view tab offers _Move
to other sidebar_ and _Hide_; a right-click on the strip offers _Customize views_, which opens a
dialog listing every view with **where it sits**: hidden, left, or right. Picking a place moves it
there, so the dialog does the hiding and the moving in one control, and a view hidden on the left
comes back wherever you send it. The dialog has a search field and scrolls, because a product with
many views would otherwise be a wall of rows. Which views a sidebar holds is part of the workspace,
so switching workspaces changes it; the rail's own curation stays put.

The dialog is the command `shell.views.customize`, so it is reachable from the command palette,
bindable to a shortcut, callable from an item of your own, and removable with
`provideShell({ omit: ['shell.views.customize'] })`. The menu entry is a contribution of its own
(`menu:shell.views.customize`), so you can drop the entry and keep the command.

## Where next

- [Sidebars](../distribution-api/sidebars.md): collapse, resize, hide and show by region id from your own code.
- [Panes](../distribution-api/panes.md): the panes your tabs sit in, read and driven from your own code.
- [Surfaces and panes](../concepts/surfaces-and-panes.md): why a pane is a tab group and a surface can sit anywhere.
