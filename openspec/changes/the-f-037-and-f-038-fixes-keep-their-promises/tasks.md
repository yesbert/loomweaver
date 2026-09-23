## 1. F-038, cut again

- [x] 1.1 Test: at `/reports`, switch to a workspace whose content loads lazily, render right after the switch; the workspace entered holds no `reports` tab (fails on main)
- [x] 1.2 Test: the same for a reset
- [x] 1.3 Test: following a link from unclaimed content into claimed content, with a render right after the settling switch, leaves the previous address out of the claiming workspace
- [x] 1.4 Move the Quick-Open list computation into `quick-open-target.ts`
- [x] 1.5 The tab-sync effect waits for the router to be idle and handles a replacement of the arrangement (focus a holder, then sync); no tab is added from the workspace guard
- [x] 1.6 Tests: a preview opened into the claiming workspace stays a preview; a replacement without a navigation gives the address its tab (both fail on the first correction, the second on 0.13.0)
- [x] 1.8 Test and fix: a link into a claiming workspace that holds the content beside another pane does not carry the address left into any pane; the replacement counter starts from its current value; the content-path query is shared from the pane layer
- [x] 1.10 The tab sync skips a run in which neither the address, its route and tab root, nor the arrangement changed, as before these fixes; its branches are folded into one focus step; `contentPathOf`, unused, is removed
- [x] 1.9 Test and fix: a navigation the shell starts itself into a claiming workspace that holds the content beside another pane opens it once; `active-content-path.ts` moves into the pane layer
- [x] 1.7 The F-038 cases in `a-gated-address-keeps-its-sub-address.spec.ts` wait for the application to settle instead of ten turns, without type casts, and stay green

## 2. The language switch completes, or changes nothing

- [x] 2.1 Tests: a delivered value switches and stores in one step; an error, an empty end and ten seconds without a value change nothing and store nothing; the latest of two choices wins; a stored value naming the language in effect does not cancel a choice still loading; with the translation library itself, a failed language leaves both the service and the library in the language in effect
- [x] 2.2 `LocaleService`: follows the library's active language; a choice switches and stores only when the library holds that language's strings; bounded at ten seconds; a stored value read after a choice is ignored
- [x] 2.6 The service only follows the library's active language, also one a product activates directly or one outside the served set; tests for that, for a distribution without English, for another window's choice replacing one still loading, and for a stored value applying after a failed choice
- [x] 2.7 Tests and fix: a held-back value does not outlive a choice that loaded; a failed choice does not reopen the way for a stored value after an earlier choice loaded; a synchronous failure leaves the held-back load cancellable
- [x] 2.5 Tests: a delivered bundle that is not the chosen language's does not switch; the service names a fallback the library chose itself; with the library itself, both when the fallback was loaded and when the library loads it in place of the failed language
- [x] 2.3 The shipped switcher shows the language in effect after a choice, with a test
- [x] 2.4 JSDoc of `LocaleService`, `llms-full.txt`, `docs/distribution/recomposing-chrome.md`: when the switch takes effect and what a failed load does

## 3. Menus

- [x] 3.1 Tests: a menu at the right edge re-worded with longer words is placed again within the window; a menu opened from a control is placed beside the control where it now is
- [x] 3.2 `MenuService`: keep the anchor and the control, place again after the next render when the text changed, shifted with the control for a point or a rect anchor, not for a control no longer on the page; skip the `langChanges$` replay; one translate function; no redundant heading check
- [x] 3.8 Test and fix: a menu whose control is gone is placed again where it last stood, so grown words keep it within the window
- [x] 3.7 Tests and fix: a menu is placed again after every re-wording, also when its words did not change; a rect anchor follows the control's edges; a hidden control or one removed after the menu moved leaves it where it last stood
- [x] 3.6 Tests: a point-anchored menu moves with its control; a removed control leaves the menu where it was
- [x] 3.3 Test in `host-plugin-context.spec.ts`: `ctx.ui.openMenu` with a key is translated and follows a language change through the real `MenuService`
- [x] 3.4 Testbed weaver passes keys to its row menu
- [x] 3.5 `docs/weaver/menus.md`: the limit of telling a key from a literal

## 4. Close

- [x] 4.1 Full shell and testbed suites, lint, `package`, the repository guards, `openspec validate --all --strict`
- [ ] 4.2 Run the code review again over the whole correction before the pull request
