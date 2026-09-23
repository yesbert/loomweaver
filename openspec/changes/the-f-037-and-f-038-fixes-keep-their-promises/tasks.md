## 1. F-038, cut again

- [x] 1.1 Test: at `/reports`, switch to a workspace whose content loads lazily, render once before the navigation ends; the workspace entered holds no `reports` tab (fails on main)
- [x] 1.2 Test: the same for a reset
- [x] 1.3 Test: following a link from unclaimed content into claimed content, with a render in between, leaves the previous address out of the claiming workspace
- [x] 1.4 Move the Quick-Open list computation into `quick-open-target.ts`
- [x] 1.5 Remove `PaneTreeService.replaced`; the tab-sync effect tracks `hydrated()` again; add `OpenTabsService.showAddress(path)`
- [x] 1.6 `WorkspaceService.settle` shows the settled address after it switched
- [x] 1.7 The F-038 cases in `a-gated-address-keeps-its-sub-address.spec.ts` wait for the application to settle instead of ten turns, and stay green

## 2. The language switch completes

- [x] 2.1 Test: a load that completes without a value switches and stores; nothing is stored while the load is pending
- [x] 2.2 `LocaleService`: switch on completion or error; store the choice with the switch
- [x] 2.3 JSDoc of `LocaleService`, `llms-full.txt`, `docs/distribution/recomposing-chrome.md`: when the switch takes effect

## 3. Menus

- [x] 3.1 Test: a menu opened at the right edge and re-worded with longer words is placed again within the window
- [x] 3.2 `MenuService`: keep the anchor, place again after wording, skip the `langChanges$` replay, one translate function per menu, no redundant heading check
- [x] 3.3 Test in `host-plugin-context.spec.ts`: `ctx.ui.openMenu` with a key is translated and follows a language change through the real `MenuService`
- [x] 3.4 Testbed weaver passes keys to its row menu
- [x] 3.5 `docs/weaver/menus.md`: the limit of telling a key from a literal

## 4. Close

- [x] 4.1 Full shell and testbed suites, lint, `package`, the repository guards, `openspec validate --all --strict`
- [ ] 4.2 Run the code review again over the whole correction before the pull request
