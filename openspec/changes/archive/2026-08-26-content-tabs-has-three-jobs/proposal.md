> **Status:** approved.

## Why

`regions/content/tabs/content-tabs.service.ts` is the longest source file in the platform at **942
lines**. It holds one class with **39 methods, roughly 20 fields and 11 injected dependencies**.

Eleven dependencies in one constructor is the measurement that settles it. The class reaches into
the router, the contribution registry, the auth context, the reuse strategy, shell features, the
pane tree, the retained view stash, the surface close guard, Angular's outlet contexts, the tab
address resolver and the document. Nothing needs all eleven; three different jobs each need three or
four.

Those three jobs are visible in the member list without interpretation:

| Job | Members |
|---|---|
| Projecting the read side | `openTabs`, `tabs`, `quickOpenTargets`, `activePath`, `activeViewPath`, `activeViewInstance`, `activeTabRoot`, `activeContent`, `showStrip`, and the private helpers behind them |
| Opening, navigating, making permanent | `activateViewTab`, `reorder`, `bringToFront`, `navigate`, `navigateTo`, `revealContentTab`, `open`, `keep`, `pin`, `unpin` |
| Orchestrating a close | `close`, `closeAll`, `closeOthers`, `closeToRight`, `closePrimaryPane`, `runCloseHook`, `neighbourOf`, and eight private helpers from `closeNow` to `neighbourPath` |

The close orchestration alone is fifteen members and roughly a third of the file. It is the only
part that talks to the close guard and the only part that has to decide where focus goes afterwards,
and it is welded to code that merely computes a signal.

## What Changes

- The read-side projection and the close orchestration each move into their own unit.
- `ContentTabsService` keeps its published shape and delegates, the way `SettingsService` and the
  plugin store title already do after the earlier changes in this audit.
- The 1040-line spec follows the split.
- `QuickOpenTarget` moves out of the service file into a file named for what it models.
- The structure baseline loses its largest file entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Every published member keeps its name, its signature and its behaviour; only the code behind
it moves. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**`ContentTabsService` is published.** It appears in the packed `loom-shell.d.ts`, so its public
shape is a contract with consumers and not an internal detail. This is the one change in the audit
series where a split touches the published surface, which is why it is separated from the folder
cuts: the acceptance criterion is byte-identical packed declarations, and that deserves its own
review.

**The delegation pattern is not new here.** The same move was made twice already in this audit, when
`SettingsService` gave up its state to `settings-registry.ts` and the plugin store dialog gave up
its title to `plugin-store-title.ts`. Both kept their published shape and both came out
byte-identical. This is the third application of a pattern that has held.

**Expected effect on the baselines.** The file baseline loses its 942-line entry. Whether all three
successors land under 400 lines is measured rather than promised; if one does not, it stays in the
baseline with an honest number instead of being forced under by a bad cut.

Depends on `structure-has-a-ratchet`. Independent of `pane-splits-into-themes` and
`plugin-store-splits-into-themes`, and may be implemented before or after either.
