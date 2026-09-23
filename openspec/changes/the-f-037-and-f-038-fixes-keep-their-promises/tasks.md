## 1. F-038, cut again

- [x] 1.1 Test: at `/reports`, switch to a workspace whose content loads lazily, render right after the switch; the workspace entered holds no `reports` tab (fails on main)
- [x] 1.2 Test: the same for a reset
- [x] 1.3 Test: following a link from unclaimed content into claimed content, with a render right after the settling switch, leaves the previous address out of the claiming workspace
- [x] 1.4 Move the Quick-Open list computation into `quick-open-target.ts`
- [x] 1.5 The tab-sync effect waits for the router to be idle and handles a replacement of the arrangement (focus a holder, then sync); no tab is added from the workspace guard
- [x] 1.6 Tests: a preview opened into the claiming workspace stays a preview; a replacement without a navigation gives the address its tab
- [x] 1.7 The F-038 cases in `a-gated-address-keeps-its-sub-address.spec.ts` wait for the application to settle instead of ten turns, without type casts, and stay green
- [x] 1.8 Test and fix: a link into a claiming workspace that holds the content beside another pane does not carry the address left into any pane; the replacement counter starts from its current value
- [x] 1.9 Test and fix: a navigation the shell starts itself into such a workspace opens the content once
- [x] 1.10 `active-content-path.ts` moves into the pane layer and the content-path query is shared; the tab sync skips a run in which nothing it reads changed; its branches fold into one focus step; `contentPathOf`, unused, is removed

## 2. The language switch as released

- [x] 2.1 `platform/libs/core/shell/src/lib/i18n/` back to the 0.13.0 state, with its tests
- [x] 2.2 `llms-full.txt` and `docs/distribution/recomposing-chrome.md` back to the 0.13.0 text on `setLang`
- [x] 2.3 The i18n requirement replaced by *A language change reaches everything the workbench draws*

## 3. Menus

- [x] 3.1 Tests: a menu at the right edge re-worded with longer words is placed again within the window; a menu opened from a control is placed beside the control where it now is
- [x] 3.2 `MenuService`: keep the anchor and the control, place again after the next render on every re-wording, shifted with the control for a point or a rect anchor, left where it last stood (and kept within the window) for a control that is gone or hidden; skip the `langChanges$` replay; one translate function
- [x] 3.3 Test in `host-plugin-context.spec.ts`: `ctx.ui.openMenu` with a key is translated and follows a language change through the real `MenuService`
- [x] 3.4 Testbed weaver passes keys to its row menu
- [x] 3.5 `docs/weaver/menus.md`, the SDK JSDoc and the menus requirement say how a plugin's menu label is looked up
- [x] 3.6 Tests: a point-anchored menu moves with its control; a menu whose words did not change still moves with it; a rect anchor follows a control that grew; a removed or hidden control leaves the menu where it last stood
- [x] 3.7 Test and fix: `LwMenuElement` measures its full width when placed again, so grown words are not cut off at the edge
- [x] 3.8 Placement and wording move into `menu-placement.ts` and `menu-wording.ts`

## 4. Close

- [x] 4.1 Full shell and testbed suites, lint, `package`, the repository guards, `openspec validate --all --strict`
- [ ] 4.2 Run the code review again over the whole correction before the pull request
- [ ] 4.3 Archive this change on the same branch, so the specifications and the guides never disagree on main
