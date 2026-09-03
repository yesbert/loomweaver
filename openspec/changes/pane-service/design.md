## Context

See proposal.md, *Why*. What shapes the approach is where the arrangement behaviour sits today and
how panes are identified.

The content dock is a tree held by `PaneTreeService`: leaves carry a stable `id` and their tabs, one
leaf is the *primary* and carries the address (`primaryId(dock)`), and the pointer moves rather than
the pane (`pointAt`, `focusPane`). `PaneChromeService` holds which pane is maximised (one per dock)
and which are minimised. `PaneMoveService` moves tabs between panes by drag semantics
(`moveToStrip`, `moveToEdge`) and offers `splitFromUrlGroup`, which is a *move* split. Every method
takes `dock` and `paneId`.

The behaviour a control runs is spread over its callers:

- `PaneView` (a secondary pane, and panes inside containers): `splitPane` duplicates its shown path
  through `paneTree.splitPane`; `closePane` collects the unsaved-work candidates of all its tabs,
  guards, and then either `collapsePrimary` (if it is the primary) or `closePane`; `toggleMaximize`
  and `minimize` call the chrome service; `focusPane` calls `paneTree.focusPane` and navigates to the
  path it returns.
- `ContentArea` (the primary pane): `split` duplicates `activeSplitPath()` through
  `paneTree.splitPane`; `closePrimary` calls `TabClosingService.closePrimaryPane`, which guards,
  collapses and navigates; `toggleMaximize` and `minimize` call the chrome service directly.
- `shell.content.splitRight` (seeded command): if the dock is split, `unsplit`; else, if
  `offRouterMountable(registry, auth, activeTabRoot)` allows it, `splitPane` on the primary.
- `PaneTreeService.unsplit` keeps only the primary leaf. Whatever the secondary panes held is
  dropped, and no caller guards it today.

Two observations drive the design. The primary pane is closed in two different ways (the content
area's path guards and navigates; the pane view's path only collapses). And the duplicate check that
protects a split from producing a pane that cannot show its content runs only for the command, not
for the toolbar buttons.

## Goals / Non-Goals

**Goals:**

- One service, `PaneService` in `regions/pane/`, is the only place that knows how to split, close,
  unsplit, maximise, minimise, restore, focus and move a tab in the content dock. Every trigger calls
  it. The distribution injects it.
- Arguments are the user's: an optional `PaneHandle`, defaulting to the pane that carries the
  address. No `dock`, no `paneId` crosses the published boundary.
- Facts as signals: `panes()`, `activePane()`, `isSplit()`, `maximized()`, `minimized()`.
- Every guard the controls have, the service has; where a control lacks one the tree would need,
  the service supplies it and the control inherits it.

**Non-Goals:**

- Sidebar panes and container docks. The service addresses `CONTENT_DOCK`; the rest is a later
  slice, and the service's shape does not preclude it.
- Tab behaviour. `ContentTabsService` stays as it is; the escalate cycle that `ContentArea` and
  `PaneView` both carry is tab behaviour and is noted below as a follow-up, not folded in here.
- Any change to `PaneTreeService`, `PaneChromeService` or `PaneMoveService` beyond what the service
  needs to call. They stay internal.
- No new switch, no new command, no new persistence key.

## Decisions

**A handle is a branded string over the pane id, and the dock is implied.** `PaneHandle` is
`string & { readonly [brand]: true }`, created only by the service from a leaf id in the content dock.
The distribution cannot construct one and cannot read it as an id, which keeps the promise that it
never learns how a pane is identified, while the service resolves it in one step. Because pane ids
are stable for the life of a pane (the pointer moves, not the pane), the handle is too, across focus
changes and restarts. A handle whose pane no longer exists resolves to nothing, and every action
returns without doing anything.

Alternatives: an object handle `{ id }` was rejected because it exposes the id and invites
comparison by identity where two reads would hand out two objects. A handle that also carries the
dock was rejected for this slice because only one dock is addressed; when sidebars come, the brand
can carry the dock without changing the published shape.

**The service resolves "no handle" to the primary pane.** `activePane()` is the primary's handle;
every action's optional handle defaults to it. This matches what the toolbar on the address pane
does and what a distribution's own toolbar will mostly mean.

**Facts are computed from the tree and the chrome, not exposed as the tree.** `panes()` maps the
leaves of the content dock to `PaneFacts { handle, showing, itemCount, carriesAddress, maximized,
minimized }`, in tree order. `isSplit()`, `maximized(): PaneHandle | null` and
`minimized(): readonly PaneHandle[]` are computed from the same sources. Nothing about nesting or
ratios is published; a distribution that needs the tree has asked for something this change does
not give.

**Two layers: the behaviour is dock-aware and internal, the published face is the content area.**
`PaneView` draws panes in every dock (the content area, containers, sidebars), so the behaviour it
calls has to take a `dock`. An internal `PaneActions` service holds it, with `dock` and `paneId`
arguments; the published `PaneService` is the face over `CONTENT_DOCK` that translates handles and
holds no behaviour of its own. This is the shape the rules ask for (a facade translates, the
behaviour lives once) and it keeps the way open for a sidebar face later without touching the
behaviour.

**Split duplicates, and checks first.** `splitRight(handle?)` and `splitDown(handle?)` take the
pane's shown path and call `paneTree.splitPane(dock, paneId, orientation, path)`, exactly as both
controls do today. Before that, the service applies the check the drag already applies when it
decides what a pane may host (`offRouterMountable`: a bare, parameterless, component-backed route
the session may reach; a view path always; the home path never). The seeded command used the same
check; the content area's toolbar used a looser one (any matching route), which could offer a split
whose sibling the pane cannot show. The one predicate now lives in the actions service and the
content area's `splittable` reads it, so a visible button never leads to a dead split.

**Closing a pane has one implementation, and it is the guarded one.** `closePane(handle?)` collects
the unsaved-work candidates of every tab in the pane and runs them through `SurfaceCloseGuard`. For
the primary it then does what `TabClosingService.closePrimaryPane` does: collapse and navigate to
the promoted path. Rather than copy that, the service calls `closePrimaryPane` for the primary and
`paneTree.closePane` for a sibling. `PaneView.closePane` and `ContentArea.closePrimary` both call the
service, which ends the pane view's unguarded-navigation variant.

**Unsplit is guarded.** `unsplit()` collects the candidates of every non-primary pane and asks the
guard before `paneTree.unsplit`. The seeded command inherits the ask by calling the service. This is
the one place the service adds a guard the control did not have; the requirement that the same
question is asked wherever work would be destroyed already demands it.

**Maximise, minimise and restore are explicit, not toggles.** `maximize(handle?)` sets, `minimize
(handle?)` adds, `restore(handle?)` clears: without a handle it un-maximises the area, with a handle it
brings that pane back from either state. The chrome service keeps its toggles for the controls'
convenience; the pane view and the content area call the service's explicit forms with the state
they can already see (`maximized()`), so the toggle logic lives in one place per control and nowhere
in the service.

**Focus is the tree's focus plus the navigation it implies.** `focus(handle)` calls
`paneTree.focusPane(CONTENT_DOCK, paneId, tabs.activeTabRoot())` and navigates to the path it
returns, as `PaneView.focusPane` does today. The pane view calls the service.

**Moving a tab is the strip drop.** `moveTab(path, handle)` resolves the tab's current pane through
`paneTree.sourceOf(path)` and calls `PaneMoveService.moveToStrip` with the target pane, the same
call the strip drop makes. A path that is not open, or a target that is the source, is a no-op.

**The command keeps its toggle and loses its logic.** `shell.content.splitRight` becomes
`isSplit() ? unsplit() : splitRight()`. The toggle is the command's user-facing meaning (one chord
that splits and un-splits); the decision of what splitting means is the service's.

**The service reads no switch.** `host-services` requires a switched-off capability to stay reachable
through the service. The switches gate the controls, which they already do through computed
signals; the service performs what it is asked.

**Placement.** `regions/pane/pane.service.ts` with `pane-handle.ts` beside it, in the slice that owns
the tree, the chrome and the move service. The slice stays under the concept threshold.

## Risks / Trade-offs

- [A control keeps a private copy of behaviour] → The pane view and the content area lose their
  direct calls to the tree and the chrome for the actions the service covers; a test asserts that a
  split from the pane view, from the content area and from the service produce the same tree. The
  remaining direct calls in the pane view are tab-level (select, reorder, escalate, close one tab),
  which are out of scope and named as such.
- [The duplicate check on the toolbar changes what a user sees] → It does not: the buttons are
  already hidden where nothing can be duplicated. It changes only what happens if the button were
  reached with nothing showable, which was a broken split.
- [Guarding unsplit surprises a user who used the chord] → It asks only when a secondary pane holds
  unsaved work, which is when losing it silently would have been the surprise.
- [Handle brand leaks through JSON or logging] → A handle is a string at runtime; a distribution
  that stores it and replays it gets the same pane back if it still exists, which is the promise. It
  cannot forge one that means something the service did not hand out, because the service resolves
  it against the tree.

## Follow-up noted, not done here

The escalate cycle (preview → keep → pin → unpin) is implemented in both `ContentArea.escalate` and
`PaneView.onEscalate`. It is tab behaviour and belongs with the tabs service, whose surface this
slice leaves alone. It is the next place the twin rule points at.
