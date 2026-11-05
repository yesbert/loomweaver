# Tasks

Every task is done when a test that failed before the fix passes. Where a task names no test file,
the test sits beside the source it names. Paths in groups 1 to 6 are under
`platform/libs/core/shell/src/lib/`.

## 1. The plugin trust boundary

- [ ] 1.1 A catalogue entry cannot take the id of a plugin composed into the application as its own code: such ids are claimed like composed frame plugins (`plugin/frame/frame-plugin-runtime.ts`, `runnable-frame-plugins.ts`, `plugin-store/lifecycle/plugin-install.service.ts`)
- [ ] 1.2 A connection that fails late does not deactivate the newer instance of the same plugin (`plugin/frame/frame-plugin-runtime.ts`; the test's `destroy` rejects the pending connection)
- [ ] 1.3 A plugin outside the application's own code cannot replace a route, view or menu entry another owner holds; refused and reported (delta; `plugin/frame/rpc/frame-rpc-methods.spec.ts`)
- [ ] 1.4 Entries from a product's own catalogue port are read as defensively as those from an address (`plugin-store/catalog/plugin-catalog-entries.ts`)
- [ ] 1.5 A frame that never connects is cleaned up and reported after a time limit (`plugin/frame/frame-plugin-runtime.ts`)
- [ ] 1.6 A stored revocation is not honoured for a deployed plugin (`permissions/capability-grant.service.ts`)
- [ ] 1.7 Retitling a surface, updating its action or its badge reaches only the caller's own surface of that id (`plugin/context/plugin-surface-ownership.ts`, `contributions/contribution-registry.ts`)
- [ ] 1.8 A switched-off or failed frame plugin is described at the rung it runs at, not as trusted (`plugin-isolation/plugin-isolation-level.service.ts`, `plugin/enablement/permissions-settings.spec.ts`)
- [ ] 1.9 A menu heading's picture address from a frame is held to the same schemes as every other address from a frame (`plugin/frame/rpc/sanitize-inputs.ts`)
- [ ] 1.10 A frame settings section's id cannot collide across plugin ids that contain dots, and the store's settings link matches the plugin exactly (`plugin/frame/frame-settings-section.ts`, `plugin-store/installed-plugin-list.ts`)
- [ ] 1.11 Uninstalling a plugin removes its stored switched-off flag, so a reinstall starts enabled (`plugin-store/lifecycle/`)
- [ ] 1.12 A facade a plugin kept (`host`, `session`, `activeContent`) refuses after its capability is revoked (`plugin/context/host-plugin-context.ts`)
- [ ] 1.13 With a settings store that answers only asynchronously, a plugin the user switched off is not activated before the answer (`plugin/enablement/`)
- [ ] 1.14 A catalogue entry's name and description are shown as plain text in the consent, not rendered (`plugin-store/lifecycle/plugin-store-consent.ts`)

## 2. Unsaved work and panes

- [ ] 2.1 Closing a pane or undoing a split asks about unsaved work in view tabs and container children too: one lookup, the one closing a tab uses (`regions/pane/pane-actions.service.ts`, `pane.service.spec.ts` with a home route)
- [ ] 2.2 A tab that changes panes keeps its unsaved work: drag, split, `moveTab`, hand-over on pane close (`regions/pane/retention/parked-view-sweep.ts`, `drag/pane-move.service.ts`, `tree/pane-handover.ts`)
- [ ] 2.3 Every pane's strip offers the listing control for tabs that do not fit (`regions/pane/pane-view.html`)
- [ ] 2.4 Only the untouched primary pane counts as the default arrangement; an area declared empty stays (`regions/pane/tree/pane-tree-storage.ts`)
- [ ] 2.5 Minimised and maximised state does not carry over to another workspace (`regions/pane/chrome/pane-chrome.service.ts`)
- [ ] 2.6 Tabs handed over on unsplit are not duplicated within the handed list (`regions/pane/tree/pane-handover.ts`)
- [ ] 2.7 A close refusal that answers neither yes, no nor a promise counts as consent (`regions/pane/unsaved-work/surface-close-guard.ts`)
- [ ] 2.8 Closing the address pane promotes the pane that takes its space (`regions/pane/tree/pane-handover.ts`)
- [ ] 2.9 Lead: minimising or maximising a pane does not reload a retained isolated surface (`regions/pane/chrome/`)

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

- [ ] 5.1 A surface whose title or action was updated is still removed with its plugin (`contributions/contribution-registry.ts`)
- [ ] 5.2 A tab's actions opened from the search keep the keyboard (`commands/palette/command-palette.ts`, with the real dialog outlet and menu service)
- [ ] 5.3 A menu opened from inside a dialog is drawn above it and keeps the focus; Escape closes the menu alone (`dialog/dialog-outlet.ts`, the menu stylesheet)
- [ ] 5.4 A key something already handled runs no command, and typing in a field inside a shadow root is not hijacked (`commands/keyboard/keybinding.service.ts`, `chord.ts`)
- [ ] 5.5 Every folded toolbar entry is reachable by keyboard, and the tray closes after a choice (`elements/toolbar/`)
- [ ] 5.6 A menu, an open select list and a toolbar tray close when the pointer goes into a frame (`menu/menu.service.ts`, `elements/select/`, `elements/row-fold.ts`)
- [ ] 5.7 Asking for the search while it is open does not stack a second one (`commands/palette/palette-commands.ts`)
- [ ] 5.8 A menu entry with a submenu keeps the focus when its words change (`elements/menu/lw-menu-item.element.ts`)
- [ ] 5.9 Leads, each verified first: a chord with AltGr on Windows typing a character; rendered Markdown keeping `style`, form controls and remote images; `compact` on a select set before the element is defined; the tray's outside listener surviving a layout; closing a submenu dropping the focus; the tooltip's Escape while a menu is open

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
- [ ] 7.5 The generated agent panel shows a failed run instead of letting the stream's error escape from the click handler (`platform/libs/tooling/devkit/src/recipes/angular-weaver/agent-panel.ts`)

## 8. The scaffolding tools

- [ ] 8.1 A directory taken from `--out` is written with forward slashes on every platform (`platform/libs/tooling/cli/src/lib/scaffold/scaffold.ts`)
- [ ] 8.2 `init` in an Nx workspace refuses to replace files that are no longer as generated, leaves existing TypeScript and lint configuration alone, and its trial run names every file (`cli/src/lib/init/init.ts`, `devkit/src/generators/distribution/generator.ts`)
- [ ] 8.3 An application at the workspace root gets relative paths that resolve (`cli/src/lib/init/nx-applications.ts`, `devkit/src/generators/distribution/`)
- [ ] 8.4 Composing into a provider list without a trailing comma, or into a file with double quotes, produces code that parses (`devkit/src/lib/amend/compose.ts`)
- [ ] 8.5 The command check says it cannot judge a `callable` that is not a literal (`devkit/src/lib/validate/commands.ts`)
- [ ] 8.6 The PostCSS wiring goes into the file the build reads, and a script configuration the build ignores is named as ignored (`devkit/src/lib/amend/postcss.ts`, `cli/src/lib/scaffold/amend.ts`)
- [ ] 8.7 The distribution scaffold over MCP names the stylesheet source path among what is left to do (`mcp/src/lib/tools.ts`)
- [ ] 8.8 An untouched application created with another stylesheet language is recognised (`cli/src/lib/init/ng-new-files.ts`)

## 9. The demo and the example

- [ ] 9.1 Commands that need arguments are not offered in the search (`demo/src/quotes/quotes-commands.ts`, `demo/src/app/looks/looks.plugin.ts`, `examples/assistant-workbench/src/tickets/src/lib/plugin/tickets.plugin.ts`)
- [ ] 9.2 An empty stock count posts nothing (`demo/src/inventory/inventory-actions.ts`)
- [ ] 9.3 Ledger account names come from the catalogue (`demo/src/finance/books.ts`)
- [ ] 9.4 The assistant's error sentences come from the catalogue, and the unused key goes (`examples/assistant-workbench/src/assistant/src/lib/agent/assistant-agent.ts`)
- [ ] 9.5 The dashboard charts carry a role and a name (`demo/src/insights/insights-chart.ts`)
- [ ] 9.6 Bank statement dates are the same day in every time zone (`demo/public/payments/matching.js`, `view.js`)
- [ ] 9.7 The assistant's prompt keeps the focus across a run (`assistant-agent-panel.html`)
- [ ] 9.8 The example compiles with `strict` and `strictTemplates` (`examples/assistant-workbench/tsconfig.json`)
- [ ] 9.9 Leads, each verified first: the demo's service worker serving the sandboxed payments plugin offline; unused exports and files in `demo/src`

## 10. Tests that could not fail

- [x] 10.1 The sandbox store test waits for the write and asserts both directions (`platform/apps/loom-testbed-e2e/src/sandbox-state.spec.ts`)
- [x] 10.2 The surface inset test fails when no docked surface is found (`surface-inset.spec.ts`)
- [x] 10.3 Clicking a tab in a pane fails when the tab is missing, and the stable-ids test asserts the address moved (`support/helpers.ts`, `stable-pane-ids.spec.ts`)
- [x] 10.4 The testbed's reply field is named in each pane of a split, and the accessibility scan covers a split (`platform/libs/weavers/testbed-weaver/src/lib/entry-tabs/testbed-entry-view.html`, `a11y.spec.ts`)
- [ ] 10.5 The end-to-end project type-checks clean, and its lint target holds that (`retained-url-pane.spec.ts`, `scrollbars.spec.ts`, the unused import in `content.spec.ts`)
- [ ] 10.6 The surface inset test polls for the inset instead of waiting a fixed time (`surface-inset.spec.ts`)

## 11. Guards and the release

- [ ] 11.1 The bundle-size guard counts every file the entry script imports statically; the sum equals the builder's initial total for all four applications, and the ceilings are recorded anew (`platform/tools/checks/check-bundle-size.mjs`)
- [ ] 11.2 A release run that failed part-way can be run again: a package already published at that version is skipped and named (`.github/workflows/release.yml`)
- [ ] 11.3 The comment guard sees a comment before a closing brace, bracket or parenthesis (`platform/tools/checks/check-comments.mjs`; six shapes reported, the tree still clean)
- [ ] 11.4 The comment guard skips only files carrying the generated banner; the six files it skipped are read and cleaned (`check-comments.mjs`)
- [ ] 11.5 The licence check matches a licence exactly and covers what a tooling bundle inlines (`platform/package.json`, `demo/package.json`)
- [ ] 11.6 The assistant's contract check fails on a parameter the page drops or widens (`platform/tools/checks/check-llms-contract.mjs`)
- [ ] 11.7 The deploy key is written directly before the deploy, and the jobs holding secrets pin their actions to commits (`.github/workflows/deploy.yml`, `sonar.yml`)
- [ ] 11.8 The release refuses a tag whose stamped versions disagree with it (`.github/workflows/release.yml`)

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
