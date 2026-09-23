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
- **A language switch can hang.** The switch waits for the load to deliver strings or fail. When the
  strings cannot be loaded and the fallback language is already loaded, the translation library ends
  the load with neither, so the switch never happens, while the choice has already been stored and
  sent to the other windows.

The review also found an open menu that is re-worded in place but not re-placed, so it can run past
the edge of the window; a guide and a proposal that promise more than the key-or-literal rule gives
for a plugin's menu labels; the first-party testbed weaver still translating its own menu labels; a
task ticked without its test; and a few pieces of redundancy.

## What Changes

- **F-038, cut again.** The general re-synchronisation on every replacement is removed. When the
  workbench moves the user into the workspace that claims an address and keeps that address, it
  gives exactly that address its tab in the arrangement it entered. A switch or a reset no longer
  touches the tabs outside its own navigation, as in 0.13.0.
- **The language switch completes.** It happens when the load has ended, whether with strings,
  with an error, or with nothing. The choice is stored when the switch happens, not before, so
  storage and the other windows never run ahead of the page.
- **A re-worded menu stays on screen.** After the words change, the menu is placed again by the same
  rule it was opened with.
- **The key-or-literal rule is stated with its limit** in the menus capability and the menus guide:
  a literal shaped like a key, such as a file name with a dot, is looked up, and is shown as it is
  when no bundle knows it.
- **The testbed weaver** passes keys to its row menu, so it follows the strings like the guide says.
- **Tests** for a plugin's menu labelled by a key through the real menu path, for the empty-ended
  load, for the re-placement, and for the workspace switch and the claimed link with a render in
  between. The F-038 tests wait for the application to settle rather than a fixed number of turns.
- Cleanups: a menu is worded once at opening, not twice; one translate function per menu.

No new call, option or type. `LocaleService` stays as it is on the surface; its documentation says
when the switch takes effect.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: *Exactly one workspace is active, and it remembers itself* states that neither a
  switch nor a reset carries the content the user left into the arrangement it restores, with two
  scenarios.
- `i18n`: *A language change is applied everywhere at once* states that a load that ends without
  strings switches as well, and that the choice is remembered when the switch happens.
- `menus`: *An open menu follows its strings* states that a re-worded menu stays within the window,
  and the limit of telling a key from a literal.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-tree.service.ts`: the replacement counter
  added in #458 is removed.
- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts`: the tab sync reads
  the first restore again, and a method gives a settled address its tab; the Quick-Open list moves
  to `quick-open-target.ts`.
- `platform/libs/core/shell/src/lib/workspace/workspace.service.ts`: settling an address shows it in
  the workspace it entered.
- `platform/libs/core/shell/src/lib/i18n/locale.service.ts`, `menu/menu.service.ts`,
  `elements/menu/lw-menu.element.ts` (if the re-placement needs it), `menu/menu-heading.ts`.
- `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-list-view.ts`.
- `llms-full.txt`, `docs/distribution/recomposing-chrome.md`, `docs/weaver/menus.md`.
- Corrects the changes archived as `2026-09-23-a-gated-sub-address-survives-its-workspace` and
  `2026-09-23-a-menu-follows-its-strings`; their design notes describe the first cut, this one says
  why it was replaced. Nothing is released between them.
