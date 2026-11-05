# Tasks

Every task is done when a test that failed before the fix passes. Where a task names no test file,
the test sits beside the source it names. Paths in groups 1 to 6 are under
`platform/libs/core/shell/src/lib/`.

## 1. The plugin trust boundary

- [x] 1.1 A catalogue entry cannot take the id of a plugin composed into the application as its own code: such ids are claimed like composed frame plugins (`plugin/frame/frame-plugin-runtime.ts`, `runnable-frame-plugins.ts`, `plugin-store/lifecycle/plugin-install.service.ts`)
- [x] 1.2 A connection that fails late does not deactivate the newer instance of the same plugin (`plugin/frame/frame-plugin-runtime.ts`; the test's `destroy` rejects the pending connection)
- [x] 1.3 A plugin outside the application's own code cannot replace a route, view or menu entry another owner holds; refused and reported (delta; `plugin/frame/rpc/frame-rpc-methods.spec.ts`)
- [x] 1.4 Entries from a product's own catalogue port are read as defensively as those from an address (`plugin-store/catalog/plugin-catalog-entries.ts`)
- [x] 1.5 A frame that never connects is cleaned up and reported after a time limit (`plugin/frame/frame-plugin-runtime.ts`)
- [x] 1.6 A stored revocation is not honoured for a deployed plugin (`permissions/capability-grant.service.ts`)
- [x] 1.7 Retitling a surface, updating its action or its badge reaches only the caller's own surface of that id (`plugin/context/plugin-surface-ownership.ts`, `contributions/contribution-registry.ts`)
- [x] 1.8 A switched-off or failed frame plugin is described at the rung it runs at, not as trusted (`plugin-isolation/plugin-isolation-level.service.ts`, `plugin/enablement/permissions-settings.spec.ts`)
- [x] 1.9 A menu heading's picture address from a frame is held to the same schemes as every other address from a frame (`plugin/frame/rpc/sanitize-inputs.ts`)
- [x] 1.10 A frame settings section's id cannot collide across plugin ids that contain dots, and the store's settings link matches the plugin exactly (`plugin/frame/frame-settings-section.ts`, `plugin-store/installed-plugin-list.ts`)
- [x] 1.11 Uninstalling a plugin removes its stored switched-off flag, so a reinstall starts enabled (`plugin-store/lifecycle/`)
- [x] 1.12 A facade a plugin kept (`host`, `session`, `activeContent`) refuses after its capability is revoked (`plugin/context/host-plugin-context.ts`)
- [x] 1.13 With a settings store that answers only asynchronously, a plugin the user switched off is not activated before the answer (`plugin/enablement/`)
- [x] 1.14 A catalogue entry's name and description are shown as plain text in the consent, not rendered (`plugin-store/lifecycle/plugin-store-consent.ts`)
- [x] 1.15 Retitling a routable surface registered through the context changes the title its tab and route show (`contributions/surface-normalize.ts`)
- [x] 1.16 Where two owners hold a surface of the same id, the toolbar reads the actions and the owner of the surface it is drawn for, not of the first match (`contributions/contribution-registry.ts`, `regions/toolbar/toolbar-slots.service.ts`)
- [x] 1.17 Uninstalling a plugin removes its stored capability revocations, so a reinstall holds what its consent showed (`plugin-store/lifecycle/plugin-install.service.ts`)
- [x] 1.18 A frame plugin whose connection failed is not started again on every later reconcile: it is retried when its entry changes or the user switches it on again, and stays reported until then (`plugin/frame/frame-plugin-runtime.ts`)
- [x] 1.19 The guides say what the code now does: replacing by re-registering an id names the limit for a plugin outside the application's own code; the pages on the plugin store and permissions state the deployed plugin's stored revocation, the connection time limit and the start after an asynchronous settings store has answered (`docs/`, `llms-full.txt`, `skills/`)
- [x] 1.20 Lead, verify first: a toolbar placed by slot name, and the frame slot bridge, read the surface they belong to where two owners hold the same id (`regions/toolbar/toolbar-slots.service.ts`)
- [x] 1.21 A plugin of the application's own code whose activation failed is not activated again on every later reconcile (`plugin/plugin-runtime.ts`)
- [x] 1.22 A settings section that is refused leaves nothing registered behind: its cross-tab applier is not kept until the frame's session ends (`plugin/frame/rpc/frame-rpc-methods.ts`)
- [x] 1.23 The owner check and the registry agree on what an address is: a surface's address is stored in one normalised form, so `/orders`, `orders/` and `orders` are one slot whoever registers first, and two patterns that differ only in a parameter's name are the same address; a product registering after a frame plugin is the one shown (`plugin/context/surface-admission.ts`, `contributions/registry-filters.ts`, `plugin/frame/rpc/sanitize-surface.ts`)
- [x] 1.24 The wait for an asynchronous settings store applies only to plugins outside the application's own code: in-page plugins start as before and are switched off when the store says so, a frame plugin the user may switch off waits for the answer or the rejection, and the composition report of undeclared slots is not raised early because of the wait (`plugin/enablement/`, `diagnostics/composition-report.ts`, `persistence/stored-values/persisted-setting.ts`)
- [x] 1.25 A capability read a plugin kept, used in a template or a computed after the capability was revoked, tells the user once and does not repeat on every change-detection pass (`permissions/refusal-error-handler.ts`)
- [x] 1.26 The registry's retitle, action update, badge update and badge read reach every owner's surface when called without an owner, and only the caller's own when an owner is given (`contributions/contribution-registry.ts`)
- [x] 1.27 A frame plugin the user cannot switch (required or deployed) whose connection failed or timed out is tried again on a later reconcile; the rule of 1.18 applies to plugins that have a switch (`plugin/frame/frame-plugin-runtime.ts`)
- [x] 1.28 Uninstalling a stored install whose id a composed or deployed plugin holds does not clear that plugin's stored switch-off or revocations (`plugin-store/lifecycle/plugin-install.service.ts`)
- [x] 1.29 An entry a product's own catalogue port answers that is dropped is named in the console once per entry, the way the address catalogue reports what it drops (`plugin-store/catalog/`)
- [x] 1.30 Uninstalling a stored install whose id a composed or deployed plugin holds leaves that plugin's stored state alone too, not only its switch-off and revocations (`plugin-store/lifecycle/plugin-install.service.ts`, `uninstall`)
- [x] 1.31 A badge read without an owner for a surface the workbench owns shows that surface's badge or none, never the badge of another owner's surface with the same id (`contributions/surface-badges.ts`, `badgeOf`)

## 2. Unsaved work and panes

- [x] 2.1 Closing a pane or undoing a split asks about unsaved work in view tabs and container children too: one lookup, the one closing a tab uses (`regions/pane/pane-actions.service.ts`, `pane.service.spec.ts` with a home route)
- [x] 2.2 A tab that changes panes keeps its unsaved work: drag, split, `moveTab`, hand-over on pane close (`regions/pane/retention/parked-view-sweep.ts`, `drag/pane-move.service.ts`, `tree/pane-handover.ts`)
- [x] 2.3 Every pane's strip offers the listing control for tabs that do not fit (`regions/pane/pane-view.html`)
- [x] 2.4 Only the untouched primary pane counts as the default arrangement; an area declared empty stays (`regions/pane/tree/pane-tree-storage.ts`)
- [x] 2.5 Minimised and maximised state does not carry over to another workspace (`regions/pane/chrome/pane-chrome.service.ts`)
- [x] 2.6 Tabs handed over on unsplit are not duplicated within the handed list (`regions/pane/tree/pane-handover.ts`)
- [x] 2.7 A close refusal that answers neither yes, no nor a promise counts as consent (`regions/pane/unsaved-work/surface-close-guard.ts`)
- [x] 2.8 Closing the address pane promotes the pane that takes its space (`regions/pane/tree/pane-handover.ts`)
- [x] 2.9 Lead: minimising or maximising a pane does not reload a retained isolated surface (`regions/pane/chrome/`)
- [x] 2.10 A move that would merge a tab holding unsaved work into one already open in the target pane asks first (`regions/pane/drag/pane-move.service.ts`)
- [x] 2.11 A pane change of an isolated surface that cannot be carried and holds unsaved work asks first
- [x] 2.12 A surface holding unsaved work that did not ask to be kept survives its pane being taken down: workspace switch, pane removal, minimise, blow-up (`regions/pane/retention/retained-view-stash.ts`, `evacuate`)
- [x] 2.13 An instance parked by one workspace is not claimed by another workspace showing the same address in a pane of the same id (`retained-view-stash.ts`, `claimableEntry`)
- [x] 2.14 Lead, verify first: moving the last child out of a container's primary pane promotes the pane that takes its space, as closing does (`regions/pane/tree/pane-structure.ts`, `withoutEmptyPrimary`)
- [ ] 2.15 A view or tab moved to another sidebar is announced, and its panel expanded, only once the move has happened, not while the user is still being asked (`regions/panel/view-move.service.ts`)
- [ ] 2.16 Lead, verify first: a surface that stays mounted across a workspace switch belongs to the workspace now shown, and is not parked later for the one that built it (`regions/pane/retention/`)
- [ ] 2.17 The published description of closing the address pane says that a kept tab the neighbour cannot take is asked about too (`ContentTabsService.closePrimaryPane`)

## 3. Addresses and tabs

- [ ] 3.1 Address parameters reach a surface decoded, the same in every pane (`regions/content/content-path.ts`)
- [ ] 3.2 A home route is not the tab root of every undeclared address: no tab's path is overwritten, and closing to the right of a view tab closes only what is right of it (`regions/content/content-path.ts`, `tabs/tab-navigation.service.spec.ts`, `tabs/tab-closing.service.spec.ts`)
- [ ] 3.3 A retained, hidden isolated surface keeps its own address and is not told another content's query or fragment (`regions/content/surface/iframe-surface.ts`)
- [ ] 3.4 A tab opened under a path with characters the address encodes is the tab the address finds: no duplicate (`regions/content/tabs/tab-opening.service.ts`)
- [ ] 3.5 A slot or state push to a frame that fails or is cut off does not leave an unhandled rejection (`regions/content/surface/iframe-surface.ts`)
- [ ] 3.6 A held address is retried only when its own content registers, not on any registration while a home route exists (`regions/content/routing/content-router.ts`)
- [ ] 3.7 A frame's navigation target with a dot segment or a backslash is refused (`regions/content/surface/iframe-surface-protocol.ts`)
- [ ] 3.8 At an address nothing declares, the active content reads as nothing rather than as the home surface (`regions/content/tabs/content-tab-state.ts`)
- [ ] 3.9 Leads, each verified first: the boot placeholder at an encoded deep link; the session re-match superseding a navigation in flight; the close hook running while the same tab is open in another pane; a failed lazy load leaving the pane blank (`regions/content/routing/content-router.ts`, `tabs/tab-closing.service.ts`, `surface/surface-body.ts`)

## 4. Persistence, identity and workspaces

- [ ] 4.1 A session whose subject is the empty string is nobody: no reload at sign-in or sign-out (`auth/identity-change.ts`)
- [ ] 4.2 Adopting a namespace that holds nothing for a setting leaves what the workbench holds (`persistence/cross-tab/state-sync.service.ts`, `identity-scope/adopting-a-namespace.spec.ts`)
- [ ] 4.3 Resetting a workspace that is not the active one clears its changed and unusable marks at once (`workspace/working-state/unsaved-workspaces.ts`, `usability/unusable-workspaces.service.ts`)
- [ ] 4.4 A read issued before adoption that answers after it does not overwrite the adopted value (`persistence/identity-scope/identity-scoped-store.ts`)
- [ ] 4.5 A picture shows what covers a surface: overlays are not painted over by the surface's drawing (`capture/workbench-capture.service.ts`)
- [ ] 4.6 A contributed translation bundle named like one of the shell's own groups does not replace that group; reported (`i18n/transloco-loader.ts`)
- [ ] 4.7 A stored choice superseded by a declared start opens that workspace from its baseline at any address (`workspace/opening/workbench-opening.ts`)
- [ ] 4.8 A stored active workspace nothing lists any more gives way to the starting one (`workspace/opening/workbench-opening.ts`)
- [ ] 4.9 Sidebar state, widths, the user's order and view state survive a write made before an asynchronous store answered (`regions/panel/panel-state.ts`, `panel-size.service.ts`, `regions/reorder/user-order.service.ts`, `views/view-state.service.ts`)
- [ ] 4.10 Leads, each verified first: resetting a workspace that is not active destroys parked unsaved work without asking; an isolated surface with a page scroll is squashed in a picture; accessible names in the workspace and settings dialogs

## 5. Commands, menus, dialogs and the UI kit

- [x] 5.1 A surface whose title or action was updated is still removed with its plugin (`contributions/contribution-registry.ts`)
- [x] 5.2 A tab's actions opened from the search keep the keyboard (`commands/palette/command-palette.ts`, with the real dialog outlet and menu service)
- [x] 5.3 A menu opened from inside a dialog is drawn above it and keeps the focus; Escape closes the menu alone (`dialog/dialog-outlet.ts`, the menu stylesheet)
- [x] 5.4 A key something already handled runs no command, and typing in a field inside a shadow root is not hijacked (`commands/keyboard/keybinding.service.ts`, `chord.ts`)
- [x] 5.5 Every folded toolbar entry is reachable by keyboard, and the tray closes after a choice (`elements/toolbar/`)
- [x] 5.6 A menu, an open select list and a toolbar tray close when the pointer goes into a frame (`menu/menu.service.ts`, `elements/select/`, `elements/row-fold.ts`)
- [x] 5.7 Asking for the search while it is open does not stack a second one (`commands/palette/palette-commands.ts`)
- [x] 5.8 A menu entry with a submenu keeps the focus when its words change (`elements/menu/lw-menu-item.element.ts`)
- [x] 5.9 Leads, each verified first: a chord with AltGr on Windows typing a character; rendered Markdown keeping `style`, form controls and remote images (struck: none of the three executes, and the scripts, event handlers and script-bearing links the capability names are removed; forbidding more is the owner's decision); `compact` on a select set before the element is defined; the tray's outside listener surviving a layout; closing a submenu dropping the focus; the tooltip's Escape while a menu is open
- [x] 5.10 Asking for the other search while one is open replaces it instead of stacking a second dialog, and the keyboard goes back to where the first was opened from when the second closes (`commands/palette/palette-commands.ts`)
- [x] 5.11 A dialog opened from inside another dialog gives the focus back to a place that still exists when the lower one closed first (`dialog/dialog.service.ts`, `giveFocusBack`)
- [x] 5.12 A menu that is still open when a dialog opens from code is closed, since it is now drawn above the dialog (`menu/menu.service.ts`)
- [x] 5.13 Not reproduced, no code changed: the sync service keeps one applier per key, and a test pins it. Was: A frame that registers its own settings section a second time leaves one cross-tab applier, not two (`plugin/frame/rpc/frame-rpc-methods.ts`). Not reproduced: the sync service keeps one applier per key, a later registration replaces the earlier one and the stale disposer does nothing; a test pins that a change from another window is told once
- [x] 5.14 The arrow keys inside a text field placed as a toolbar cell move the caret, in the row and in the tray; they move the toolbar's focus only from a cell that is not a text field (`elements/toolbar/toolbar-dom.ts`, `lw-toolbar.element.ts`)
- [x] 5.15 A tooltip hides when its trigger is pressed, so it does not stay drawn over the menu that press opened (`elements/tooltip/lw-tooltip.element.ts`)
- [x] 5.16 A dialog that closes while it is the top one gives the focus back to what opened it, also when other dialogs are open below it; and a menu that holds the focus by then inherits that opener (`dialog/dialog.service.ts`)
- [x] 5.17 A menu, tray or bar fold that closes because the window lost the focus does not take the focus back; closing for another reason restores it as before (`elements/row-fold.ts`, `menu/menu.service.ts`, `elements/toolbar/`, `regions/bar/`)
- [x] 5.18 Roving in an open tray leaves a key alone that the control under the focus has handled or uses itself: a select, a range and a radio group keep their arrow keys (`elements/toolbar/toolbar-layout.ts`, `toolbar-dom.ts`)
- [x] 5.19 The workbench's own arrow-key handlers act only on unmodified keys, so a product's command on a modified arrow, Home or End still runs while the focus is in a toolbar, a menu or on a splitter (`elements/toolbar/lw-toolbar.element.ts`, `elements/menu/lw-menu.element.ts`, `regions/panel/panel-splitter.ts`, the pane split handle)
- [x] 5.20 Whether a key types is decided by what it would insert, the same on every platform and browser: in a field, a key the layout turned into a printable character other than the chord's own base key types and runs no chord (`commands/keyboard/chord.ts`)
- [x] 5.21 A toolbar placed inside a surface that renders in a shadow root finds the mark of the surface it sits in (`regions/toolbar/toolbar-host.service.ts`)
- [x] 5.22 A tooltip detached in the middle of a press shows again on keyboard focus when it is attached again (`elements/tooltip/lw-tooltip.element.ts`)

## 6. Bars, rails, sidebars and pop-outs

- [ ] 6.1 A component in a bar is not rebuilt when a command, a bar entry or the session changes (`regions/bar/shell-bar.ts`, `shell-bar-item.ts`)
- [ ] 6.2 With collapsing switched off, a collapsed sidebar offers no control to expand it (`regions/panel/shell-sidebar-header.ts`, `features/switching-off-acts-forward.spec.ts`)
- [ ] 6.3 A content address beginning with `view` round-trips through a pop-out (`popout/popout-path.ts`)
- [ ] 6.4 The compact drawer takes the focus, keeps it, closes on Escape and gives it back (`shell.ts`, `shell.html`)
- [ ] 6.5 A rail entry stored on a rail that is no longer declared is drawn on a declared one (`regions/rail/rail-items.service.ts`)
- [ ] 6.6 A width that is not a finite number is ignored (`regions/panel/panel-size.service.ts`)
- [ ] 6.7 An entry's picture is tried again when its address changes (`regions/rail/shell-rail.ts`, `regions/bar/shell-bar-item.ts`)
- [ ] 6.8 Leads, each verified first: a self-shortening bar entry measured at its shortened width; a bar button without label or tooltip named by nothing; a splitter drag started by any button and never ended; the curation list offering what is switched off; the keyboard move of a parked tab gated by the wrong switch

## 7. The agent connection

- [x] 7.1 A call left open by a run that ended without its last event is not run or answered in the next run (`platform/libs/integrations/ag-ui/src/lib/command-tools.ts`, `tool-call-assembly.ts`); the generated panel and the sample flush on failure too, and the package README names `flush`
- [x] 7.2 A hook that throws or rejects refuses the call instead of ending the run with it unanswered (`command-tools.ts`)
- [x] 7.3 The tests for a command never opened call it by its tool name (`command-tools.spec.ts`, `platform/apps/loom-testbed/src/app/agent-drives-the-workbench.spec.ts`)
- [x] 7.4 A tool is not described by its title where it has no description, and its description says what the command answers (`tool-definitions.ts`)
- [x] 7.5 The generated agent panel shows a failed run instead of letting the stream's error escape from the click handler (`platform/libs/tooling/devkit/src/recipes/angular-weaver/agent-panel.ts`)
- [x] 7.6 A check that answers with no decision, or one the connection does not know, refuses the call, and the agent is not told the error's message (delta; `command-tools.spec.ts`)
- [x] 7.7 The generated panel labels a tool by a name, not by its description with what it answers, and a failing flush cannot leave it busy (`agent-panel.ts`)

## 8. The scaffolding tools

- [x] 8.1 A directory taken from `--out` is written with forward slashes on every platform (`platform/libs/tooling/cli/src/lib/scaffold/scaffold.ts`)
- [x] 8.2 `init` in an Nx workspace refuses to replace files that are no longer as generated, leaves existing TypeScript and lint configuration alone, and its trial run names every file (`cli/src/lib/init/init.ts`, `devkit/src/generators/distribution/generator.ts`)
- [x] 8.3 An application at the workspace root gets relative paths that resolve (`cli/src/lib/init/nx-applications.ts`, `devkit/src/generators/distribution/`)
- [x] 8.4 Composing into a provider list without a trailing comma, or into a file with double quotes, produces code that parses (`devkit/src/lib/amend/compose.ts`)
- [x] 8.5 The command check says it cannot judge a `callable` that is not a literal (`devkit/src/lib/validate/commands.ts`)
- [x] 8.6 The PostCSS wiring goes into the file the build reads, and a script configuration the build ignores is named as ignored (`devkit/src/lib/amend/postcss.ts`, `cli/src/lib/scaffold/amend.ts`)
- [x] 8.7 The distribution scaffold over MCP names the stylesheet source path among what is left to do (`mcp/src/lib/tools.ts`)
- [x] 8.8 An untouched application created with another stylesheet language is recognised (`cli/src/lib/init/ng-new-files.ts`)
- [x] 8.9 A weaver generated into a directory at the workspace root gets paths that resolve (`devkit/src/generators/weaver/nx-files.ts`)
- [x] 8.10 A root-level application without a `tsconfig.json`, in a workspace without a base configuration, does not get one that extends itself (`devkit/src/generators/workspace-tree.ts`)
- [x] 8.11 The PostCSS wiring looks in the project root before the workspace root, as the build does (`devkit/src/lib/amend/postcss.ts`)
- [x] 8.12 The trial run of `init` in an Nx workspace names `package.json` under the step that changes it
- [x] 8.13 `init` asks the devkit where a weaver's project lands instead of assuming `libs/<id>-weaver` (`cli/src/lib/init/init.ts`)
- [x] 8.14 The tooling's spec files type-check, and a target holds that (`libs/tooling/*/tsconfig.spec.json`)
- [x] 8.15 The fixture of an untouched `ng new` application is what Angular 22 writes: regenerated from a real `ng new`, not from memory (`cli/src/lib/init/ng-new-22.fixture.json`)
- [x] 8.16 `init` does not run an older devkit than its own: a `@loomweaver/devkit` at another version than the one the CLI carries is brought to that version as a named install step before it generates, and the trial run lists that step (`cli/src/lib/init/init-plan.ts`, `init.ts`)
- [x] 8.17 Beside a PostCSS script configuration nothing is written, and the note says which JSON file the Angular build would read, what it has to contain, and that creating it shadows the script for other tools (`devkit/src/lib/amend/postcss.ts`, both routes and the footprint)
- [x] 8.18 A trial run of `init` over an application with a changed file prints the listing and then names the changed files, exits non-zero and writes nothing; in an Nx workspace the refusal points at `init --dry-run` (`cli/src/lib/init/init.ts`)
- [x] 8.19 The refusal says a file is not what `ng new` or the Nx application generator (24, default options) writes, not that it is "no longer" what was written (`cli/src/lib/init/init.ts`)
- [x] 8.20 The trial run names a lockfile the install will create, not only one it will change (`cli/src/lib/init/init.ts`)
- [x] 8.21 A directory given as `./apps/x` gets the same paths as `apps/x`: one normalisation of the project root for both generators, and no path is concatenated in `devkit/src/generators/workspace-tree.ts`
- [x] 8.22 A malformed `.postcssrc.json`, `postcss.config.json` or `package.json` met during a trial run is reported as a workspace error naming the file (`devkit/src/generators/nx-footprint.ts`, `cli/src/lib/init/nx-trial.ts`)
- [x] 8.23 The trial run in an Nx workspace says, like the real run, that the style pipeline is left alone beside a PostCSS script and why (`cli/src/lib/init/nx-trial.ts`, `devkit/src/generators/nx-footprint.ts`)
- [x] 8.24 Not reproduced, no code changed: Nx reports the root as `.` and every consumer normalises it; a regression test pins it. Was: The auth-source, layout, theme, settings-store and frame-plugin generators join the application's root to their paths through the shared helper, so an application at the workspace root is written under `src/…` and named without a leading dot (`devkit/src/generators/*/generator.ts`)
- [x] 8.25 A malformed PostCSS JSON file met when a generator really runs is reported naming the file, as the trial run does (`devkit/src/generators/workspace-tree.ts`, `addPostcssPlugin`)

## 9. The demo and the example

- [x] 9.1 Commands that need arguments are not offered in the search (`demo/src/quotes/quotes-commands.ts`, `demo/src/app/looks/looks.plugin.ts`, `examples/assistant-workbench/src/tickets/src/lib/plugin/tickets.plugin.ts`)
- [x] 9.2 An empty stock count posts nothing (`demo/src/inventory/inventory-actions.ts`)
- [x] 9.3 Ledger account names come from the catalogue (`demo/src/finance/books.ts`)
- [x] 9.4 The assistant's error sentences come from the catalogue, and the unused key goes (`examples/assistant-workbench/src/assistant/src/lib/agent/assistant-agent.ts`)
- [x] 9.5 The dashboard charts carry a role and a name (`demo/src/insights/insights-chart.ts`)
- [x] 9.6 Bank statement dates are the same day in every time zone (`demo/public/payments/matching.js`, `view.js`)
- [x] 9.7 The assistant's prompt keeps the focus across a run (`assistant-agent-panel.html`)
- [x] 9.8 The example compiles with `strict` and `strictTemplates` (`examples/assistant-workbench/tsconfig.json`)
- [x] 9.9 Leads, each verified first: the demo's service worker serving the sandboxed payments plugin offline; unused exports and files in `demo/src`
- [x] 9.10 The example's panel flushes in a `finally`, as the guide says (`examples/assistant-workbench/src/assistant/src/lib/agent/assistant-agent-panel.ts`)
- [x] 9.11 A bank statement line on the edge of the chosen period is in or out by its date, the same in every time zone (`demo/public/payments/matching.js`, the period cutoff)
- [x] 9.12 The answers the example's panel flushes after a run reach the agent's history, so the next run does not meet calls without a result (`examples/assistant-workbench/src/assistant/src/lib/agent/assistant-agent-panel.ts`)
- [x] 9.13 The example's agent repairs a call without a result by looking at the last assistant message and the tool messages after it, so a provider that reuses call ids between rounds cannot make a dangling call look answered (`examples/assistant-workbench/src/assistant/src/lib/agent/assistant-agent.ts`)
- [x] 9.14 A prompt submitted while a run is busy or the connection is not ready is kept in the field, not cleared (`assistant-agent-panel.ts`, `submit`)
- [x] 9.15 `pwa-check` asserts that the files the host page fetches for the plugin store reach the worker's manifest (`demo/tools/check-pwa.mjs`: `/api/plugins.json`, `/payments/README.md`); calibrate by misspelling the group once
- [x] 9.16 A stock count that is not a whole, non-negative number in plain digits posts nothing and says so: `abc`, `-5`, `12,5`, `1e3`, `1.000` are refused with a notice in both languages, `0` and ` 0 ` post zero (`demo/src/inventory/inventory-actions.ts`)
- [x] 9.17 The assistant translates the "model is gone" sentence only when the answer says so (`assistant-agent.ts`)
- [x] 9.18 The guide says what is true of an isolated plugin offline: the worker cannot serve it; whether the browser's own HTTP cache does depends on the headers the host sends, and that is not something to rely on (`docs/distribution/pwa.md`, `frame-plugins.md`, `distribution-api/capture.md`)
- [x] 9.19 A chart is not announced twice and says what it shows: the canvas takes its name from the card's heading by reference, and the quoted-per-month chart has a text alternative with its values, as the pipeline chart has its list (`demo/src/insights/`)

## 10. Tests that could not fail

- [x] 10.1 The sandbox store test waits for the write and asserts both directions (`platform/apps/loom-testbed-e2e/src/sandbox-state.spec.ts`)
- [x] 10.2 The surface inset test fails when no docked surface is found (`surface-inset.spec.ts`)
- [x] 10.3 Clicking a tab in a pane fails when the tab is missing, and the stable-ids test asserts the address moved (`support/helpers.ts`, `stable-pane-ids.spec.ts`)
- [x] 10.4 The testbed's reply field is named in each pane of a split, and the accessibility scan covers a split (`platform/libs/weavers/testbed-weaver/src/lib/entry-tabs/testbed-entry-view.html`, `a11y.spec.ts`)
- [x] 10.7 The test of a secondary pane as a tab group passes every time: it fails in about one run of seven on unchanged code (`platform/apps/loom-testbed-e2e/src/pane-tabs.spec.ts`, the close at its end)
- [x] 10.5 The end-to-end project type-checks clean, and its lint target holds that (`retained-url-pane.spec.ts`, `scrollbars.spec.ts`, the unused import in `content.spec.ts`)
- [x] 10.6 The surface inset test polls for the inset instead of waiting a fixed time (`surface-inset.spec.ts`)

## 11. Guards and the release

- [ ] 11.1 The bundle-size guard counts every file the entry script imports statically; the sum equals the builder's initial total for all four applications, and the ceilings are recorded anew (`platform/tools/checks/check-bundle-size.mjs`)
- [x] 11.2 A release run that failed part-way can be run again: a package already published at that version is skipped and named (`.github/workflows/release.yml`)
- [x] 11.3 The comment guard sees a comment before a closing brace, bracket or parenthesis (`platform/tools/checks/check-comments.mjs`; six shapes reported, the tree still clean)
- [x] 11.4 The comment guard skips only files carrying the generated banner; the six files it skipped are read and cleaned (`check-comments.mjs`)
- [x] 11.5 The licence check matches a licence exactly and covers what a tooling bundle inlines (`platform/package.json`, `demo/package.json`)
- [x] 11.6 The assistant's contract check fails on a parameter the page drops or widens (`platform/tools/checks/check-llms-contract.mjs`)
- [x] 11.7 The deploy key is written directly before the deploy, and the jobs holding secrets pin their actions to commits (`.github/workflows/deploy.yml`, `sonar.yml`)
- [x] 11.8 The release refuses a tag whose stamped versions disagree with it (`.github/workflows/release.yml`)
- [x] 11.9 The dist-tag script answers when it is started through a symlinked path, instead of printing nothing and leaving the tag empty (`scripts/dist-tag.mjs`)
- [x] 11.10 The release's announce step can run again after the release page exists (`.github/workflows/release.yml`)
- [x] 11.11 `release-packages.mjs roots` goes, since no workflow calls it any more
- [x] 11.12 A package is skipped as already published only when the registry says that version was published from the commit being released; a version that exists from another commit, or from one the registry does not name, stops the step before anything is published (`scripts/release-packages.mjs`, `.github/workflows/release.yml`)
- [x] 11.13 The comment on the deploy key step says what the move does and no more: the key is not on disk while the installs and builds run (`.github/workflows/deploy.yml`)
- [x] 11.14 The scanner pin in `sonar.yml` names the version its commit is (`.github/workflows/sonar.yml`)

## 12. What the review did not reach

Each of these is a review. What it finds is added to the group it belongs to and fixed there.

- [ ] 12.1 The end-to-end specs read only by pattern, for tests that cannot fail or that assert a defect
- [ ] 12.2 The templates of panes, tab strips, the address header and the access views against the accessibility capability
- [ ] 12.3 The plugin SDK's commands, surfaces and chrome declarations against what the host delivers, and the frame side of the surface kit
- [ ] 12.4 The shell's stylesheets, and the product-identity, host-services and platform-composition capabilities against the code
- [ ] 12.5 The generator schemas, the tooling READMEs, the unit specs of the testbed weaver and the AG-UI adapter, and `platform/tools/media/`

## 13. Hand-over

- [ ] 13.1 The merge gate's steps pass locally on `main` after the last group merged
- [ ] 13.2 The end-to-end suite passes on `main` at that commit, started by hand rather than waited for
- [ ] 13.3 SonarQube passes on `main` at that commit with no open issue
- [ ] 13.4 `docs/updating.md` says what the next release asks of a product, if anything here does

## Workflow follow-up

- Archive this change once every task is ticked, which takes the delta into `plugin-runtime`.
- The release itself is the owner's decision.
