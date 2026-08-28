## Context

See proposal.md — *Why*. Two properties of `check-comments.mjs` are at issue: it reads part of the
repository and it applies a looser rule than the one written down. This note covers how both are
fixed and, at the end, records the reasoning that leaves the code with the comments that carried it.

The guard's own header explains why it over-permits: *"Deliberately generous — a guard that
over-permits is recoverable, one that rejects legitimate contract documentation gets switched off."*
That was a defensible call when nobody had measured what the generosity was actually admitting. It
is admitting 106 blocks.

## Goals / Non-Goals

**Goals**

- No file is partly unread by the guard.
- The guard's criterion is the sentence in `openspec/config.yaml`, not an approximation of it.
- Reasoning that lived in a deleted comment survives somewhere a reader can find it.

**Non-Goals**

- Restructuring the code so the explanations become unnecessary. That is what the rule actually
  prescribes — *"a place that needs an explanatory comment gets restructured instead"* — and it is a
  much larger piece of work than this one. Sixty-six blocks would each need its own argument about
  naming, decomposition or a test that says the thing instead. Recording them is the honest
  intermediate; it does not pretend the restructuring happened.
- Giving `@loom/frame-kit` a typed surface. Its six blocks are the only ones kept, and the change
  that resolves them is separate.
- Loosening the rule to match the code. The rule is the thing being enforced, not the thing being
  revised.

## Decisions

**Comments come from the AST, not from a scanner loop.** The loop is not merely fragile, it fails
silently: it stops and reports nothing, so the file reads as clean. Walking every node's leading and
trailing trivia and deduplicating by position sees every comment in every file. The cost is one AST
walk per file, on a checker that already builds the AST for the template-literal spans.

The alternative, patching the loop to survive template substitutions, was rejected. It is the same
class of fix that has been applied to this checker once before, for comments *inside* templates, and
the same class of hazard came back through a different door. A scan loop over TypeScript is an
approximation of the parser; the parser is available.

**A symbol is documented for a consumer when it reaches the packed declarations.** Not when it is
named in an export list — a published interface's base type is reachable and documenting it is
legitimate, and `BarItemBase` is exactly that case. Reachability is what ng-packagr emits, so it is
what a consumer's compiler can resolve.

**A `private` member is not.** It is emitted as a bare `private name;` with no type and no
signature. A consumer cannot call it, cannot see its parameters and cannot read its documentation.
That single exclusion is what separates the tightened rule from the old one for most of the 106: the
old set included every `private` line's identifier and every parameter name.

**The six frame-kit blocks are recorded, not deleted.** They describe `LwFrameApi`, `LwStateHost`
and `LwStateHandle` — the global a frame plugin actually programs against, documented in
`authoring-a-weaver.md` with worked examples. They fail the rule only because the package ships
`dist/` as static assets with no `main`, no `types` and no `exports`, so there is no typed surface
for the documentation to attach to. Deleting a consumer API's documentation because the package
forgot to ship types would be fixing the symptom of a different defect. `comment-residue.json` is
the mechanism this repository already has for *known, justified, may not grow*, and the checker fails
on a stale entry, so the entry cannot outlive its reason.

**Thirty-nine blocks are deleted without being recorded.** They restate what the signature says —
`"The container's own path, from the dock that holds its tree."` on `containerPathOfDock`. Copying
those into this note would make it longer without making anything findable.

## Risks / Trade-offs

**Sixty-six explanations move from beside the code to an archived change.** → That is a real loss of
proximity and this note does not pretend otherwise. The mitigation is that they are recorded at all,
in the one place this repository keeps reasoning, and that the tightened guard makes the next such
block impossible rather than invisible.

**A design note that quotes sixty-six blocks risks being a graveyard nobody reads.** → Grouped by
the area the code lives in rather than dumped flat, so a reader who is working on the pane region can
find the four paragraphs that concern them without reading the other sixty-two.

**The tightened rule may reject something legitimate that nobody anticipated.** → The residue is the
escape hatch, and it is a ratchet rather than an ignore-list: an entry has to be justified, it may
never grow, and a stale one fails the build.

**The guard now costs an AST walk on every scanned file.** → It already built the AST for two other
purposes in the same pass.

## Migration Plan

The guard is tightened and the blocks removed in one change: a tightened guard against an unswept
tree fails the build, and a swept tree without the tightened guard refills. The residue entry is
written in the same commit as the sweep, so the build is green at every point after it.

Rollback is `git revert`; nothing is generated, published or persisted.

## What the sweep took out of the code

Sixty-six blocks carried reasoning rather than a restatement. They are recorded here verbatim,
grouped by the area they came from. Thirty-nine further blocks restated their own signature and are
not recorded.

### The content region

**`ContentArea.retainedSurface`** — `lib/regions/content/content-area.ts`

> The retained **component** surface of the active tab, mounted from the stash exactly as every
> other pane mounts it — the route activates only a stub. Mounted by the router instead, the
> instance would travel with the URL role on every focus handoff and two split panes would swap
> their contents (TreeWeaver #42). Keyed by pane, the instance stays where the user put it.

**`isHomePath`** — `lib/regions/content/content-path.ts`

> Whether a path is the home screen rather than something a tab can stand for. Home is the
> "nothing is open" state throughout the model — it is never auto-opened as a tab, and it is where
> the address goes when the last tab closes. So no strip renders a tab for it: one would be
> selectable but inert, since selecting it cannot hand the pane the address it already has.

**`matchRoute`** — `lib/regions/content/content-path.ts`

> The declaration a path names: the longest pattern that matches wins, and a pattern segment may
> carry a value at any position. Constrained to nothing but a `path`, because the same matching
> serves route paths and the segments a container declares for its children.

**`paramsOfPattern`** — `lib/regions/content/content-path.ts`

> The values a path carries for a pattern, by name. A segment the path does not reach contributes
> no key at all rather than an undefined one, so a caller reading the map cannot tell a missing
> value from a present one only by looking — which is what lets a partial address truncate
> cleanly.

**`ContentSecondaryPane.padded`** — `lib/regions/content/content-secondary-pane.ts`

> Whether the host insets this surface from the pane edges. The declaration travels with the
> surface, so a viewer that owns its edges keeps them in a split, a sidebar and a pop-out alike.

**`ContentSecondaryPane.paramInjectorFor`** — `lib/regions/content/content-secondary-pane.ts`

> The injector a container child is mounted through. Its own route params come from the pane's
> path, and the handle it opens siblings with is provided here rather than inherited: a docked
> surface is mounted from an injector rooted at the environment, so the container host's node
> injector is not in its chain.

**`IframeSurface.watchState`** — `lib/regions/content/iframe-surface.ts`

> The surface half of `ctx.state`: a sandboxed surface holds no `ctx` — only the plugin's logic
> document does — so without this a plugin's surfaces cannot reach its store, which is the case
> the decision was written for. The handle stays host-side and every change is pushed, exactly as
> on the runtime channel. Keys are scoped to the surface's **owning plugin**, taken from the route
> the host mounted, never from anything the surface says.

**`containerChildTargets`** — `lib/regions/content/pane-targets.ts`

> What a container's inner picker may offer: its declared children, access-gated, minus those
> whose segment carries a value — nothing here knows which value to use, so such a child is opened
> by the sibling that has it. The same rule keeps parameterised routes out of the off-router
> picker one level up.

**`ContentReuseStrategy`** — `lib/regions/content/routing/content-reuse-strategy.ts`

> Keeps a hidden URL-pane surface alive **only while it is dirty**: a hidden surface is destroyed
> as soon as it is clean. Longer-lived retention (`retain: 'always'`) is not this strategy's job:
> a retained route activates only a stub, and its instance lives in the retention stash, keyed by
> pane.

**`surfaceRoute`** — `lib/regions/content/routing/content-router.ts`

> What the Angular route activates. A retained surface is not mounted by the router: the route
> activates a stub that only carries the address (and the sub-route outlet), while the instance
> itself lives in the retention stash **keyed by pane** — the same arrangement iframes have always
> had. Mounted by the router, the instance would travel with the URL role instead of staying in
> its pane, which is exactly how two split panes came to swap their contents (TreeWeaver #42).

**`containerSubs`** — `lib/regions/content/routing/content-router.ts`

> A container's children are addressable below it when they declare a segment, so the router needs
> a child route for each — the same stubs a surface's own `subRoutes` get, derived from the
> declaration rather than repeated by the author.

**`OpenTabsService.quickOpenTargets`** — `lib/regions/content/tabs/open-tabs.service.ts`

> The Quick-Open source for the command palette: every currently **open** tab across **all content
> panes** (a split's secondary panes contribute theirs too), plus every registered route the user
> could open — one that takes no route parameter and is not `chromeless`. A route the user has
> visited carries its session `lastActive`; an open tab wins any path collision (it keeps its
> pinned identity). View tabs are excluded — those are reached through their rail item.
> **Access:** an unopened route is offered only when the session meets its `access` requirement.
> An already-open tab is listed as it is — matching the tab strip, which does not re-gate content
> tabs either, which is a deliberate open point. Client-side gating is presentation, not
> enforcement: opening the target still passes the router's `canMatch` twin, and an off-router
> mount re-checks the session, so a target the session no longer qualifies for renders the neutral
> placeholder rather than its content.

**`OpenTabsService.showStrip`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Whether the tab strip renders: whenever the pane holds tabs — and never while a **chromeless**
> surface (login, onboarding) is active. That is the whole rule since groups retired: a pane shows
> a strip when it holds tabs; a chromeless surface shows none.

**`OpenTabsService.tabs`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Everything the strip holds: the permanent facet tabs (`follows` surfaces with a computed
> address), then the open tabs, then the view tabs. Groups retired — every open tab renders, in
> every workspace.

**`OpenTabsService.activateViewTab`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Activates a `view:` tab of the URL group (O5/E7 — a view living as a tab beside the content
> tabs): the content area host-mounts the view; the URL stays at its last route. No-op unless the
> group actually holds that tab.

**`OpenTabsService.navigate`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Navigates the content area to a path (a full-area screen, another tab, a specific sub-route).
> If another pane already holds that tab, **that pane becomes the URL pane** and the tab is
> activated there instead of a second copy opening beside the current one: exactly one pane
> carries the address, and the address follows the focused pane. Without this, a workspace that
> parks a surface in its own pane would gain a duplicate of it the moment a rail item or command
> navigated there, because every visit opens a tab.  Ends any view-tab selection here and marks
> the navigation as ours, so the URL effect — which exists to end the selection on **external**
> moves like back/forward or a deep link — leaves alone whatever the caller selects once this
> settles.  **A no-op in a pop-out window**, with a dev-mode warning. A pop-out shows exactly one
> surface and has no tab strip; navigating it would take its address out of `/popout/…`, and the
> window would quietly stop being a pop-out — chrome-less until the next reload, and the full app
> after it. Same reasoning as a docked surface, whose `navigate` is a no-op for want of a content
> area.

**`OpenTabsService.navigateTo`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Fire-and-forget navigation: like {@link navigate}, but owns the "navigation may fail" semantics
> — a rejected router navigation is logged instead of surfacing as an unhandled rejection. Call
> sites that do not await the outcome use this.

**`OpenTabsService.addressOf`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Where a permanent tab points. A **following** surface is a facet of the current selection rather
> than a document of its own, so its address is recomputed from the parameter values of the
> address we are on; every other tab keeps its own pattern. Only the URL group's strip asks — a
> tab moved into another pane or a pop-out window renders from its stored path and therefore
> freezes, which is what lets a user park one selection beside another (§8).

**`OpenTabsService.focusHolderOf`** — `lib/regions/content/tabs/open-tabs.service.ts`

> Hands the URL role to the pane that already holds the tab we are navigating to, so the address
> moves to it instead of a duplicate opening in the current URL pane. Identity is the **tab
> root**, so a sub-route lands on the tab that owns it. Home is excluded: it is not a tab, and
> `matchRoute` is prefix-tolerant, so every path would otherwise look like it lives somewhere.
> **The URL pane wins.** When it already holds the tab there is nothing to hand over — it can show
> the target itself, and no duplicate can open. Without that, a tab the user had opened in two
> panes made every click ping-pong the address: focusing a pane handed it the role, and the
> navigation that follows immediately handed it to the other holder, undoing the click and re-
> keying both panes.

**`collidingParam`** — `lib/regions/content/tabs/tab-address.ts`

> Whether two following patterns may share a parameter name: only when everything **before** it is
> the same, because otherwise the name means two different things and substituting by name would
> fill one surface's address with the other's value.

**`TabClosingService.closePrimaryPane`** — `lib/regions/content/tabs/tab-closing.service.ts`

> Closes the **primary (URL) pane** of a split — the pane-toolbar "Close pane" on the URL pane:
> the primary leaf collapses, a neighbour is promoted to URL pane and navigated to. Guarded like
> every other user-initiated close: unsaved changes in any of the primary group's tabs run the
> host's Save · Discard · Cancel dialog first.

**`TabClosingService.close`** — `lib/regions/content/tabs/tab-closing.service.ts`

> Closes a dynamic tab (by any path under its root). If it was active, we navigate to a neighbour
> **first**, then evict the stored instance (keyed by the tab root — see {@link
> ContentReuseStrategy}); a background tab is evicted immediately.

**`TabClosingService.runCloseHook`** — `lib/regions/content/tabs/tab-closing.service.ts`

> Runs (and clears) the close hook of the tab rooted at `path` — for a close that happens
> **outside** the URL group (a moved tab closed in another pane). No-op while the tab is still
> open in the URL group (its own {@link close} will run the hook).

**`TabClosingService.neighbourOf`** — `lib/regions/content/tabs/tab-closing.service.ts`

> The URL pane's neighbour of the tab rooted at `path` — where the URL goes when that tab
> **leaves** the pane (moved away) or closes: the last remaining sibling, else home (`''` — the
> "no file is open" default).

**`TabClosingService.navigateAfterClose`** — `lib/regions/content/tabs/tab-closing.service.ts`

> Navigates to what survives a close. A promoted **view** tab has no address, so the router goes
> to the full-area default and the view is selected on top of it — otherwise the surviving pane
> would show the default screen while its own tab sat there unselected.

### The pane region

**`isAddressable`** — `lib/regions/pane/container/container-children.ts`

> Whether a segment can be opened without knowing a value — the picker and the initial arrangement
> may only name children that can. A parameterised child is opened by a sibling that has the
> value.

**`childForSegmentPath`** — `lib/regions/pane/container/container-children.ts`

> The child a path below a container names, matched by the same rules a route path is matched by:
> the longest declared segment wins, and a segment may carry values at any position.

**`ContainerContext.open`** — `lib/regions/pane/container/container-context.ts`

> Open a child at an address inside this container, or focus it where it already is. This is how a
> list child opens the item a row stands for. It is a host operation rather than a navigation on
> purpose: a container tab may sit in a split pane or a pop-out, where it holds no browser address
> at all, and a list whose rows only work in one of those places is not a list.

**`containerLayout`** — `lib/regions/pane/container/container-layout.ts`

> A container's declared arrangement, converted into the tree its dock starts with. The plain-list
> form of `initial` is shorthand for a single tabs area, so both forms travel the one shared
> conversion.  `dock` is needed because a container child tab carries an instance stamp scoped to
> its dock — the same stamp `insertContainerChild` mints when the user adds a child by hand, so a
> declared child and a hand-added one are the same thing to everything downstream (`VIEW_STATE`,
> retention, the strip).

**`containerChildTab`** — `lib/regions/pane/container/container-layout.ts`

> The tab a container child sits in. A child that declares a segment is addressed by it — the
> container's own path followed by the segment, so the path carries everything needed to resolve
> it . A child without one keeps the id form it has always had, and both may sit in one container.
> The instance stamp follows the path, so two tabs of the same child are two instances.

**`PaneContainersService.ensureContainer`** — `lib/regions/pane/container/pane-containers.service.ts`

> Seed a container's tree from its declaration. The pointer starts on the pane declared empty when
> there is one: that pane is where children open, so it is what the container's address names
> before anything has been opened.

**`PaneContainersService.openContainerChild`** — `lib/regions/pane/container/pane-containers.service.ts`

> Open a child at an address inside its container, or focus it where it already is. The landing
> pane is the one the arrangement declared empty — that is what declaring it says — and the pane
> carrying the dock's pointer when none was declared.

**`PaneDropZones.fills`** — `lib/regions/pane/drag/pane-drop-zones.ts`

> A pane holding no tabs takes the whole drop instead of offering edges: splitting against it
> would only produce an empty half, and the single full-area preview says what will actually
> happen. Only the URL pane can be in that state — every other pane collapses when its last tab
> leaves.

**`containerChildForPath`** — `lib/regions/pane/pane-surface.ts`

> The container child a path names, or `undefined` when it names something else. A child's tab
> path is its container's path followed by the child's own segment, so the path carries everything
> needed to resolve it and no caller has to know which dock it came from.

**`surfaceForPanePath`** — `lib/regions/pane/pane-surface.ts`

> Which registered surface a pane path stands for — the one answer to that question.  A pane holds
> one of three kinds of path, and every caller used to branch on the prefix itself: a docked
> surface addressed by id (`view:<id>`), a container child addressed below its container, or a
> route path. Repeating the branch is how one kind gets answered in some places and not others, so
> callers ask here and read the field they came for instead.  The home route is deliberately not
> an answer for anything but home. `matchRoute` is prefix tolerant, so a route registered on the
> empty path matches **every** path — which means a tab whose plugin is no longer composed would
> otherwise resolve to the home screen and be labelled, retained and rendered as if it were home,
> under an address that says something else.

**`PaneViewOptions.pointer`** — `lib/regions/pane/pane-view-options.ts`

> Whether clicking a pane moves its dock's **pointer** — which pane's child the address names
> inside a container. Distinct from {@link focus}, which hands the browser URL from one pane to
> another and settles what the dethroned one shows.

**`PaneView.awaitingContent`** — `lib/regions/pane/pane-view.ts`

> A pane the arrangement declared empty holds nothing yet, and the empty path is the home screen
> everywhere else — so without this it would render home under a container it has nothing to do
> with. It says what is true instead.

**`RetainedViewStash.claimableEntry`** — `lib/regions/pane/retention/retained-view-stash.ts`

> The entry a new mount may take over, or `null` to build one.  An entry that is still **in use**
> by the mount it is moving away from counts, as long as it renders the same thing: Angular gives
> no guarantee that the outgoing mount is destroyed before the incoming one is created, and for a
> branch swap it usually is not. Refusing the claim in that order was the whole difference between
> a surface that survives being moved and one that is silently rebuilt — the entry went untracked,
> and the outgoing mount then released the tracked one into the sweep. The displaced owner's later
> `release`/`discard` is a no-op, because ownership moved with the claim.

**`reusableRoute`** — `lib/regions/pane/retention/retention-policy.ts`

> Whether the route-reuse strategy handles this route at all. A retained route is excluded like an
> iframe route, and for the same reason: the router only ever activates its stub — the instance is
> owned by the retention stash, keyed by the pane it sits in.

**`surfaceRetentionMode`** — `lib/regions/pane/retention/retention-policy.ts`

> How a surface travels when its pane moves. Deliberately **not** folded into {@link
> surfaceForPanePath}: it asks how a surface is mounted rather than which one it is, and the
> answer for a docked path is `move` whatever it declares — a docked iframe is relocated by an
> atomic DOM move, while the URL pane's iframe can only be hidden where it stands.

**`PaneAreaOptions`** — `lib/regions/pane/tree/pane-area-tree.ts`

> The one conversion from a declared {@link PaneArea} into a pane tree, shared by everything that
> writes an arrangement down: a workspace declaration over route paths and a container declaration
> over child surface ids. What differs between them is how an entry becomes a tab, which is what
> {@link PaneAreaOptions.bake} supplies; the structure, the sizing and every complaint about a
> malformed declaration are the same on both sides.  Nothing throws: an unusable part is dropped,
> a reason is appended to `problems`, and the caller decides how loud that is. The declaring
> surface or workspace therefore degrades to the largest arrangement that still makes sense rather
> than failing to appear.

**`PaneLeaf.declared`** — `lib/regions/pane/tree/pane-node.ts`

> A pane the arrangement declared **empty** — it says where things open rather than what is open,
> so it survives holding no tabs instead of collapsing into its sibling.

**`normalizeDockEntry`** — `lib/regions/pane/tree/pane-restore.ts`

> Parses one persisted dock value in either shape: `{ tree, primary }`, or the bare tree the pre-
> pointer format stored — there the URL pane was the leaf *named* `'main'`, so that name becomes
> the pointer (falling back to the first leaf when a stored tree lost it).

**`dethroneLeaf`** — `lib/regions/pane/tree/pane-structure.ts`

> Settles the pane losing the URL role. It keeps its id — the handoff moves the primary pointer,
> never a name — and it keeps showing what it showed: holding a tab for its content, that tab
> stays active, even when the newly focused pane shows the same content, because a split showing
> one surface twice is exactly what splitting it created (TreeWeaver #42). Only content no pane
> would show otherwise is added as a tab; the home screen is the empty state rather than a
> document, so nothing is carried for it.

**`reseatPinned`** — `lib/regions/pane/tree/pane-tabs.ts`

> Where a tab sits once its pinned state changed, or once it is brought to the front: pinned tabs
> anchor to the front of the strip, so a tab joining or leaving the pinned band lands on the
> boundary between the two bands — which is also the front of the unpinned band. One position,
> three gestures.  The seat is a property of the tab **list**, not of how a strip happens to
> render it: a pane owns its tabs, so ordering them here is what keeps every pane showing the same
> order for the same tabs, whichever of them currently carries the address.

**`PaneTreeService.primaryId`** — `lib/regions/pane/tree/pane-tree.service.ts`

> The id of the dock's **primary pane** — the pane that carries the browser URL in the content
> dock, and the seeded primary group everywhere else. Pane ids are stable: a focus handoff moves
> this pointer, it never renames a pane.

**`PaneTreeService.pointAt`** — `lib/regions/pane/tree/pane-tree.service.ts`

> Move a dock's pointer to a pane without touching the tree. The content dock hands the URL role
> over with `focusPane`, which also settles what the dethroned pane shows; inside a container
> there is nothing to dethrone — the panes keep their children and only the pointer, which decides
> whose child the address names, moves.

**`PaneTreeService.focusPane`** — `lib/regions/pane/tree/pane-tree.service.ts`

> Hands the URL role to `paneId`: the primary pointer moves, no pane changes its id — so
> everything keyed by pane (retained surfaces, chrome state, strip ids) stays put. The pane losing
> the role keeps showing what it showed; `previousContent === null` says the URL group is being
> emptied on purpose (its last tab was dragged out), and an emptied pane collapses.

### The other regions

**`BarContext`** — `lib/regions/bar/bar-context.ts`

> Where a component bar item is being rendered. A bar's height is not uniform across the layout —
> a top bar is a fixed band, a bottom bar takes the height of its tallest item — so a control that
> pins a height needs to know which one it is in.

**`PanelViewsService.viewsInRegion`** — `lib/regions/panel/panel-views.service.ts`

> The views **declared** for a region, in effective order — regardless of the session. This is the
> seed and workspace-baseline source: `access` is evaluated where the view is drawn (the strip and
> the pane hide what the session does not meet, reactively), never at declaration-read time. An
> auth filter here emptied the sidebar half of a workspace baseline at boot — before any session
> exists — and made the declaration warning blame a correct declaration (TreeWeaver #40).

### The rest of the shell

**`CommandPaletteEntry.compact`** — `lib/commands/command-palette-entry.ts`

> A top bar is a fixed band, so the badge pins the shared bar-control height and lines up with the
> theme and language controls beside it. A bottom bar takes the height of its tallest item, where
> pinning that height would grow the bar and quietly cost the content area — so there the entry
> renders like a plain bar item instead.

**`CATALOG_MAX_ISOLATION_LEVEL`** — `lib/foundation/plugin-isolation-level.ts`

> The highest level a catalog may confer on what it carries. Defaults to the strict one, so a
> distribution that says nothing can never have a catalog hand out an embedded application.

**`ShellMissingTranslationHandler`** — `lib/i18n/missing-translation-handler.ts`

> Keeps the missing-key warning worth reading. The host paints its chrome — dock strips, tab
> titles, the tabs a workspace seeds — as soon as it has them, which is before the translation
> bundle for the active language has arrived. Every key looked up in that window counts as
> missing, so a boot logs a burst of warnings naming keys that resolve correctly a moment later,
> and the ones that mean something drown in them. A product cannot turn this down either: the
> Transloco config is composed inside `provideShell`.  So the host answers the question itself — a
> key is not missing while there is no translation for it to be missing from — and from the moment
> a bundle is loaded it warns exactly as Transloco would.

**`PluginStateService`** — `lib/plugin/plugin-state.service.ts`

> The host side of `ctx.state`: one keyed store per plugin over the working-state port, under
> `lw.plugin-state:<pluginId>:<key>`. Every surface of a plugin — any dock, any instance, any
> window — shares one entry per key, which is what makes the store double as the plugin's internal
> channel. Siblings in this window see a write at once because they read the same signal; other
> windows see it after the debounced write reaches storage and the sync channel rings.  A plugin's
> key names are tracked in a small index (`lw.plugin-state-keys:<pluginId>`) because the store
> port has no way to enumerate a prefix, and uninstalling has to be able to delete the lot.

**`PluginStateService.removePlugin`** — `lib/plugin/plugin-state.service.ts`

> Drops a plugin's whole store — the uninstall path. Deliberately the opposite of plugin
> *settings*, which survive so a reinstall finds its configuration.

**`PluginStateService.withinLimits`** — `lib/plugin/plugin-state.service.ts`

> Caps so one plugin cannot flood the user's storage — or, with a backend-backed working-state
> store, the product's. A refused write is loud rather than silent, and development warns at half
> of each cap so the wall is never a surprise.

**`FramePluginRuntime.watchState`** — `lib/plugin/sandbox-plugin-runtime.ts`

> The sandbox side of `ctx.state`: the handle itself cannot cross the seam — its members are
> functions — so the host keeps it and **pushes** every change over the runtime channel, exactly
> as it does for the session and for settings values. `stateWatch` is therefore both the interest
> registration and the subscription.

**`sanitizeRpcInitial`** — `lib/plugin/sandbox-rpc-sanitize.ts`

> The declared arrangement arrives as plain JSON from a sandboxed plugin, so it is rebuilt field
> by field like everything else at this seam — the shorthand list as before, an area tree
> recursively. Depth is bounded here rather than trusted: the host must not recurse into whatever
> a plugin sends. What survives is only *structurally* valid; whether it names children that exist
> is decided later, by the same conversion a trusted plugin's declaration goes through.

**`ActiveWorkspaceService.adopted`** — `lib/workspace/active-workspace.service.ts`

> Whether this boot is the one that adopted a declared initial workspace, so its baseline still
> has to be laid out — on every later boot the stored working state is the truth.

**`ActiveWorkspaceService.adoptIfUnseen`** — `lib/workspace/active-workspace.service.ts`

> A first boot — nothing stored — starts in the declared initial workspace, and the choice is
> written straight away so the user's own later choice is what the next boot reads.

### The devkit and the CLI

**`directoryFromOut`** — `lib/scaffold.ts`

> `--out` is the project root as far as the CLI is concerned, which is exactly what a workspace
> adapter would pass as `directory`. A scaffold that derives paths from its depth (the
> distribution's Tailwind `@source` reach into `node_modules`) would otherwise assume the
> workspace default and emit a path that resolves nowhere — silently, as a stylesheet that
> generates none of the shell's classes.

**`ProjectJson`** — `generators/distribution/generator.ts`

> Writes the composition root's project configuration over the one already there. Our targets win,
> because they carry the wiring the shell needs (the i18n and frame-kit assets, the stylesheet,
> the service worker, `inlineCritical: false`); everything else the occupant declares survives —
> its own targets, its `implicitDependencies`, and its tags unless this run supplies some.

**`appFor`** — `generators/weaver/generator.ts`

> A weaver library has no build of its own — its specs compile with the build options of the
> application that composes it, which is what `@nx/angular:unit-test` needs, and its i18n bundle
> is served by that application's assets. `--unit-test-runner none` skips the test wiring for a
> workspace that runs something else.

**`urlFinding`** — `lib/validate/catalog.ts`

> Classifies a URL the way the host will, minus the one thing a validator cannot know: which
> origin the catalog will be served from. A relative URL is same-origin by construction; an
> absolute one can only be flagged as *conditional*.

### Test helpers

**`stripOrders`** — `retained-url-pane.spec.ts`

> Tab labels per pane **strip**, so a strip that reorders itself as the URL role moves is visible
> here. Scoped to the pane's own strip: a surface may render its own inner tablist (the entry
> view's sub-tabs), and which surface a pane shows legitimately varies with the handoff.

**`surfaceIdentity`** — `retained-url-pane.spec.ts`

> Stamps the retaining surface's element and reports the stamp. A changed stamp means the element
> was replaced — the surface was destroyed and rebuilt rather than retained. Waits for the surface
> to be on screen first: read mid-handoff it is briefly absent, which is a measurement artefact,
> not a rebuild.
