# Content-area routing

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `routing` · `content-tabs`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The content area is URL-addressed. It is the Angular router underneath, and
[Routing](../reference/routing.md) is the reference for what that means in practice.

Weavers contribute **routable surfaces**
(`ctx.registerSurface({ routable: { path } })`). Visiting a route opens its tab, and a pane draws a
tab strip whenever it holds tabs; switching between tabs preserves state. The one exception is a
surface that declares `routable: { chromeless: true }` — a full-area screen such as login or
onboarding, which never becomes a tab and shows no strip while it is active.

Exactly **one** pane carries the address at a time; every other pane renders what it holds. That role
follows the user: clicking a tab (or into a pane) hands the address to that pane, and navigating to a
surface another pane already holds reaches it **there** instead of opening a second copy beside the
current one. That holds however the navigation was started — an ordinary link inside content, a rail
item, a command, browser history — so a workspace that parks a surface in its own pane keeps working
whatever points at it. For this to work, the distribution sets up the router with
**`provideShellRouter()`**. Call it **instead of** `provideRouter([])`. It bundles
`withDisabledInitialNavigation()`, the state-preserving reuse strategy, and the route sync as one
unit, so you can't half-configure it. Pass your own non-content
routes as `provideShellRouter([...routes])` if the distribution has any. Authoring the routes/tabs
themselves is the weaver's job — see [authoring a weaver](../weaver/content-area.md).

**Preview tabs (optional).** The content area supports preview tabs — a weaver opens with
`preview: true` to reuse a single italic slot. It is **on by default**; opt out for the whole
distribution with `provideShellFeatures({ content: { preview: false } })`, which makes every
`openContentTab` a permanent tab.

**User reordering (optional).** Users can drag or keyboard-reorder the host chrome — content tabs,
rail items and view tabs within their own band, with the order persisted user-locally. It uses
`@angular/cdk/drag-drop` (a `@loomweaver/shell` peer dependency) and is **on by default**. Toggle per
container with
`provideShellFeatures({ content: { reorderTabs: false }, rail: { reorder: false }, sidebar: { reorderViews: false } })`.

**Carrying an item to the *other* bar is a different capability**, because a user meets it as one:
`sidebar.moveViews` covers moving a view between the left and right sidebars and
`rail.moveItems` the same for rail entries — each taking the menu entry, the drag *and*
`Alt+Shift+Arrow` together.

**The user curates a sidebar the way they curate the rail.** A right-click on a view tab offers *Move
to other sidebar* and *Hide*; a right-click on the strip offers **Customize views**, which opens a
dialog listing every view with **where it sits**: hidden, left, or right. Picking a place moves it
there, so the dialog does the hiding and the moving in one control, and a view hidden on the left
comes back wherever you send it. The dialog has a search field and scrolls, because a product with
many views would otherwise be a wall of rows. Which views a sidebar holds is part of the workspace,
so switching workspaces changes it; the rail's own curation stays put.

The dialog is the command `shell.views.customize`, so it is reachable from the command palette,
bindable to a shortcut, callable from an item of your own, and removable with
`provideShell({ omit: ['shell.views.customize'] })`. The menu entry is a contribution of its own
(`menu:shell.views.customize`), so you can drop the entry and keep the command.

**Panes & splits (always on).** Every dock (centre + both sidebars) is a tree of **tab-group panes**.
Users split a pane by dragging a tab to its edge or via a tab's **Split right / Split down** menu, move
tabs between groups by dragging onto a strip, and resize with the dividers.
Exactly one centre pane is the **URL pane** (it drives deep links / back-forward); the rest are workspace
state. The whole arrangement — pane trees, sizes, active tabs — is persisted user-locally and reload-safe.
There is always **exactly one active workspace**: a fresh installation starts in the built-in *Default*
workspace, and everything the user rearranges belongs to the workspace they are standing in. **Named
workspaces** (`shell.workspace.manage`) are self-remembering — switching restores each workspace's own
live arrangement exactly, without asking and without discarding anything. Each workspace also has a
**baseline**: for a user-saved workspace the explicitly saved snapshot ("Save as new" captures the
current arrangement and switches to it; "Save workspace" updates the active one's baseline). **Reset
workspace layout** (`shell.workspace.reset`) discards the active workspace's live arrangement and re-applies its
baseline after a confirm — for the Default workspace that is the declared factory layout. It is
reachable from the palette, and also as a button in the workspaces dialog. Saved workspaces,
theme, language and named view instances are kept. This is core behaviour with no provider to wire.
It rides on the same [persistence stores](persistence.md) as the rest of the chrome.

## Following tabs

A weaver may declare a permanent tab as a **facet of the current selection** rather than a document of
its own (`routable: { follows: true }`, see
[authoring a weaver](../weaver/sub-routes-and-follows.md)). The host then
substitutes the parameter values of the address it is on, by name, into that tab's pattern.

Part of that mapping is domain knowledge the platform cannot have — a query parameter carried by one
tab deciding a path segment on another, say. Supply it and the platform keeps its substitution for
everything you pass on:

```ts
// src/app/app.config.ts
provideTabAddressResolver(({ surfaceId, params, activePath }) =>
  surfaceId === 'treaties' && params['cedentId']
    ? `cedents/${params['cedentId']}/treaties/${treatyFor(activePath)}`
    : null,   // null → the host's own substitution
),
```

The resolver is a `TabAddressResolver`, and its `TabAddressInput` carries the following surface's
`surfaceId` and `pattern`, the `params` of the address you are on and that `activePath` in full. Your
answer is taken at its word: the host checks reachability only for its own computation, where an
address that leads nowhere means the facet has no selection yet and its tab is left out.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
