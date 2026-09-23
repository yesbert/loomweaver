> **Status:** approved.

## Why

A review of the fixes for NextPA findings F-037 and F-038, merged to main in #458 and #459 and not
yet released, found that they break promises the contract already makes. Two would have shipped as
defects:

- **A workspace switch can carry the address the user left into the workspace it enters.** The F-038
  fix re-runs the address-tab synchronisation after every replacement of the whole arrangement. A
  switch or a reset replaces it before its own navigation has ended, and a render in between opens
  the previous address as a tab in the new arrangement, where it is stored. Reproduced with a lazily
  loaded landing surface: after leaving `/reports` for `knowledge-base`, that workspace holds a
  `reports` tab. 0.13.0 does not do this.
- **A language switch can hang, or show keys.** The switch waits for the load to deliver strings or
  fail. When the strings cannot be loaded and the fallback language is already loaded, the
  translation library ends the load with neither, so the switch never happens, while the choice has
  already been stored and sent to the other windows. Forcing the switch on failure instead would show
  keys, because the library has already fallen back to its fallback language.

The review also found an open menu that is re-worded in place but not re-placed, so it can run past
the edge of the window or away from its control; a guide and a proposal that promise more than the
key-or-literal rule gives for a plugin's menu labels; the first-party testbed weaver still translating
its own menu labels; a task ticked without its test; and a few pieces of redundancy.

A second review of the first correction found that giving the settled address its tab from inside
the workspace guard turns a preview into a permanent tab, duplicates content a secondary pane
already holds, changes the arrangement before the navigation is committed, and misses the
replacement that adopting a signed-in person's stored arrangement makes. That approach is not taken.

## What Changes

- **F-038, cut again.** After any replacement of the whole arrangement, the address-driven pane gives
  the address its tab once no navigation is running, focusing a pane of the new arrangement that
  already holds the content before adding one. A switch or a reset navigates, so the tab it ends up
  with is the one for the address it lands on; the same-address reload after sign-in and the adoption
  of a stored arrangement both end with no navigation pending and get the address's tab.
- **The language switch completes, or changes nothing.** It happens when the strings have arrived,
  and the choice is stored in that same step. Strings that cannot be loaded, however the load ends,
  or that take more than ten seconds, change nothing; the switcher shows the language still in
  effect, so the choice can be made again. A stored or synced value naming the language already in
  effect no longer cancels a choice still loading.
- **A re-worded menu stays on screen and beside its control.** When its words change its size, it is
  placed again by the rule it opened with, measuring its control again.
- **The key-or-literal rule is stated with its limit** in the menus capability and the menus guide.
- **The testbed weaver** passes keys to its row menu.
- **Tests** for each of the above, including the ones the second review's scenarios describe, and
  the F-038 tests wait for the application to settle rather than a fixed number of turns.
- Cleanups: a menu is worded once at opening; one translate function in the menu service.

No new call, option or type. `LocaleService.setLang` keeps its signature; its documentation says when
the switch takes effect and what a failed load does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: *Exactly one workspace is active, and it remembers itself* states that neither a
  switch nor a reset carries the content the user left into the arrangement it restores, with two
  scenarios.
- `i18n`: *A language change is applied everywhere at once* states that the choice is remembered when
  the switch happens, that a language whose strings cannot be loaded is not switched to, and that a
  value naming the language in effect does not cancel a choice still loading. This replaces the rule
  written two changes ago that a failed load switches anyway.
- `menus`: *An open menu follows its strings* states that a re-worded menu stays within the window
  and beside its control, and the limit of telling a key from a literal.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts`: the tab sync waits for
  the router to be idle and handles a replacement of the arrangement; the Quick-Open list moves to
  `quick-open-target.ts`.
- `platform/libs/core/shell/src/lib/i18n/locale.service.ts`, `i18n/language-switcher.ts`.
- `platform/libs/core/shell/src/lib/menu/menu.service.ts`.
- `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-list-view.ts`.
- `llms-full.txt`, `docs/distribution/recomposing-chrome.md`, `docs/weaver/menus.md`.
- Corrects the changes archived as `2026-09-23-a-gated-sub-address-survives-its-workspace` and
  `2026-09-23-a-menu-follows-its-strings`; their design notes describe the first cut, this one says
  why it was replaced. Nothing is released between them.
