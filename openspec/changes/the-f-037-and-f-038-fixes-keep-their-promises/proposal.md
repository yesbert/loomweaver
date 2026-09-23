> **Status:** approved.

## Why

Reviews of the fixes for NextPA findings F-037 and F-038, merged to main in #458 and #459 and not
yet released, found that they break promises the contract already makes:

- **A workspace switch can carry the address the user left into the workspace it enters.** The F-038
  fix re-runs the address-tab synchronisation after every replacement of the whole arrangement. A
  switch or a reset replaces it before its own navigation has ended, and a render in between opens
  the previous address as a tab in the new arrangement, where it is stored. Reproduced with a lazily
  loaded landing surface: after leaving `/reports` for `knowledge-base`, that workspace holds a
  `reports` tab. 0.13.0 does not do this.
- **The language switch that loads before it switches fights the translation library.** The library
  activates its fallback language on its own whenever any load fails, including one that no longer
  matters. Six review rounds found a new way for the workbench and the library to disagree each time
  the switch was hardened.
- **A re-worded menu is not placed again**, so it can run past the edge of the window, away from its
  control, or be cut off where its old position capped its width.
- A guide and a proposal promise more than the key-or-literal rule gives for a plugin's menu labels;
  the first-party testbed weaver still translates its own menu labels; a task was ticked without its
  test.

The owner decided on 2026-09-23 to keep F-037 narrow: menus follow their strings, and the language
switch stays as released in 0.13.0. Keys may show for a moment after a language change; what matters
is that the right words show once the strings are there.

## What Changes

- **F-038, cut again.** After any replacement of the whole arrangement, the address-driven pane gives
  the address its tab once no navigation is running, focusing a pane of the new arrangement that
  already holds the content before adding one. The content shown before the replacement belongs to
  the old arrangement and is never carried into the new one. A switch or a reset navigates, so the tab
  it ends up with is the one for the address it lands on; the same-address reload after sign-in and
  the adoption of a stored arrangement end with no navigation pending and get the address's tab.
- **The language switch is the one released in 0.13.0.** The load-first switch from #459 is removed.
  The i18n requirement that promised no partially switched state is replaced by one that states what
  the workbench guarantees: one step, and words everywhere, open menus included, as soon as the
  strings arrive.
- **A re-worded menu stays on screen and beside its control.** It is placed again after the chrome is
  redrawn, moved with its control, measured at its full width, and kept within the window when its
  control is gone.
- **The key-or-literal rule for a plugin's menu labels is stated as it works**, in the menus
  capability, the guide and the SDK.
- **The testbed weaver** passes keys to its row menu.
- **Tests** for each of the above; the F-038 tests wait for the application to settle rather than a
  fixed number of turns.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: *Exactly one workspace is active, and it remembers itself* states that neither a
  switch nor a reset carries the content the user left into the arrangement it restores.
- `i18n`: *A language change is applied everywhere at once* is replaced by *A language change reaches
  everything the workbench draws*, which allows keys for the moment the strings load and requires
  words everywhere once they have.
- `menus`: *An open menu follows its strings* states that a re-worded menu is placed again, within
  the window and beside its control, and how a plugin's menu label is looked up.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts`: the tab sync waits for
  the router to be idle and handles a replacement of the arrangement; the Quick-Open list moves to
  `quick-open-target.ts`.
- `platform/libs/core/shell/src/lib/regions/pane/tree/`: `active-content-path.ts` moves here from
  `workspace/`, and `pane-queries.ts` takes the content-path query both slices share.
- `platform/libs/core/shell/src/lib/i18n/`: back to the 0.13.0 state.
- `platform/libs/core/shell/src/lib/menu/`: placement and wording move into `menu-placement.ts` and
  `menu-wording.ts`; `elements/menu/lw-menu.element.ts` measures a menu at its full width.
- `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-list-view.ts`.
- `llms-full.txt`, `docs/weaver/menus.md`, the JSDoc of `UiMenuItem`.
- Corrects the changes archived as `2026-09-23-a-gated-sub-address-survives-its-workspace` and
  `2026-09-23-a-menu-follows-its-strings`; their design notes describe the first cut, this one says
  why it was replaced. Nothing is released between them.
- NextPA finding **F-037**: NextPA's `provideStringsBeforeFirstRender()` loads the other served
  languages through the translation library in the background. A failure of such a load makes the
  library switch the page to its fallback language; that is worth knowing before the workaround is
  removed or kept.
