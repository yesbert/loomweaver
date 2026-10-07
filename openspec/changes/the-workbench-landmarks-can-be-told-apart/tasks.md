## 1. Pin the defect

- [x] 1.1 `a11y.spec.ts`: a case with bars at both edges, a panel on each side and a split content area, running the landmark rules; see it fail on the current code
- [x] 1.2 Unit tests in the shell: two side panels carry distinct names; the content grid carries `main`; a pane body is a tab panel labelled by its active tab, and the tab's `aria-controls` names it

## 2. Fix

- [x] 2.1 `shell.html`: the top row as a named `<header>`, the bottom bars wrapped in a named `<footer>`
- [x] 2.2 `shell-bar.html`: a named `role="group"` instead of `<header>`
- [x] 2.3 `shell-edge.html` / `shell-panel.html` / the drawer: the named `<aside>` around header and panel, real elements so a plugin's own `<header>` stays out of the landmarks
- [x] 2.4 A named `<main>` around the content grid; the address pane's body drops `role="main"` and keeps its id and tabindex
- [x] 2.5 `pane-view.html` and the pane tab strip: `role="tabpanel"`, `aria-labelledby` and `aria-controls`; the address pane header labels its pane's body
- [x] 2.6 `en.json`, `de.json`: the landmark names
- [x] 2.7 Run 1.1 and 1.2 green

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 The testbed's accessibility, chrome and pane suites in the browser, and the skip link cases
- [x] 3.3 Lint for the shell and the testbed's end-to-end project
- [x] 3.4 Nothing moves visually: the testbed split at desktop width and the phone layout, compared pixel by pixel before and after
- [x] 3.5 The initial bundles: the landmark work adds 1.8 kB to the testbed, whose ceiling moves from 940 to 945 kB, and on top of #764 takes the shell over 960, so its ceiling moves to 965 kB

## 4. Close

- [x] 4.1 `docs/reference/accessibility.md`: the landmarks as the requirement states them
- [x] 4.2 `openspec validate --all --strict`
- [x] 4.3 Note in the PR that this closes NextPA finding F-044, and the moved `main` role in the release notes
