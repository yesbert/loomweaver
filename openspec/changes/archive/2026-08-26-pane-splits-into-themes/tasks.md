## 1. Split `pane-node.ts` in place

- [x] 1.1 Create `pane-address.ts` and move `PRIMARY_PANE`, `VIEW_PANE_PREFIX`, `CONTENT_DOCK`,
      `viewIdOfPanePath`, `viewForPanePath`, `promotedContentPath`.
- [x] 1.2 Create `pane-ratio.ts` and move `DEFAULT_RATIO`, `MIN_RATIO`, `MAX_RATIO`, `clampRatio`,
      `withRatio`.
- [x] 1.3 Create `pane-queries.ts` and move `findLeaf`, `findLeafWhere`, `findLeafWithTab`,
      `collectLeafIds`, `collectTabs`, `collectTabPaths`, `tabHolderOf`, `paneSegments`,
      `PaneSegment`.
- [x] 1.4 Create `pane-structure.ts` and move `splitLeaf`, `splitLeafWith`, `removeLeaf`,
      `dethroneLeaf`, `pruneEmptyLeaves`.
- [x] 1.5 Create `pane-tabs.ts` and move `insertTab`, `setActiveTab`, `setTabs`, `clearTabInstance`,
      `keepTab`, `pinTab`, `unpinTab`, `reseatPinned`, `tabWithout`, `removeTab`, `refineTabTitles`,
      `TabTitlePatch`.
- [x] 1.6 Create `pane-restore.ts` and move `normalizeNode`, `normalizeDockEntry`, `DockEntry`,
      `healedPrimary`.
- [x] 1.7 `pane-node.ts` keeps `PaneTab`, `PaneLeaf`, `PaneSplit`, `PaneNode`, `PRIMARY_LEAF`,
      `leafOf`, `newPaneId`, `activeTab`, `leafPath` and drops below 400 lines.
- [x] 1.8 Update every importer. No re-export shims: a symbol has one home and importers point at it.
- [x] 1.9 Split `pane-node.spec.ts` along the same lines, keeping any scenario that spans two
      successors whole in the file that owns its subject.

      Done at scenario level rather than at `describe` level, because the five describes did not
      line up with the seven successors: `pane-node algebra` alone covered queries, structure and
      restore. All 33 scenarios were assignable, which is the evidence the successors are real
      subjects and not an arbitrary partition. They became `pane-queries.spec.ts` (4),
      `pane-structure.spec.ts` (12), `pane-restore.spec.ts` (11) and `pane-tabs.spec.ts` (6).

      `pane-node.spec.ts` is gone rather than emptied. Nothing tested the model in isolation: every
      scenario was about querying, rewriting or restoring a tree. A spec file for a type, a
      constructor and two accessors would have been a file with nothing to say.

## 2. Split the two remaining oversized files

- [x] 2.1 `pane-tree.service.ts`, 544 lines. Identify its distinct responsibilities before cutting,
      the way section 1 did, and record them in this task before moving anything.

      Five, and they were not equal partners:

      | Responsibility | Members |
      |---|---|
      | Holding the dock trees | `docks`, `tree`, `primaryId`, `dockTrees`, `isSplit`, `hasTab`, `sourceOf`, `update`, `commit`, `evacuateRemovedPanes` |
      | Where trees are kept | the constructor, `hydrate`, `serialize`, `storageKey`, `retryHydrationOnce`, `applyHydratedTrees`, `persist`, and the module's `STORAGE_KEY`, `HYDRATION_RETRY_MS`, `parse`, `isDefault` |
      | Pane structure commands | `splitPane`, `unsplit`, `closePane`, `pointAt`, `commitTree`, `collapsePrimary`, `focusPane`, `resizeStream`, `resizeCommit`, `landingPane` |
      | Tab commands | `insertTab`, `setPrimaryTabs`, `reorderPaneTabs`, `setActiveTab`, `clearTabInstance`, `seedPrimaryTabs`, `removeTab`, `pinTab`, `unpinTab`, `keepTab` |
      | Containers | `ensureContainer`, `dropContainer`, `insertContainerChild`, `openContainerChild` |

      The last two are the ones that lift. **Where trees are kept** went to `PaneTreeStorage`, which
      knows the working-state store, the workspace-scoped key and the one hydration retry, and
      nothing about trees; the service stopped injecting `WORKING_STATE_STORE`, `ActiveWorkspaceService`
      and `DOCUMENT` altogether. **Containers** went to `PaneContainersService`, a feature built on
      the tree rather than a part of it, which is why it landed in `container/` beside the five files
      that were already there. `commit`, `landingPane`, `hasDock` and `dropDock` became public so it
      could be built on the tree rather than inside it.

      Structure commands and tab commands stayed. They are thin wrappers over `pane-structure.ts` and
      `pane-tabs.ts` and splitting them would relocate wrappers, not responsibilities. The file lands
      at 384 lines, and the two other files at 110 and 83.

      Two module-level exports left with them: `settleMovedTree`, which is the move service's tree
      fix-up and had one caller, and the two re-export blocks forwarding `CONTENT_DOCK`,
      `CONTAINER_DOCK_PREFIX`, `containerDockFor` and `isContainerDock`. Twenty-seven files reached
      those four names through a service that merely passed them on; they now name the file that
      declares them.
- [x] 2.2 `retained-view-stash.ts`, 392 lines and four exported types beside its class. The types
      move to a file named for what they model.
- [x] 2.3 Split `pane-tree.service.spec.ts` (786 lines) and `retention.spec.ts` (1034 lines) to
      follow, leaving cross-cutting scenarios whole.

      `pane-tree.service.spec.ts` followed its source: 452 lines for the tree, 217 for
      `pane-containers.service.spec.ts`, 150 for `pane-tree-storage.spec.ts`.

      **`retention.spec.ts` stays whole, which design.md allows and this is the reason.** Its ten
      nested describes do map onto the retention sources, but they sit on a 240-line shared harness:
      a probe component, a host, a stash factory and the DOM fixtures. Five successors would each
      need it, so splitting by subject would multiply 240 lines by five to save one file of 1034.
      The alternative, lifting the harness into a non-spec helper file, would add a concept to
      `retention/` that exists only for tests. Specs are not measured, and this one is a
      well-covered subject rather than a tangle.

## 3. Cut the folder

- [x] 3.1 `retention/`: `retained-component.ts`, `retained-template.ts`, `retained-view-stash.ts`,
      `retention-candidates.ts`, `retention-gc.ts`, `retention-policy.ts`, `retention-unload-guard.ts`.
- [x] 3.2 `container/`: `container-children.ts`, `container-context.ts`, `container-dock-gc.ts`,
      `container-layout.ts`, `container-pane-host.ts` and its template.
- [x] 3.3 `chrome/`: `pane-tab-strip.ts`, `pane-toolbar.ts`, `pane-minimized-strip.ts`,
      `pane-split-handle.ts`, `pane-chrome.service.ts` and their templates.
- [x] 3.4 `drag/`: `pane-drag.service.ts`, `pane-move.service.ts`, `pane-drop-zones.ts`,
      `pane-label.ts` and their templates.
- [x] 3.5 `close/`: `close-veto-dialog.ts`, `surface-close-guard.ts`, `unsaved-changes-dialog.ts`.
- [x] 3.6 `tree/`: `pane-node.ts` and its six successors, `pane-tree.service.ts`, `pane-area-tree.ts`,
      and `atomic-move.ts` unless the open question resolves it into `drag/`.

      **The open question resolved to neither option.** `atomic-move.ts` has exactly three importers
      and all three are retention files: `retained-component.ts`, `retained-template.ts` and
      `retained-view-stash.ts`. Nothing in `tree/` or `drag/` names it. It is not a tree operation at
      all — it moves DOM nodes without re-creating them, which is how a retained view survives being
      re-parented. It went to `retention/`, where every one of its callers now sits one line away.

      `tree/` therefore holds the seven `pane-node.ts` successors plus `pane-tree.service.ts`,
      `pane-tree-storage.ts` and `pane-area-tree.ts`: ten concepts.
- [x] 3.7 Leave `pane-view.ts`, `pane-surface.ts` and `pane-tree-view.ts` at the slice root, with
      their templates and specs.
- [x] 3.8 Move every `.spec.ts` and `.html` with the concept it belongs to. A spec never separates
      from its subject.

## 4. Types out of the class files

- [x] 4.1 `pane-view.ts` and `pane-tab-strip.ts` each export types beside a decorated class. Move
      them to files named for the concept, following `settings/settings-model.ts`.

      `pane-view-options.ts` takes `PaneViewOptions` and the three arrangements named after it,
      `CONTENT_PANE_OPTIONS`, `PANEL_PANE_OPTIONS` and `CONTAINER_PANE_OPTIONS`. `chrome/strip-tab.ts`
      takes `StripTab` and `TabAcceptance`. `retention/retained-view-model.ts` took the four types
      task 2.2 named. In every case the decorated class now imports its own model like any other
      caller.

## 5. Verify

- [x] 5.1 `src/index.ts` points at the new path of `retention-policy` and the packed declarations of
      all six packages are byte-identical to `main`. This is the check that proves the published
      contract survived; run it before anything else is believed.

      **Byte-identical.** Not a character differs across the 53 packed declaration files, and the 181
      exported names are the same set in the same order. Sixty-odd files moved, `pane-node.ts` became
      seven, two services were cut out of a third, and the contract did not notice. `src/index.ts`
      names `./lib/regions/pane/retention/retention-policy`.
- [x] 5.2 All seven guards pass. Trim `structure-baseline.json` by the entries this change resolves
      and confirm the checker fails if the trim is too generous.

      Three entries resolved, exactly the three the proposal named: the 31-concept folder, the
      752-line `pane-node.ts` and the 544-line `pane-tree.service.ts`. The baseline goes from four
      folders and ten files to **three folders and eight files**. Two entries nobody aimed at
      improved as a side effect of the import rewrite and the checker refused to pass until the
      baseline said so: `workspace.service.ts` 492 → 485 and `open-tabs.service.ts` 482 → 479. A
      deliberately over-generous trim, dropping the untouched `plugin-sdk` folder and
      `sandbox-plugin-runtime.ts`, failed as expected.

      One guard bit for real: the comment policy. `healedPrimary` carried a JSDoc block that was only
      ever tolerated because its old neighbours in `pane-node.ts` reached the packed declarations. In
      `tree/pane-restore.ts` none does. The paragraph is recorded in design.md and the comment is
      gone.
- [x] 5.3 Re-measure `cycle-baseline.json` and trim whatever the cut resolved. Record the new slice
      pair count in this task, so the next change starts from a fact.

      **Unchanged at 21 mutual slice pairs and zero file cycles, over 227 files rather than 211.**
      The proposal expected this number to fall and it did not, for a reason the plugin store cut had
      already turned up: `check-import-cycles.mjs` counts `regions/*` as one slice, so every file
      under `regions/pane` still belongs to `regions/pane` whichever theme it now sits in. A folder
      cut at this depth cannot move the number by construction.

      That is worth stating plainly rather than filing as a disappointment. The
      `regions/content <-> regions/pane` pair is still there, and the six themes are what makes it
      possible to see which of them it actually runs between. Any change that wants the number to
      fall has to either move code across the slice boundary or teach the checker to count a theme as
      a slice, and that is a decision with its own argument.
- [x] 5.4 The test count is unchanged or higher, and no test was weakened to make a move fit.

      1288 tests, unchanged, across 148 files rather than 141. Not an assertion was touched. Two
      fixtures had to follow their scenarios rather than be duplicated: the container describe lost
      the `localStorage` reset it inherited from an outer describe and got its own, and
      `CapturingCloseGuard` moved to the close spec that uses it.
- [x] 5.5 `npx openspec validate --all --strict` passes.
