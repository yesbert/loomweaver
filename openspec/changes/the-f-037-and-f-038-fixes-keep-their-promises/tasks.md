## 1. F-038, cut again

- [x] 1.1 Test: at `/reports`, switch to a workspace whose content loads lazily, render right after the switch; the workspace entered holds no `reports` tab (fails on main)
- [x] 1.2 Test: the same for a reset
- [x] 1.3 Test: following a link from unclaimed content into claimed content, with a render right after the settling switch, leaves the previous address out of the claiming workspace
- [x] 1.4 Move the Quick-Open list computation into `quick-open-target.ts`
- [x] 1.5 `OpenTabsService.keepAddress(path)`; the workspace service calls it when it settles an address and when it adopts a stored arrangement; the tab-sync effect acts on a kept address once the router is idle and only for the address shown (focus a holder, then sync); no tab is added from the workspace guard; `PaneTreeService` is as in 0.13.0
- [x] 1.6 Tests: a preview opened into the claiming workspace stays a preview; a plugin opening content a claiming workspace holds beside another pane does not carry the address left
- [x] 1.7 The F-038 cases in `a-gated-address-keeps-its-sub-address.spec.ts` wait for the application to settle instead of ten turns, without type casts, and stay green
- [x] 1.8 Test and fix: a link into a claiming workspace that holds the content beside another pane does not carry the address left into any pane; the replacement counter starts from its current value
- [x] 1.9 Test and fix: a navigation the shell starts itself into such a workspace opens the content once
- [x] 1.10 `active-content-path.ts` moves into the pane layer and the content-path query is shared; the tab sync skips a run in which nothing it reads changed; its branches fold into one focus step; `contentPathOf`, unused, is removed
- [x] 1.11 The kept address is consumed rather than compared; the content-path query lives in one place; the router's navigation is read through a computed flag; a kept address clears a view tab selected in the old arrangement
- [x] 1.12 Adoption at sign-in moves the person to the workspace that claims the address shown and keeps that address, written on top of the stored arrangement as `persistence-ports` allows; tests for both; the access-gating scenario says it holds with a stored arrangement
- [x] 1.13 While a navigation runs the tab sync notes a changed address, so quick successive navigations focus against the address seen last; the two blocks with the same condition are one

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
- [x] 3.11 Test and fix: an open menu keeps its words while a language chosen meanwhile is still loading, and takes the new ones when they arrive
- [x] 3.13 A re-worded menu is placed again at once and again after the next render; the check for a loaded language is shared from the i18n slice; brief and guide say when a menu is re-worded
- [x] 3.12 The i18n requirement states that a dialog or prompt keeps the words it was opened with
- [x] 3.10 Tests and fix: a bundle of another language neither re-words nor moves an open menu; a heading detail that translates to nothing draws no line
- [x] 3.9 Tests and fix: an entry named like a member of every object, and a label that is not a string, are shown as they are; a point anchor follows the edge of the control it was nearest to

## 4. Close

- [x] 4.1 Full shell and testbed suites, lint, `package`, the repository guards, `openspec validate --all --strict`
- [ ] 4.2 Run the code review again over the whole correction before the pull request
- [x] 4.3 Archive this change on the same branch, so the specifications and the guides never disagree on main
