Every task is one pull request: first the test that fails on the current code (its failure message goes
into the pull request), then the fix. Paths are relative to `platform/libs/core/shell/src/lib/` unless
they start with a top-level folder.

## 1. Menus, commands and plugins

- [x] 1.1 A list menu marks its entry in effect and keeps every icon: the list builder reserves the
  check column like the command menu does and no longer drops the icon of an active or checked entry
  (`menu/menu.service.ts`); tested through the tab-strip overflow list and the view-instance switcher.
- [x] 1.2 A capability refusal thrown by a menu entry's own implementation reaches the error handler,
  and so the user, instead of the console (`menu/menu.service.ts`).
- [x] 1.3 `retitleSurface` and `updateSurfaceAction` act only on a surface the calling plugin
  registered, for an in-process and a frame plugin, with a red test per method modelled on the badge
  test "leaves another plugin's surface alone" (`plugin/host-plugin-context.ts`).
- [x] 1.4 A deployed frame plugin's settings section is filed where the installed list looks for it,
  or the list finds a section by its owner (`plugin/sandbox/sandbox-rpc-methods.ts`,
  `plugin-store/installed-plugin-list.ts`); tested with a deployed entry, not only an installed one.
- [x] 1.5 A plugin that fails to activate releases its grant, and the permissions surface stops listing
  it (`plugin/plugin-runtime.ts`).
- [x] 1.6 A declaration of a required plugin that names nothing composed is reported in development for
  frame-only and catalogue-only compositions too (`plugin/plugin-runtime.ts`,
  `foundation/required-plugins.ts`); the JSDoc of `provideRequiredPlugins` states it.
- [x] 1.7 A launcher entry that only opens a menu has a row in "Customize rail", so it can be hidden,
  moved and brought back (`regions/curation/curation-dialog.ts`).
- [x] 1.8 Close, pin and close-to-the-right chosen for open work in the search act in the pane that
  holds it: the search's menu context names the holding pane, and closing deletes a close hook only
  when something closed (`commands/command-palette.ts`, `regions/content/tabs/tab-closing.service.ts`).

## 2. Workspaces, persistence and language

- [x] 2.1 The pane arrangement reads the saved-workspace list through the settings port, also with a
  working-state store that answers later (`regions/pane/tree/pane-tree-storage.ts`); tested with two
  different ports.
- [x] 2.2 The language is seeded from the settings port's immediate answer, applied when it arrives
  later, and the language service starts with the shell so a distribution without a switcher gets it
  (`i18n/served-languages.ts`, `i18n/locale.service.ts`); tested with a store that has an immediate
  answer and with one that has none, and without a language switcher.
- [x] 2.3 Overlapping claims of different shape and equal narrowness are reported with both workspaces
  named (`workspace/workspace-claims.ts`); the published JSDoc of `claims` says "overlapping claims of
  equal narrowness" instead of "the same shape".

## 3. Panels, panes and content

- [x] 3.1 Moving a view to the other sidebar with Alt+Shift+Arrow is announced, as the context menu
  already does (`regions/panel/shell-sidebar-header.ts`).
- [x] 3.2 A splitter removed during a drag ends the drag and keeps the width reached
  (`regions/panel/panel-splitter.ts`).
- [x] 3.3 Closing the pane that fills the area, from its control, from code or by closing its last tab,
  ends the blow-up, and `PaneService.maximized()` reads nothing (`regions/pane/chrome/pane-chrome.service.ts`
  or the close path in `regions/pane/pane-actions.service.ts`).
- [x] 3.4 Strip drop ids survive a container address with a colon, for strip, edge and fill drops
  (`regions/pane/drag/pane-move.service.ts`).
- [x] 3.5 A pane body keeps surface injectors only for addresses retention still holds; a test bounds
  the cache over many addresses (`regions/content/routing/surface-injector.ts`).

## 4. The frame kit

- [x] 4.1 The frame declaration build removes an `export {};` line instead of leaving `{};` behind; a
  test feeds such a line and type-checks the result (`platform/libs/core/frame-kit/build.mjs`).

## 5. Tooling

- [x] 5.1 The generated weaver notes name only regions the generated output uses, with their kind, and
  ask for the version ranges the generator records; the devkit README says `status-bar`
  (`platform/libs/tooling/devkit/src/recipes/angular-weaver/weaver-readme.ts`, `devkit/README.md`); a
  spec compares the notes with the region table.
- [x] 5.2 `--unitTestRunner none` no longer skips the app wiring; without an app the generator names
  what it skipped, as the default path does (`devkit/src/generators/weaver/generator.ts`).
- [x] 5.3 The Nx distribution with `--force` merges the occupant's build target value by value and
  keeps its other fields (`devkit/src/generators/distribution/generator.ts`); tested with real options
  and configurations.
- [x] 5.4 The Nx route names a code-written style configuration it leaves untouched, and an auth-source
  composition root it cannot recognise (`devkit/src/generators/shared.ts`,
  `devkit/src/generators/auth-source/generator.ts`).
- [x] 5.5 The CLI: the workspace above a nested package is found, an object-form entry stylesheet and
  an `@source` line are recognised, and a project-resolution error is printed once
  (`platform/libs/tooling/cli/src/lib/workspace.ts`, `cli/src/lib/amend.ts`).
- [x] 5.6 The Tailwind source path is escaped before it becomes a pattern
  (`devkit/src/generators/shared.ts`); tested with an unbalanced parenthesis in the directory.

## 6. The testbed

- [x] 6.1 Typing in the RPC sandbox keeps focus: values update in place instead of rebuilding the page
  every second and on every state echo (`platform/apps/loom-testbed/public/sandbox-rpc/view.js`); an
  end-to-end test types slowly into both fields.
- [x] 6.2 The minimal store plugin registers its own page and path
  (`platform/apps/loom-testbed/public/store-minimal/plugin.js`); an end-to-end test installs it and
  sees its heading.
- [x] 6.3 The static sandbox page loads the frame kit's stylesheet so its buttons are styled
  (`platform/apps/loom-testbed/public/sandbox-static/view.html`).

## 7. The demo

- [x] 7.1 The closing periods are computed in the local calendar, and the day helper returns today's
  date after local midnight (`demo/src/accounting/finance.ts`, `demo/src/accounting/clock.ts`); the test
  runs under `TZ=Europe/Berlin` and checks the month.
- [x] 7.2 Quote commands accept quotes created after startup: their choices are read when invoked, not
  fixed at activation (`demo/src/quotes/src/lib/plugin/quotes-commands.ts`).
- [x] 7.3 The dashboard's colour observer disconnects when the view is destroyed
  (`demo/src/insights/chart-tokens.ts`).
- [x] 7.4 After the release that carries 9.8, because the demo builds against the published packages:
  the welcome is shown once the store has answered, also when it answers later
  (`demo/src/about/about.plugin.ts`).
- [x] 7.5 After a check in a browser that blocks storage: the quotes settings read and write storage
  guarded like the looks and the session do (`demo/src/quotes/src/lib/plugin/quotes-settings.ts`).

## 8. The example and the website

- [x] 8.1 A ticket link with a lower-case number opens its ticket: the view uses the store's lookup
  (`examples/assistant-workbench/src/tickets/src/lib/views/ticket-view.ts`).
- [x] 8.2 The landing page's pictures are copied because the landing page uses them, not because a doc
  embeds them (`website/tools/sync-docs.mjs`); the build fails when a landing picture is missing.
- [x] 8.3 The sidebar coverage guard matches whole routes, not substrings (`website/tools/sync-docs.mjs`).

## 9. After the owner's decisions (2026-09-25)

- [x] 9.1 The agent adapter answers the calls a run leaves open one per `flush` and refuses each
  instead of running it; the documented usage, the generated agent panel and the example ask until
  nothing is answered (`platform/libs/integrations/ag-ui/src/lib/command-tools.ts`, the devkit's
  agent recipe, `examples/assistant-workbench`).
  A call carried by chunks is closed by a run that finishes, as the protocol defines, and runs; the
  delta states that exception.
- [x] 9.2 Only a command invoked from within another command's run, before that run first waits,
  counts towards the depth limit (`commands/command-invocation.service.ts`).
- [x] 9.3 A plugin state value with no data form is refused with a message naming the plugin and the
  key (`plugin/plugin-state.service.ts`).
- [x] 9.4 Browsing a deployed plugin shows it as provided and offers no install; the install service
  refuses a deployed id (`plugin-store/`).
- [x] 9.5 On a narrow screen the store's detail replaces the list and offers a way back, shown to the
  owner as a slice before it is finished (`plugin-store/plugin-store-dialog.html`).
- [x] 9.6 The demo: cancelling the second "New customer" prompt cancels the creation
  (`demo/src/customers/`); an accepted quote can no longer be sent (`demo/src/quotes/`).
- [x] 9.7 Update this change with the deltas the decisions require (`/opsx:update`).
- [x] 9.8 The in-process state handle tells an observer when a value arrives and whenever it changes
  (`onChange`, additive), also after the plugin was switched off and on again
  (`plugin/plugin-state.service.ts`, the SDK's state handle).
- [x] 9.9 The frame kit keeps a state write made before its connection and sends it once connected
  (`surface-kit/surface-state-mirror.ts`).
- [x] 9.10 The choices of a command registered by a plugin in the page are read when it is described
  or checked; a test pins it, and the SDK's JSDoc no longer calls them fixed.
- [x] 9.11 A select option draws an icon the registry knows, like every other element, and keeps
  showing anything else as written (`elements/select/`).
  The reference promised literal glyphs for `icon` and named the registry as the next step, and the
  language switcher passes flag emoji, so printing the value was right for those. A registered name
  is now drawn, and a flag still shows.

## 10. Hand-over

- [x] 10.1 Name every platform fix under "Fixed" in the notes of the release that carries it.
- [ ] 10.2 Run `openspec validate --all --strict`, the unit suites, the testbed and demo end-to-end
  suites and the guards; archive the change.
