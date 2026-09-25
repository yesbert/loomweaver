Every task is one pull request unless it says otherwise. A task marked **move** moves or renames files
and changes nothing else. Each pull request runs the unit tests of what it touches, lint, and the
guards that apply (`structure-check`, `import-cycles-check`, `comments-check`, `api-docs-check`,
`command-names-check`, `region-ids-check`, `bundle-size-check`), and greps `llms*.txt`, `docs/`,
`platform/tools/` and `website/` for every path it moves. Paths are relative to
`platform/libs/core/shell/src/lib/` unless they start with a top-level folder.

## 1. Calibration slice: the content tab services

- [x] 1.1 Cut `regions/content/tabs/open-tabs.service.ts` into `ContentTabState`
  (`content-tab-state.ts`: open set, active address, view-tab selection, strip, quick-open stamps) and
  `TabNavigation` (`tab-navigation.service.ts`: navigate, keep the address, follow the URL with named
  conditions instead of six `last*` fields, reveal the holder, sync the active tab; absorbs
  `active-tab-sync.ts`). The router URL comes from `CurrentAddress` instead of a second `toSignal`.
  `addressOf`/`somewhereToGo` move into `tab-address.ts` as `followingTabAddress`, `strippable` into
  `content-tab-projection.ts`; "this address opens no tab" and the route title rule exist once there.
- [x] 1.2 Make `ContentTabsService` the published entry point without behaviour of its own: a new
  `TabOpening` takes open, keep and refine and absorbs the claim queue of `claim-ordering.ts`, which
  reports a failed step instead of swallowing it; reorder, bring-to-front and pin move to
  `ContentTabState`. One tree walk in `tab-label-update.ts` relabels matching tabs, and
  `refineTabTitles` leaves `regions/pane/tree/`.
- [x] 1.3 Split `content-tabs.service.spec.ts` (903 lines) along the new files; give the repeated
  five-line TestBed setup one file-local helper per spec; replace tracker codes in its test names and
  in `open-tabs.service.spec.ts` by the behaviour.
- [x] 1.4 Show the owner the result of 1.1 to 1.3, write the agreed measure into `design.md`
  ("Agreed measure"), and adjust the remaining tasks if the measure changes them.

## 2. Knowledge written once, across the shell

- [x] 2.1 A `PopoutWindow` fact (`popout/popout-window.ts`, only `active`) replaces the eight
  `isPopoutUrl(document.location…)` derivations in commands, content, pane and retention code;
  `PopoutService` keeps `open()`.
- [x] 2.2 A settings-backed signal helper in `persistence/` (seed from `peek`, hydrate when there is no
  `peek`, register cross-tab sync, write back) and a `parseRecord` for keyed records. Adopt it slice by
  slice, one pull request each: workspace list, theme and text size, plugin install, deployment and
  enablement with capability grants, rail labels and rail items, panel state and panel sizes. The
  language joins after its defect is fixed. `parseHiddenViews` is replaced by `parseIdSet`.
- [x] 2.3 Storage keys are exported by the slice that owns them (pane trees, hidden views, saved
  workspaces, theme, language, text size) and imported by the readers; `DEVICE_LEVEL_KEYS` is built
  from those constants with the same value.
- [x] 2.4 `regions/pane/retention/retention-keys.ts` owns the key grammar (`scope|path|instance`, the
  dock and pane separators, the primary prefix): builders, `pathOfRetentionKey`, `isKeyOfDock`, and
  `evacuateDock`/`evacuatePane` on the stash instead of hand-built prefixes. The ten builders and
  parsers in pane, retention, unsaved work, panel state and view visibility use it.
- [x] 2.5 One "wording may have changed" signal in `i18n/`, built with the menu's precise rule, read by
  the menu, the command palette and the pop-out view instead of three constructions.
- [x] 2.6 Layout queries in `layout/layout.ts` (regions of a type, whether one exists, on how many
  sides, the one on a side, the one on the other side) replace about twenty inline filter chains;
  `ShellRegions` goes and the seeds take `ShellLayout`; "the layout has content" is defined once.
- [x] 2.7 **Move:** `regions/pane/drag/pane-label.ts` to `regions/pane/chrome/tab-label.ts`.
- [x] 2.8 Tab labels: one label-patch module (the badge "null removes, absent keeps" rule once, one
  relabel walk) used by pane tabs, pane structure, stored-tree healing, containers and content; one
  `lwLabel` pipe for "a key unless marked literal" in the tab strip and the minimised strip.
- [x] 2.9 Host command ids are exported constants beside their registration, and the `menu:` entry id
  convention is written once; the composition report uses the same constants.
- [x] 2.10 The fallback language is one constant; the feedback-tone colour mapping shared by dialog and
  toast lives in one place both slices may read.
- [x] 2.11 A shared wide-dialog frame in `dialog/` (title, maximise and restore, close, height) replaces
  the copied headers of the settings dialog and the plugin store dialog.
- [x] 2.12 Names left by the abbreviation autofix become the word meant, across the shell: `index` for
  an item, `function_`, `index_`, `num`, single letters for workspaces and languages.
- [x] 2.13 "Which rail or bar item is offered" is one predicate beside `menuOnActivate`, used by the
  rail, the bar and the curation dialog (after the curation defect is fixed).
- [x] 2.14 Which pane buttons and drag gestures a set of switches offers is one function read by the
  pane view and the address pane header (after the maximised-pane defect is fixed).

## 3. The shell's composition and frame

- [x] 3.1 Remove code only specs call: `PanelViewsService.candidatesFor` with its type and injections,
  `ViewVisibilityService.isHidden`/`toggle`, `RailItemsService.toggle`, `LwToken`,
  `PaneSegment.fraction`, `isLeftOut`, the unused `reusableRoute`, and the router data only tests read
  (the router table keeps `content`); move the gated-view curation test to the curation dialog.
- [x] 3.2 Theme and text size are applied by explicit initializers in `provideShell`, not by two
  unread fields of `Shell`.
- [x] 3.3 Each host command moves next to what it opens (palette and quick open, curation, app reset,
  workspaces, split); `shell-seeds.ts` becomes `host-commands.ts` (order and gating only),
  `shell-menu-seeds.ts` becomes `built-in-menus.ts`, contribution seeding moves into
  `provide-shell.ts`, "seed" is left to the pane tree; `check-command-names.mjs` follows.
- [x] 3.4 `provide-shell.ts` fits a screen: `ShellOptions` in `shell-options.ts`, named provider groups,
  one shape for startup registration, `registerDefaultSettings` injecting what it needs.
- [x] 3.5 `shell.html` renders a side through one `ShellEdge` and the compact overlay through one
  drawer template instead of mirrored left and right blocks; the outlets render once.
- [x] 3.6 Rail and sidebar moves share one Alt+Shift+Arrow helper and one move announcement; the
  sidebar's keyboard path goes through `ViewMoveService` (after its defect is fixed); local names say
  `side` or `regionId` instead of `dock`.
- [x] 3.7 **Move:** the app-reset dialog to `regions/reset/`, `layout/view.ts` to `views/`, the surface
  reveal service to `regions/pane/`, the component loader next to the pane surface. The reveal
  service went to `regions/reveal/` instead: it expands a sidebar, and in `regions/pane/` that would
  have made the pane and panel slices import each other. In its own folder it resolves two slice
  pairs, and the pane files take `View` from the SDK rather than from `views/`.
- [x] 3.8 `ShellRail`: the entry list as a pure function, workspace marking in
  `RailWorkspaceEntries`, label fitting as a directive, booleans named `is…`; `shell-rail.spec.ts`
  (728 lines) with one render helper and the workspace block in its own spec.
- [x] 3.9 `UpdateService`: worker repair and the notices in their own files, the check deadline as a
  named method, one name for the "unreachable" outcome; the spec split the same way.
- [ ] 3.10 After the owner's decision on CSS comments: `styles/theme.css` (879 lines) becomes an index
  of partials behind the same published entry path (tokens, controls, one file per element look,
  workbench, base), the asset glob ships the partials, and its comments lose tranche numbers, tracker
  codes, other products' names and German words.
- [x] 3.11 Smaller frame items: `ViewInstanceService.activeInstance`, private re-read methods, the
  panel width constants imported from `layout/`, one `shownInstance` in the panel, the theme registry
  split into tokens and plugin layer with `revision` instead of `version`, the composition report's
  checks as pure functions, `addressing/` renamed to what it holds or merged into the path module, and
  the public barrel grouped by slice.

## 4. The content regions

- [x] 4.1 **Move:** a `regions/content/surface/` sub-theme for what draws a surface inside a pane (the
  surface body, the iframe surface, the live and synthetic routes, the surface injector).
- [x] 4.2 **Move:** rename `ContentSecondaryPane` to `SurfaceBody`, `ContentArea` to
  `AddressPaneHeader`, `AddressBody` to `AddressPaneBody`, `provide-content-router.ts` to
  `provide-shell-router.ts`; the unusable-workspace notice to `workspace/usability/`; one file-name
  rule for services in the slice.
- [x] 4.3 Cut `IframeSurface`: the wire protocol and pure helpers in `iframe-surface-protocol.ts`, the
  plugin-state bridge as a class of its own, route data read through one typed `SurfaceRouteData`
  (the key `urlDriven` becomes `carriesAddress`), one route snapshot builder and one route injector
  builder for the three hand-made routes.
  The key keeps its name, since it is published (see design, "Set aside"). The route injector is
  shared by the two that are alike; the surface body's third one provides the container handle
  instead of outlet contexts and stays its own.
- [x] 4.4 The router: the pure route table in `content-route-table.ts` with the placeholder built once
  and `isContentRoute` beside it; `ContentRouter.start()` split into named steps; its spec split.
- [x] 4.5 One docked-view body component used by the surface body and the side panel. Set aside,
  see design.
- [x] 4.6 Pane targets: one hostable-targets list; `barePathHostableRoute` and `offRouterMountable`
  renamed to what they answer.
- [x] 4.7 The tab context menu takes its dependencies as one object and builds its entries through one
  helper; pin and unpin by an explicit branch.
- [x] 4.8 Curation: the panel lookups become public on `PanelViewsService` and are used by curation and
  view visibility; rail and view curation become two row sources the dialog picks by kind. The
  lookups had nothing left to share: the dead-code pass removed the copies in `PanelViewsService`,
  and view visibility no longer asks which panel holds a view, so the one lookup stays in view
  curation.
- [x] 4.9 Smaller content items: identity-only computeds and duplicate computeds removed, the string
  dispatch in the address pane header made explicit, `activeTab` in the iframe surface renamed to what
  it holds, `ShellBar.measure` split and injecting `DOCUMENT`, pane housekeeping started by a named
  function in `regions/pane/`.

## 5. The pane regions

- [x] 5.1 **Move:** `close/`, the unsaved-work service and the unload guard into `regions/pane/unsaved-work/`;
  `pane-restore.ts` to `stored-pane-tree.ts`; `pane-area-tree.ts` to `declared-pane-layout.ts`.
- [x] 5.2 Tree queries: `leavesOf` moves to `pane-queries.ts` and the read-only walks are built on it;
  "an empty, undeclared leaf goes away" is one rule with one collapse tail; the moved-tree settling
  moves into `pane-structure.ts`; "a path at or below a root" is one function in the path module.
- [x] 5.3 Pane identity: `PaneRef` everywhere (the identical `TabDragSource` goes), `isSamePane`, one
  name for "carries the address", a named "content side" dock test, `isViewPanePath` and
  `viewPanePath` instead of fourteen prefix checks, tab escalation by an explicit switch.
- [x] 5.4 `PaneTreeService`: tab ranking into `pane-tabs.ts`, the hydration hand-off into
  `PaneTreeStorage`, evacuation through the stash (2.4), the `commitTree` alias removed, the six
  meanings of "settle" given their own names, the landing leaf found in one place; `removeTab` asks
  `isDisposableLeaf` like the other four places (left from 5.2, which would have pushed the file past
  400 lines).
- [x] 5.5 `RetainedViewStash`: the holding area's DOM work in `holding-area.ts`, every query over
  entries in one file, `slotFor` out of `acquire`, one retain flag, verbs that say what the stash does;
  the two directives share node placement; `retention-policy.ts` keeps only the policy (dirty-surface
  helpers go to unsaved work, route reuse to the reuse strategy).
- [x] 5.6 Unsaved work: `RetentionCandidates` folded into `UnsavedWork`; saving on hide out of the
  garbage collector, which is named for its sweep; the two dialog bodies with markup get their own
  templates or become one message component.
- [x] 5.7 Pane chrome: overflow measuring as a directive, the tab menu context as a pure function, the
  unsaved dot as one template; the drag service keeps only drag state and the admission checks move to
  the pane targets; the drop zones render from a loop.
- [x] 5.8 Smaller pane items: the container identity derived once, container instance ids built once,
  `flexFor` with named arguments and constants, the chrome service's names, the pane-close keep rule
  as two named functions, the view menu slot constant beside its menu; `retention.spec.ts` (1024
  lines) split per file under test.

## 6. Plugin loading, the plugin store and permissions

- [x] 6.1 **Move:** `disposeTogether` to `foundation/`; `plugin/sandbox/` to `plugin/frame/` with
  `frame-*` file names; enablement, its disable guard and `PluginInfo` to `plugin/enablement/`; the
  context files to `plugin/context/`; `capability-grants.ts` to `provide-capability-grants.ts`; the
  refusal error handler into its own file; `installed-plugin.ts` split into the catalog entry and the
  installed record; `format.ts` to `catalog-figures.ts`.
  `foundation/` is at its twelve-concept limit, so `disposeTogether` moves with 6.2 into the
  `contributions/` slice, whose registrations are all it disposes. The permissions settings section
  moved into `plugin/enablement/` with the switches it shows; anywhere else it made two slices
  import each other.
- [x] 6.2 **Move:** the contribution registry, surface normalisation and route omission into a
  top-level `contributions/` slice, with `tabBadgeOf` in `foundation/`; shrink the cycle baseline by
  the pairs that disappear.
  `tabBadgeOf` and `disposeTogether` joined `contributions/` instead of the full `foundation/`;
  `menu <-> plugin` and `plugin <-> settings` left the baseline.
- [x] 6.3 One lifecycle vocabulary: deployed (not provided), one constant for the installed-plugins
  settings group, activate and deactivate in both runtimes, `deactivateUnlisted`, isolation level (not
  rung or cap), and the names that promise less than their function does.
  "Rung" stays where it names the three levels of trust (trusted, isolated, embedded), since the
  glossary and the guides use it for exactly that; "cap" is gone. `withBadge` is renamed with 6.8,
  which cuts `host-plugin-context.ts`: that file sits at 399 lines and a longer name wraps a line.
- [x] 6.4 "A deployed plugin is always on" is decided by the enablement service once, like "a required
  plugin is always on".
- [x] 6.5 The store's install, update and uninstall confirmations become one service; the disable guard
  returns a decision instead of flipping a checkbox in the DOM.
- [x] 6.6 The catalog is fetched and held once; the store title reaches the dialog as dialog data; the
  figures become pipes; one plugin icon component; store buttons use `lwButton` and `type="button"`.
- [x] 6.7 The registry: one surface-shaped entry point, the common surface fields picked once, one
  omit filter, surface badges in their own small service, `idsOf`.
  The surface-shaped entry point would be a new public method on the published registry, so it is
  on the owner's list rather than done here.
- [x] 6.8 `HostPluginContext` gets its services through `inject()`; the `ui` facade and the surface
  admission rules move out; `host-plugin-context.spec.ts` (1255 lines) split the same way. `withBadge`
  becomes a name that says it also tracks the registration (from 6.3).
  The factory builds the context in its injection context, so its constructor takes the plugin id
  and the grant check only. The `ui`, `host` and `session` facades are `plugin-facades.ts`; the
  broad-prefix and following-name rules are `surface-admission.ts`; `withBadge` is `trackWithBadge`.
  The spec split into the facades, the author warnings, surface admission and the rest, over one
  shared harness. The check that no picture of the workbench is offered looked at the harness's
  return value rather than the context; it now looks at the context and its prototype.
- [x] 6.9 The frame RPC: wire-field helpers, the sanitizer and settings files split by input kind, one
  per-frame session object owning watched keys and cleanups, every RPC entry validating its primitive
  arguments the same way, refused catalog entries reported once; `sandbox-plugin-runtime.spec.ts`
  (1402 lines) split along those files.
  The RPC files are `frame/rpc/`: the contract (types only), the method table (with the command
  call it used to borrow from the contract), `wire-fields.ts`, and one sanitizer each for surfaces,
  small inputs and settings; `frame-settings-section.ts` keeps building the host section.
  `FrameSession` owns a frame's watched keys, cleanups and notifications. A text argument is now
  refused when it is not a string, where some calls passed it through and three converted it with
  `String()`; that is what "everything crossing the boundary is validated as data" already asks.
  `runnablePlugins` returns what it refused, and the runtime says so once per id and level. The
  `effectiveCapabilities` tests moved to the permissions slice, and the runtime's published JSDoc
  was rewritten while the file was open.
- [x] 6.10 `PluginStateService`: the limit check and the key index as two steps, "characters" instead
  of "bytes", `forPlugin` instead of `facade`; the required-plugin typo diagnostic moves to the
  composition report (after its defect is fixed).
  The typo diagnostic already moved to the composition report with defect 1.6. A value with no JSON
  form still fails as before; what it should do is the owner's decision in defect 9.3.

## 7. Workspaces, persistence, settings, foundation and i18n

- [x] 7.1 Workspace names: the built-in workspace and the starting workspace get distinct names, "no
  initial workspace is declared" is one function, fields that hold a port are named after it, and
  `ActiveWorkspaceService.ready` is assigned in the constructor instead of depending on field order.
  `BUILT_IN_WORKSPACE_ID` (declared once, after the imports) and `startingWorkspaceId`;
  `offersBuiltInWorkspace` answers the question four places computed; `workingStateStore` in the
  active-workspace, workspace, unusable-workspaces and pane-tree storage services.
- [x] 7.2 One baseline concept: one declarations type and one `definitionBaseline` function replace the
  four near-identical dependency bags and the keys passed through four layers.
  `PanelDeclarations` and `baseline/definition-baseline.ts`; the definition file keeps the two
  computations it owns (`baselineTrees`, `baselineHiddenViews`) until 7.4 moves them. The state keys
  and the typed channels are `baseline/state-channels.ts`, a file of their own because the pane-tree
  storage imports `workspace-state.ts` and would otherwise close a file cycle.
- [x] 7.3 `foundation/` admits only what fits its rule: the isolation-level service moves into a small
  slice of its own, the catalog's level cap to the catalog, the settlement port next to the content
  routing that reads it (renamed so it no longer shares a file name with `workspace/workspace-claims.ts`).
  The unusable-workspaces port and the feature-flag declaration stay until the owner decides.
  `plugin-isolation/plugin-isolation-level.service.ts` (imports only `foundation/`, so no slice pair),
  `CATALOG_MAX_ISOLATION_LEVEL` in `plugin-store/catalog/catalog-level-cap.ts` (not beside `PLUGIN_CATALOG`,
  whose file the package re-exports whole, so the token would have become published),
  and `WorkspaceSettlement` / `WORKSPACE_SETTLEMENT` in `regions/content/routing/workspace-settlement.ts`.
  `rungOf` and `PluginRung` keep their names, as 6.3 decided for the glossary's "rung".
- [x] 7.4 `workspace-definition.ts` becomes `workspace/declaration/`: the published types, the audit
  together with the gap warnings, the baseline computation, the provider.
  `workspace-definition.ts` (the published types only), `definition-audit.ts` (the audit and the gap
  warnings), `definition-baseline.ts`, `provide-workspaces.ts`, plus `declared-content.ts` (the content
  tree the other three read) and `composed-definitions.ts` (the built-in id, deduplication, the
  starting workspace and the claims), which 7.5's catalog may take over. The spec split the same way;
  a test of the audit that sat under `declaredTabPaths` moved to the audit's spec.
- [x] 7.5 `WorkspaceService` (398 lines) is cut into a catalog, a settlement and an opening service
  behind the unchanged published facade; the catalog provides the definitions and their lookup to
  every reader. Its single-letter `w` lambdas become `workspace` here, because renaming them in 2.12
  would have lifted the file over 400 lines.
  `catalog/workspace-catalog.ts` (definitions, the saved list, the lookups, the dev audit),
  `settlement/address-settlement.ts` (the address the workbench chose, where an address settles),
  `workspace-switcher.ts` (entering a workspace and applying its working state) and
  `opening/workbench-opening.ts` (boot and namespace adoption; the eight-callback bag is gone). The
  settlement decides and the facade switches, because a settlement that switched would need the
  switcher, which needs the settlement to choose an address. The pane-tree storage, the
  unusable-workspaces service and the dialog read the catalog. `ActiveWorkspaceService` still reads
  the token: importing the catalog there would close a file cycle through `workspace-state.ts`.
  `WorkspaceService` is 181 lines.
- [x] 7.6 **Move:** `workspace/baseline/` becomes `unsaved-changes/`, the lookups go to the catalog.
  Named `working-state/` instead, because besides the change tracking it holds the state channels
  and the reads and writes the switcher uses (`working-state-io.ts`, was `workspace-state.ts`). The
  lookups, `Workspace` and `WORKSPACES_KEY` went to `catalog/` (`saved-workspaces.ts`).
- [x] 7.7 The workspace dialog's three row blocks share templates; its promise chains use `if`.
  The markers and the reset button are `ng-template`s used by all three rows; the built-in row's
  switch button takes the provided rows' layout. Where the copies had drifted they now agree: a saved
  workspace's warning mark gets the tooltip the provided rows had, and the built-in row's dot moved
  by one pixel (compared by screenshot; the provided list is pixel-identical).
- [x] 7.8 i18n: the translation loader split into namespaces, overrides, the translation tree and the
  loader, its result built from named parts, the namespace warning dev-only like its siblings;
  "language" in internal names; helpers next to what they serve.
  `translation-namespaces.ts`, `translation-overrides.ts`, `translation-tree.ts` and the loader; the
  result is `forkJoin({ host, namespaced, overlay })`. `ServedLanguage` lives in
  `served-languages.ts`; `detectInitialLanguage`, `applyLanguage`, `applyStored` and the `active`
  signal inside `LocaleService`. The fallback language was already one constant.
- [x] 7.9 Persistence: the boot latch split into a command and a query, small duplicates removed.
  **Move:** `cross-tab/` and `identity-scope/` sub-themes, with file names matching the classes.
  `BootLatchedIdentity.latch()` latches and notifies, `current()` only reads. `peekThrough` forwards an
  optional `peek` for both store wrappers, `registerIn` holds the disposer both sync registrations
  wrote, and `LocalStorageStore` no longer returns twice. `cross-tab/` and `identity-scope/`, with
  `boot-latched-identity.ts`, `identity-scoped-store.ts` and `provide-identity-scoped-stores.ts`.
- [x] 7.10 Settings: **move** `settings/` to `settings-dialog/`; the JSDoc of `SettingsService` says what
  happens today; the remaining small names of the area.
  In two PRs: the folder and the settings JSDoc, then the small names of the whole group
  (`WorkspaceDiscardConfirmation`, `argumentProblem` with `declaredArguments`, `announcesUnusable`
  with the id set private, the gap checks reading the id from the definition) and the published
  JSDoc lines that began with a stray colon, one of them in the plugin contract. `holdsStrings` stays
  in the missing-key handler: both its users are in `i18n/` now.
- [x] 7.11 Tests: `workspace.service.spec.ts` split by concept, the `settled()` helpers named after what
  they wait for, `settings-store.spec.ts` named for the four ports it tests.
  The service spec keeps the facade; change tracking went to `working-state/unsaved-workspaces.spec.ts`,
  the declared workspaces to `catalog/declared-workspaces.spec.ts`, the adopted initial workspace to
  `opening/workbench-opening.spec.ts` (2169 tests before and after). The helpers are `appStable`,
  `appStableAfterPromiseChains`, `nextTask`, `contentLoaded` and `effectsThenTwoTasks`; the ports spec
  is `persistence-ports.spec.ts`.

## 8. Commands, menus, dialogs, capture and the element kit

- [x] 8.1 **Move:** `commands/` into `keyboard/` and `palette/` (with `palette/entry/`); `keybinding.ts`
  to `chord.ts`; the recently used commands service to `recent-commands.service.ts`.
  `RecentCommandsService` (the class follows its file; the storage key stays `lw.shell.command-mru`).
  `host-command-ids.ts` stays at the top of `commands/`, beside the two services.
- [x] 8.2 **Move:** the frame-kit bundle entry out of `elements/` into `surface-kit/`; `build.mjs`
  follows.
  `surface-kit/surface-kit.frame.ts`; `build.mjs` and the lint exception follow. All five frame-kit
  artifacts built before and after are byte-identical.
- [x] 8.3 Menus (after the list-menu defect is fixed): `MenuService` split into resolution, drawing and
  wording; one row builder and one rule for the leading columns; `MENU_ANCHOR_GAP` imported from its
  owner; the trigger directive's names; the heading writer returns its label; the spec split.
  `menu-resolution.ts` (which items show) and `menu-drawing.ts` (one `MenuRow`, one
  `reserveLeadingColumns`, one row element); the service maps both inputs to rows and keeps
  opening, presenting and running. The wording already had its file and `wordingChanges`. The
  directive says `MenuIds`, `hasMenuIds` and `lwMenuAnnounced`. Delegating the run to
  `CommandService.trigger` would add a published parameter and stays on the owner's list.
- [x] 8.4 Keyboard: one alias table for parsing and display, one "contested chords" function shared
  with the composition report, the private `invoke` renamed.
  `TOKEN_ALIASES` and `TOKEN_LABELS` in `chord.ts`, pinned by a test that every alias binds and
  shows like its canonical token; `chordClaims` feeds `bindChords` and the composition report;
  `formatChordOn` for the platform-given display; the private `invoke` is `callInline`.
- [x] 8.5 The palette: rows instead of entries, row builders for commands and tabs out of the
  component, `mode` a plain field, the search entry's test id derived.
  `command-rows.ts` and `tab-rows.ts`, `matching` and `ranked` beside the fuzzy score; the palette is
  203 lines. The search entry derives `command-palette-entry` and `quick-open-entry` from the command
  id. A shared base for the two published options interfaces would put an unexported type into the
  packed declarations, so they stay as they are; their JSDoc lost a roadmap code.
- [x] 8.6 Elements: one element list for host and frame with one define-once helper; shared helpers
  for Enter and Space activation, number attributes, viewport clamping and roving focus; the select's,
  tooltip's and nav tree's names and long methods.
  In two PRs. `lw-elements.ts` holds the one list; `custom-elements.ts`, `viewport-fit.ts` and
  `roving-focus.ts` the shared behaviours. The select says `isOpen`, `withoutObserving`, `close` and
  `dismiss`; the tooltip places by cursor or by trigger and then clamps; the nav group renders heading,
  chevron and label apart and names the fold it remembers. `pathOf` stays, beside the tree, because it
  must read an item that is not upgraded yet. For the release notes: `lw-frame.css` no longer carries
  a `.block` rule that Tailwind had picked up from `scrollIntoView({ block })`. 9.8 brings it back, so
  against 0.14.1 the stylesheet only gains rules.
- [x] 8.7 Surface kit and capture: the frame entry split by job; the capture message types taken from
  the frame declarations instead of three copies; "drawing" used for one thing; the capture helpers
  split by what they do.
  In two PRs. The entry keeps the declarations (its `.d.ts` is emitted alone) and hands its jobs to
  `surface-render-state.ts`, `surface-state-mirror.ts` and `surface-self-capture.ts`. The host reads
  `LwSurfaceCapture` and `LwSurfaceCaptureRequest` with `import type`; a request is `DrawRequest`, its
  form `PictureEncoding`, a decoded answer an `image`. `surface-answer.ts`, `deadline.ts` and
  `ask-surface.ts` replace `surface-capture.ts` and `decode-drawing.ts`. `captureScale` and
  `drawAbsent`, which both sides draw with, sit in `surface-kit/picture-primitives.ts`, so the slice
  graph gains no pair. `lw-frame.d.ts` and `lw-frame.css` are byte-identical throughout.
- [x] 8.8 Dialogs and pop-out: the confirm and prompt footers built once, one result rule for button
  and Enter, `canBeDismissed`; the pop-out passes translation keys; the one-line `DialogRef` re-export
  file goes.
  `toneIcon`, `cancelAndConfirm` and `customButtons` in the service; `confirmedResult` and
  `validationError` in the outlet. The package now re-exports `DialogRef` straight from the SDK.
- [x] 8.9 Icons: the registry file carries the registry, the class that polices plugin icons is named
  for that, the spec calls `resolveIcon`. Command invocation computes ownership once.
  `icon-registry.ts` is the store (was `icon-registry-global.ts`); `PluginIconContributions` in
  `plugin-icon-contributions.ts` polices plugin icons and lost its spec-only `resolve`. The invocation
  service asks `isOwnCommand` once and passes a `Caller` instead of an id and a boolean.

## 9. The published packages: layout and text

- [x] 9.1 The npm READMEs of `@loomweaver/plugin-sdk` and `@loomweaver/frame-kit` say what the package
  is and point to the docs; the frame-kit README stops listing members by hand.
- [x] 9.2 The plugin contract's JSDoc: unresolvable references and broken sentences, other products'
  names, retired behaviour (`openContentTab`'s content group, `View.icon`), history and roadmap notes,
  internal jargon. Two pull requests, split by file.
  "Rung" stays where it names the trust ladder the glossary defines; unifying the terms is 9.3.
- [x] 9.3 The plugin contract's JSDoc, second pass: one term per concept (trusted plugin, sandboxed
  plugin, callable, user, plugin), one fixed "Needs the `x` capability." sentence per `ctx` member
  instead of the drifted lists on `Capability`, hovers that open with one plain sentence, file-level
  blocks moved onto their symbols, one line where a much-used member has none.
- [x] 9.4 **Move:** `plugin-sdk/src/lib` into `plugin/`, `commands/`, `surfaces/`, `chrome/` and
  `host-ui/`, with `content-route.ts`, `plugin.ts`, `view-state.ts`, `contribution.ts` and
  `settings-model.ts` split or renamed after what they hold; the barrel grouped by sub-theme; export
  names compared before and after on the packed declarations; the baseline entry removed; `llms.txt`
  links updated.
  `command.ts` was split as well (arguments, invocation, the command), so `commands/` holds more than
  one file. The 111 packed exports and the text of every declaration are identical before and after,
  and so is the frame kit's `lw-frame.d.ts`.
- [x] 9.5 Declarations written once where the packed shape stays identical: `ContentSurface` from
  `SurfacePresentation`, the retention fields and the trigger, menu and picture fields from shared
  bases, `ContainerTabLabel` from `ContentTabLabel`.
  `ContentSurface` is `SurfacePresentation`, `View` and `ContentRouteBase` pick `retain`, `saveOn`,
  `closable` and `padded` from `SurfaceBase`, and `ContainerTabLabel` picks from `ContentTabLabel`;
  `ViewAction` moved into its own file so `View` can read `SurfaceBase` without a file cycle. A strict
  type-identity check of the packed declarations before and after finds every changed type
  identical. Set aside: the trigger, menu and picture fields of `RailItem` and `BarButtonItem`. Their
  texts differ where the two differ (a rail item's workspace and current-marking notes, a bar
  button's optional icon), so picking one from the other would show the wrong text, and a neutral
  base would be a new published type.
- [x] 9.6 The shell's and the adapter's published JSDoc: the same cleanup as 9.2 for the content tab
  service, the plugin runtimes, the registry, the store, permissions, persistence, settings, layout and
  the elements.
  Read in full on the packed declarations of both packages. Removed: roadmap notes ("(next)",
  "rebinding is deferred", "can be added later", "hardens this later", a follow-up about stacked
  overrides), history ("unlike the old component", "what the shell wrote before"), tracker codes,
  repository paths, links to unpublished classes, a German example label and a reinsurance
  example. The terms follow 9.3: trusted and sandboxed plugin, plugin rather than weaver, user
  rather than person, callable rather than opened, and no "seam", "rung" or "slice". The version's
  JSDoc now says what it shows: the shell's released version until a distribution sets its own.
- [ ] 9.7 The agent adapter (after its flush defect is decided): the stream assembly as a small class,
  answering a call as a top-level function with an explicit guard, typed protocol events, the refusal
  wording once, two message builders instead of a flag, the scalar table typed by kind.
- [x] 9.8 The frame kit (after its declaration defect is fixed): one `@source` for the element folder,
  the spec's tag list complete, the build script's steps named.
  The stylesheet scans the whole element folder, specs included, because leaving the specs out
  would drop `.blur`, `.inline` and `.mt-2`, which a sandboxed surface may use by accident. It gains
  the rules of the spinner and the shared helpers (`.animate-spin`, `.block`, `.border-2`,
  `.border-current`, `.border-t-transparent`, `.contents`, `.inline-block`, `.rounded-full`,
  `.shrink-0`, `.text-brand`) and loses none; the other four artifacts are byte-identical. The spec
  names the three nav tree tags. The build runs `bundleElements`, `writeDeclaration`, two
  `vendorGlobal` calls and `compileStyles`.
- [ ] 9.9 Workspace configuration: the lint inputs that name missing files, the `test-setup.ts` ignores
  of packages without one, the renamed-on-import vitest export, one module setting for the two ESM
  packages, one shared Angular lint config for the four Angular projects. The removal from all eleven
  `project.json` files after the owner's decision.
  Done except that last part. `nx.json` no longer names `.eslintrc.json`, `.eslintignore`,
  `tools/eslint-rules` or `test-setup` files, none of which exist; the tsconfig, lint and Sonar
  ignores of `test-setup.ts` are gone for the same reason; the vitest helper is exported as
  `nodeLibraryTestConfig`; the SDK and the adapter inherit one module setting (their packed output is
  byte-identical); the root `eslint.config.mjs` exports `angularConfig`, which the four Angular
  projects use, and the resolved config of eleven sample files is identical. It lives in the root
  file because that file is already a lint input of every project.

## 10. Tooling

- [x] 10.1 **Move:** `generators/shared.ts` to `workspace-tree.ts`, `nx-scaffold-shared.ts` to
  `project-config-files.ts`, the auth-source `recipe-amendments.ts` to `amendments.ts`,
  `scaffolds/surface.ts` to `adapter-options.ts`.
- [x] 10.2 One source each: the id pattern and casing helpers in `casing.ts`, the `--styles` and
  `--preset` choice lists, one platform version literal (bump script and checker follow), and a spec
  that holds the validator's capability and consent lists equal to the plugin contract's.
  `casing.ts` holds `KEBAB_ID_PATTERN` and `kebabCase` (still published under that name); the
  scaffolds and the schema `$id` use them, and the CLI takes `toTitleCase` from the devkit and calls
  its own helper `packageNameToId`. The recipes own `DISTRIBUTION_STYLES` and `THEME_PRESETS`, the
  types derive from them and the scaffolds offer them as choices. The weaver generator asks for the
  adapter at `PLATFORM_VERSION`; the bump script and `check-agent-versions` lose the second literal.
  `contract-vocabulary.spec.ts` holds the capabilities and the consent values equal to the
  contract's; the consent sentences are a table instead of a switch.
- [x] 10.3 The Nx generators build their recipe input through the same mappers as the other routes;
  the scaffold value readers in `scaffold-values.ts`. **Move:** each recipe's scaffold descriptor next
  to its recipe, `inputs.ts` removed.
  In two PRs. Content: the weaver and distribution generators call `weaverInput` and
  `distributionInput`, which now declare `WeaverInput` and `DistributionInput`;
  `scaffold-values.ts` holds the value types, `stringValue`, `booleanValue` and the shared options, so
  `scaffolds.ts` and `inputs.ts` no longer import each other. Move: every recipe folder has a `scaffold.ts` with its
  descriptor and, where it has one, its input mapper; `scaffolds.ts` is the ordered list and
  `findScaffold`.
- [x] 10.4 How registering a plugin looks is rendered once and used by composing, describing and the
  "not registered" message; `describeAmendment` switches over the kind.
  `registrationLines` in `compose.ts` feeds `composePlugin`, `composeLines` (which both "not
  registered" messages print) and `describeAmendment`; the shell symbols and `quotedList` are written
  once, and the weaver recipe uses `quotedList`. `describeAmendment` switches over the kind with a
  `never` default and describes a build target in `describeBuildTarget`. The output of every
  scaffold's amendments is identical before and after. Set aside: the "was NOT registered" sentence
  stays in the CLI and in the Nx route, because sharing it would add a published devkit export.
- [x] 10.5 The Nx generators apply the recipes' amendments through one `applyAmendments`, the twin of
  the CLI's `Amender` (after the generator defects are fixed); the four divergences between generator
  folders go.
  `generators/apply-amendments.ts` applies every kind through one switch; the weaver and auth-source
  generators hand it their amendments and their app, and the distribution generator its postcss
  amendment, because its build target is its own project file and the documented Nx route installs
  the runtime packages first. The generated trees of the weaver, auth-source, frame-plugin and
  distribution generators are byte-identical before and after. The frame-plugin generator uses
  `writeFilesGuarded` and `FramePluginGeneratorSchema`, its recipe says "Frame plugin id", and the
  auth source's import path comes from `posix.relative`. Set aside: sharing the code-written postcss
  file list with the CLI, which would add a published devkit export, and starting the Nx
  distribution from a minimal build target, which would change the `project.json` it writes.
- [x] 10.6 Region ids are a typed table the templates interpolate; `check-region-ids.mjs` reads it.
  `shell-regions.ts` names each region once (`RAIL_REGION`, `STATUS_BAR_REGION`, …) and holds them
  in a typed table that `renderRegions` renders; the weaver, agent, auth-source, distribution and
  layout templates interpolate the names. Every scaffold's generated files are byte-identical. The
  checker resolves the names and now also reads the agent panel's dock.
- [x] 10.7 The CLI: `run.ts` split into commands with a command table, `init/`, `scaffold/` and
  `validate/` folders, init steps as a union, the angular.json reading in one file, the workspace type
  without casts, flag typing once, the target application chosen by one rule, devkit defaults reused.
  Part 1: `run.ts` keeps the command table and `run()`; `help.ts`, `exec.ts`, `io.ts`,
  `validate/validate-command.ts` and `scaffold/scaffold-command.ts` hold the commands, and `init/` and
  `scaffold/` the rest (the folder guard needs the move in the same pull request).
  Part 2: `Workspace` is a union of a configured and an unconfigured workspace, so the casts go;
  `angular-config.ts` is the one reader of `angular.json` for the workspace lookup and the wiring;
  `amend.ts` keeps the dispatch, postcss and packages, and `project-wiring.ts` the build target,
  stylesheet and composition root, both writing to an `AmendLog`.
  Part 3: init steps are `ExecStep | ScaffoldStep`; `Plan` is `InitPlan`; one `Application` type;
  the scaffold flags are typed through `stringFlag`/`boolFlag`, and a scaffold's values are computed
  once; the MCP's `valuesFor` is `portableValuesFrom`. Set aside: a failing install still leaves
  `init` through the exception `run()` reports, because returning 1 from the step would add a line
  to the output; the Nx application rule stays as it is, because aligning it with the generator's
  changes which application is chosen; and the devkit defaults stay restated, because the weaver's
  default project root is not published and resolving the shortcut through `resolveWeaverInput`
  would fail an invalid `--weaver` id before the install runs.
- [x] 10.8 The weaver recipe split into input resolution and view templates; resolved inputs named
  instead of single letters; the validators' helper names; the emitted auth-source, agent panel and
  README text simplified, with `docs/samples.md` and `docs/scaffolding.md` in the same pull request.
  Part 1: the resolved inputs are `weaver`, `distribution`, `source`, `plugin`, `project`, `layout`,
  `store`, `theme` and `args` instead of single letters, renamed through the language service; the
  catalog validator checks the id, the same-origin URLs and the name and version in three named
  functions, with `requiredUrlFinding`, `optionalUrlFinding` and `pathOf`; the command validator's
  helpers are `readRegistration` and `findingsFor`, and its property map holds nodes, so the double
  cast goes. Generated files, generated trees and catalog findings are byte-identical.
  Part 2: `weaver-input.ts` resolves the input (types, access, chord check, features,
  capabilities), `weaver-views.ts` holds the view, child view, about dialog and spec templates, and
  `recipe.ts` builds the file map; `weaver-terms.ts` is folded into `weaver-plugin.ts`, whose three
  access lines come from `accessLine`; braceless multi-line `if`s get braces. Output identical.
  Part 3 changes the emitted code on purpose: the auth source exports `signIn…User`,
  `switch…Account` and `signOut…User` instead of a three-state cycle the plugin had to call in loops,
  the plugin's redraw wrapper is `andRedraw` and its ids come from `SESSION_PLUGIN_ID`; the agent
  panel answers through `pushAnswer`, the stand-in pauses for `PAUSE_MS`; both READMEs take the
  untagged note from `readme-notes.ts`. `docs/samples.md` shows the new auth source (the recipe spec
  compares it); `docs/scaffolding.md` still says what holds.
- [x] 10.9 The package READMEs and the generated `LOOMWEAVER.md` describe the tree and the build wiring
  as they are, one section per route; one bundle helper for the two tooling bins; validator messages
  once; CLI test fixtures and app-resolution tests written once.
  Part 1: `platform/tools/bundle-tooling-bin.mjs` bundles both bins (byte-identical output);
  `cli/src/lib/test-fixtures.ts` holds `capture`, `writeFiles` and `inDirectory`;
  `generators/app-resolution.spec.ts` states the app-resolution tests once for the five file
  generators; the auth-source spec names its sample instead of a number. Set aside: the two doubled
  validator messages, because sharing the missing-TypeScript text would add a published devkit
  export and dropping the MCP result's `note` would change what the published MCP server returns.
  Part 2: the CLI README names `init`, `validate-commands`, the `loomweaver` bin and the wiring the
  CLI does; the devkit README lists the recipes by folder, the amendments, `validateCommands`, the
  `--container` and `--agent` flags and `formatChord`; the generated `LOOMWEAVER.md` says once, per
  route, who wired the build, and counts two production settings.

## 11. The testbed

- [x] 11.1 Delete `proxy.conf.js` with its option and lint blocks, and the JUnit reporter no workflow
  reads.
- [x] 11.2 **Move:** the testbed weaver from `plugin/` and `views/` into folders named for the
  capability each exercises (access gating, containers, entry tabs, dashboard, navigation, routed
  pages, state readouts, dialogs, chrome, theming); both baseline entries removed; `llms.txt` updated.
  Every file that belongs to one capability moved as it is; `views/` is gone. `plugin/` keeps the
  plugin and the four files that register across capabilities (commands, surfaces, content,
  storage) until 11.3 hands their parts to the folders. The structure baseline is empty now;
  `llms.txt` needed no change, since `testbed.plugin.ts` stayed where it is.
- [x] 11.3 Each capability folder registers its own commands, surfaces and chrome; the content actions,
  entry helpers, the persisted cross-tab choice and the principals (by name, not index) follow.
  Part 1: `persisted-choice.ts` reads, writes and announces a stored choice for the auth and the
  theme, replacing `testbed-storage.ts` and two hand-rolled copies; the principals are keyed by name
  with the cycle as an explicit list, the stored value is the name, and `cycle()` returns nothing.
  Part 2: every folder has a `register-…` holding its own surfaces, commands and chrome (all 89
  registrations accounted for), and `testbed.plugin.ts` at the weaver root is the table of
  contents; `plugin/` is gone. `bound-context.ts` gives views the plugin's context,
  `entry-tabs/entry-tab-actions.ts` owns the open entry tabs, the navigation commands use path
  constants their slice exports, the container, sandbox and dashboard openers sit with their
  commands, `formatWaitingTime` sits with the entries and the drafts in `entry-drafts.ts`; each file
  that toasts names its `TOAST_MS`. The end-to-end suite passes.
- [x] 11.4 The container vocabulary in code, i18n, test ids and end-to-end paths (today
  "workspace", "ws" and "sim").
  Surfaces `testbed.container` and `testbed.container…` children, path `container/:id`, command and
  rail item `…container`, the views `Container…View` in `container-…-view.ts`, the i18n section
  `container` (`name`, `body`, `itemCount`, `stepCount`), the test ids `testbed-container-…` and
  `container-…`, and `containerIdFromRoute()` in `container-id.ts` for the five views. The shell's
  own workspaces in the testbed app keep their names. The end-to-end suite passes.
- [x] 11.5 View names say which surface they serve; the omitted route says so; schema, exports,
  hard-coded English, demo leftovers, chrome ids and field classes.
  `AdminRouteView` and `AdminAreaView` (were the escalations and team views); `testbed.omitted` at
  `omitted` (was `retired`), with the claim, the omit and its end-to-end test; no
  `CUSTOM_ELEMENTS_SCHEMA` on three views without custom elements; the chart geometry in
  `dashboard-chart.ts`, `StatusShare` for the status rows and plain fields for constant chart
  strings; the outline sort labels translated, the container tab titles named `literalTitle`;
  `1_testbed`, the testbed namespace, the sign-in cycle, a neutral tagline and `ENTRY_SUBJECTS`;
  rail ids `testbed.rail.…` and bar ids `testbed.bar.…`, `BROKEN_PICTURE_URL` once and the account
  picture from readable SVG; `lw-field` on the notes and search inputs. End-to-end suite passes.
- [x] 11.6 `main.ts` becomes the table of contents of the distribution: layout, workspaces declared
  once in rail order, plugins with grants taken from their manifests, end-to-end switches, cross-tab
  sync and capture wiring in named files.
  `app/testbed-layout.ts`, `testbed-workspaces.ts` (six workspaces in rail order, their rail items
  derived), `testbed-plugins.ts` (grants from the manifests and descriptors), `e2e-switches.ts` (the
  three storage keys), `cross-tab-sync.ts` and `capture/provide-capture.ts`, which binds one capture
  function for the plugin and the `lwCapture` global instead of a stored injector; the capture
  strings are translated, the feature flags merge over the patch's own groups. `main.ts` is 60
  lines. The end-to-end suite passes.
- [x] 11.7 The sandbox and store example plugins (after their defects are fixed): **move**
  `sandbox-static` to a name for what it exercises; their texts match what they register; tokens
  without hard-coded colours; `sandbox-rpc/view.js` (433 lines) split into markup, strings, veto and
  menu; `public/**` scripts linted.
  So far: `sandbox-static` is `sandbox-rest` (folder, ids, route prefix, the `sandboxRest` i18n
  section, "Sandbox (rest route)"), and its page describes the rest route, the withheld line and the
  docked surface it actually registers, with neutral example paths and colours from the frame kit's
  tokens and `lw-badge`. The end-to-end suite passes. The store plugins' pages, READMEs and catalog
  entries say they open a page at `/store-full` or `/store-minimal` and list the grants they hold;
  `store-full` titles its page with a literal instead of borrowing the testbed weaver's key, as the
  guide says a store plugin must; both pages take their colours from the frame kit.
  `sandbox-rpc/view.html` carries the page as a fixed skeleton that `view.js` fills with
  `textContent`, so no markup is built from strings and nothing is escaped; the strings table is
  `view-strings.js`, the close veto `close-veto.js` and the context menu `context-menu.js`; the page's
  state is one object at the top of `view.js`, the inline styles are classes and no colour has a
  `#hex` fallback. Screenshots before and after match, and the end-to-end suite passes.
  The scripts in `public/` are linted as classic browser scripts: the testbed's lint config ignores
  only the pages, and turns off for these scripts the two rules that assume modules (the function
  wrapper and handing values across files on the global), with its reason; the findings are fixed,
  failed host calls are reported instead of swallowed, and the docked frame's `set` helper is
  `showText`.
- [ ] 11.8 One icon set for the platform apps; end-to-end helpers and the weaver's Transloco setup
  written once.

## 12. The demo

- [ ] 12.1 `demo/README.md` matches the code and gains a reading order and a legend of the folders;
  `quotes/README.md` says what the quotes weaver does or goes.
- [ ] 12.2 No-ops and leftovers: `padded: false` where it is the default, `CUSTOM_ELEMENTS_SCHEMA`
  without a custom element, an explicit OnPush, dead code and dead strings, exports nobody imports,
  the unused payments descriptor, computed wrappers around a signal, the dashboard's names.
- [ ] 12.3 **Move** (after the owner's decision on the weaver shape): one shape for all six weavers.
- [ ] 12.4 **Move:** the finance ledger from `accounting/` to `finance/`.
- [ ] 12.5 **Move** (after the owner's decision): the composition folders under `app/`, with the link
  in `docs/distribution/auth.md`.
- [ ] 12.6 One active-language signal, the formatters called directly, lookups next to their data; the
  date helpers once in `accounting/clock.ts` (after the month defect is fixed).
- [ ] 12.7 Quotes: the customer pane's tab relabelling named, quote creation by id and by search,
  status labels, order and colours once, full translation keys in data, small names.
- [ ] 12.8 Insights reads `ctx.session` with the `session` capability, as the access-gating guide
  teaches; its two surface ids say why there are two.
- [ ] 12.9 The agent: file names that tell script and events apart, the translator passed in, typed
  protocol events.
- [ ] 12.10 The action facades use one guard style and names distinct from the store functions; one
  guarded storage helper; the account rail named for what it is; the About command, settings section
  and bar item get ids of their own.
- [ ] 12.11 The overview module declares its left panel and home role instead of four inferences.
- [ ] 12.12 One supplier list shared by procurement and finance; "open items" and "receivables" used
  for what they are.
- [ ] 12.13 Each module weaver ships its strings in its own namespace, one weaver per pull request.
- [ ] 12.14 After the owner's decision: one idiom for record lists, one module per pull request; the
  selector prefix.
- [ ] 12.15 The sandboxed payments plugin: `view.js` (440 lines) split, the renderer no longer books
  confirmations, shared keys and defaults in one script, activation with `async`/`await`.
- [ ] 12.16 End-to-end tests: the design reasons written in two comments move into names, then all 46
  narration comments go and `e2e/**` is linted; shared locators; the overclaiming test name.

## 13. The example

- [ ] 13.1 One entry README that matches the code; the weaver READMEs say what each weaver does in
  this example; `LOOMWEAVER.md` reduced to a pointer.
- [ ] 13.2 Tickets (after its lookup defect is fixed): one function per action that both the command and
  the button call, the status list and lookup once, named answer shapes, the route and surface id once,
  the actions file named after its export.
- [ ] 13.3 The agent vocabulary starts in the generator: connection and agent named apart, typed
  protocol events, `docs/scaffolding.md` and `docs/samples.md` in the same pull request.
- [ ] 13.4 The example's assistant, regenerated from 13.3: every event handed to the adapter, the key
  handling out of the panel, a consent text that fits any command, and a paragraph in
  `docs/ag-ui-agents.md` on agents that run several rounds.
- [ ] 13.5 Leftovers (routes, stylesheet, unused dependencies, redundant sources, exports) and form
  fields held in signals; the selector prefix after the owner's decision.

## 14. The website

- [ ] 14.1 The landing page (after its media defect is fixed): one themed picture component, the tour
  and the highlights as components owning their data and scripts, one demo link component, the
  stylesheet's repeated blocks once, the landing media list shared with `sync-docs.mjs`.
- [ ] 14.2 The structured-data builder as a tested module in `website/tools/`, a guard for the package
  manager selectors, the consent banner's `show` and `hide`.
- [ ] 14.3 After the owner's decision on comments in `.astro` and CSS: the checker covers the website
  or drops it as a root, and the stale "five entries" statement goes either way.

## 15. Tools and scripts

- [ ] 15.1 `sync-docs.mjs` (530 lines) split into named steps with one link rewriter that returns the
  media it found (after the sidebar guard defect is fixed).
- [ ] 15.2 Shared helpers for the checkers: one ratchet comparison, one table of the published
  packages, the built-in recursive directory read, `parseArgs`.
- [ ] 15.3 `check-quick-start.mjs` (517 lines) split into generating, byte checks and browser steps,
  sharing the preview server.
- [ ] 15.4 Scripts: `bump-version.sh` iterates one package list, stale statements in tools and scripts
  corrected, one licence allowlist, the dev certificate named for what it is, `check-head.mjs`'s loop
  split, `dist-tag.mjs` failing closed.
- [ ] 15.5 `docs/reference/operations.md` stops stating the baselines' entry counts.
- [ ] 15.6 **Move** (after the owner's decision): sub-folders in `platform/tools/`.

## 16. Tests, lighter lens

- [ ] 16.1 Test names across the repository state the behaviour instead of tracker codes, finding
  numbers or downstream product names (the review lists about forty).
- [ ] 16.2 The remaining specs over 600 lines that mix concepts are split where their source was not
  split by a task above.

## 17. Hand-over

- [ ] 17.1 Reconcile this change with what was done: tasks set aside get their reason in `design.md`.
- [ ] 17.2 Run `openspec validate --all --strict`, the full unit suites, the testbed and demo
  end-to-end suites and every guard; archive the change.
- [ ] 17.3 The release that carries 4.2 names its two renamed element tags under "Changed"
  (`lw-content-area` is `lw-address-pane-header`, `lw-content-secondary-pane` is `lw-surface-body`),
  because a product's unlayered CSS may target them; when the demo adopts that release, its breeze
  look in `demo/src/looks/looks.css` and `demo/e2e/dashboard-narrow-pane.spec.ts` follow. They stay
  on the old tags until then, since the demo runs against the published packages.
