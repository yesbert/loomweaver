## 1. Pin and implement

- [x] 1.1 `menu-drawing.spec.ts`: rows with a state and no icon plus rows with an icon and no state give one shared place; a row with both keeps two; states only or icons only stay as they are; a submenu decides for itself; see it fail first
- [x] 1.2 `menu-drawing.ts`: set `lw-menu--shared` in that case; `lw-menu.css`: the shared mode shows the check place on entries with a state and the icon place on the others
- [x] 1.3 Testbed e2e: in the tab menu the names of "Close", "Pinned" and "Reveal in the entry list" start at the same x, one leading place in from the menu's edge

## 2. Verify and close

- [x] 2.1 The shell suite, lint, the testbed suite, and a look at the tab menu and a list to choose from in light and dark
- [x] 2.2 `docs/weaver/menus.md` where it says how a menu reserves its leading places; `openspec validate --all --strict`
- [x] 2.3 PR
