> **Status:** approved.

## Why

`platform/libs/core/shell/src/lib/regions/pane` is the largest flat folder in the platform: **31
concepts, 56 files**. A reader opening it has no way to tell which of the 31 belong together, and
the alphabet actively misleads, sorting `pane-label.ts` between `pane-drop-zones.ts` and
`pane-minimized-strip.ts` when it belongs with the first and not the second.

Inside it sits `pane-node.ts`, **752 lines exporting 50 symbols** that split cleanly into seven
unrelated themes: addressing, geometry, the model itself, reading the tree, changing its structure,
changing its tabs, and restoring it from storage. Seven reasons to change one file.

`pane-tree.service.ts` at 544 lines and `retained-view-stash.ts` at 392 sit on top of it. Together
these are the largest single obstacle to reading the shell, and `regions/pane` is one half of the
heaviest slice pair in the tangle baseline, 53 crossing imports against `regions/content`.

## What Changes

- `regions/pane` is cut into sub-themes named for what they do. Nothing is named for a technical
  kind; the two worked examples already in the tree, `regions/content` and `elements/`, set the
  pattern.
- `pane-node.ts` splits along the seven themes its exports already form.
- `pane-tree.service.ts` and `retained-view-stash.ts` follow the same cut.
- Types and constants that today sit beside a decorated class move into files named for the concept
  they model, the way `settings/settings-model.ts` already does.
- The spec files follow the source split. `retention.spec.ts` at 1034 lines and `pane-node.spec.ts`
  at 576 become several.
- The structure baseline loses its largest folder entry and two of its file entries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This moves symbols between files and files between folders. It changes no requirement, no
observable behaviour and no published name. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**The proposed cut, 31 concepts into six themes and a remainder:**

| Theme | Concepts | Members |
|---|---|---|
| `tree/` | 4 → 10 | `pane-node.ts` and its seven successors, `pane-tree.service.ts`, `pane-area-tree.ts`, `atomic-move.ts` |
| `retention/` | 7 | `retained-component.ts`, `retained-template.ts`, `retained-view-stash.ts`, `retention-candidates.ts`, `retention-gc.ts`, `retention-policy.ts`, `retention-unload-guard.ts` |
| `container/` | 5 | `container-children.ts`, `container-context.ts`, `container-dock-gc.ts`, `container-layout.ts`, `container-pane-host.ts` |
| `chrome/` | 5 | `pane-tab-strip.ts`, `pane-toolbar.ts`, `pane-minimized-strip.ts`, `pane-split-handle.ts`, `pane-chrome.service.ts` |
| `drag/` | 4 | `pane-drag.service.ts`, `pane-move.service.ts`, `pane-drop-zones.ts`, `pane-label.ts` |
| `close/` | 3 | `close-veto-dialog.ts`, `surface-close-guard.ts`, `unsaved-changes-dialog.ts` |
| remainder | 3 | `pane-view.ts`, `pane-surface.ts`, `pane-tree-view.ts` |

**The seven themes inside `pane-node.ts`:**

| Successor | Symbols |
|---|---|
| `pane-address.ts` | `PRIMARY_PANE`, `VIEW_PANE_PREFIX`, `CONTENT_DOCK`, `viewIdOfPanePath`, `viewForPanePath`, `promotedContentPath` |
| `pane-ratio.ts` | `DEFAULT_RATIO`, `MIN_RATIO`, `MAX_RATIO`, `clampRatio`, `withRatio` |
| `pane-node.ts` | `PaneTab`, `PaneLeaf`, `PaneSplit`, `PaneNode`, `PRIMARY_LEAF`, `leafOf`, `newPaneId`, `activeTab`, `leafPath` |
| `pane-queries.ts` | `findLeaf`, `findLeafWhere`, `findLeafWithTab`, `collectLeafIds`, `collectTabs`, `collectTabPaths`, `tabHolderOf`, `paneSegments`, `PaneSegment` |
| `pane-structure.ts` | `splitLeaf`, `splitLeafWith`, `removeLeaf`, `dethroneLeaf`, `pruneEmptyLeaves` |
| `pane-tabs.ts` | `insertTab`, `setActiveTab`, `setTabs`, `clearTabInstance`, `keepTab`, `pinTab`, `unpinTab`, `reseatPinned`, `tabWithout`, `removeTab`, `refineTabTitles`, `TabTitlePatch` |
| `pane-restore.ts` | `normalizeNode`, `normalizeDockEntry`, `DockEntry`, `healedPrimary` |

**One published symbol moves house.** `src/index.ts` re-exports `RetentionDefault` from
`regions/pane/retention-policy`. The path changes, the published name and its shape do not, and the
packed declarations must come out byte-identical.

**Expected effect on the two existing baselines.** The folder baseline loses its 31-concept entry
and gains none, since every proposed theme lands at 10 or fewer. The file baseline loses `pane-node.ts`
and `pane-tree.service.ts`. The cycle baseline is expected to fall, because the pair
`regions/pane` against `regions/content` should turn out to be a pair between two sub-themes rather
than between two whole slices; the number is measured after the fact rather than promised here.

Depends on `structure-has-a-ratchet`, which fixes the thresholds this change is measured against.
