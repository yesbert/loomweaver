## 1. Pin the defect

- [ ] 1.1 `a11y.spec.ts`: a case with bars at both edges, a panel on each side and a split content area, running the landmark rules; see it fail on the current code
- [ ] 1.2 Unit tests in the shell: two side panels carry distinct names; the content grid carries `main`; a pane body is a tab panel labelled by its active tab, and the tab's `aria-controls` names it

## 2. Fix

- [ ] 2.1 `shell.html`: the top row as a named `<header>`, the bottom bars wrapped in a named `<footer>`
- [ ] 2.2 `shell-bar.html`: a named `role="group"` instead of `<header>`
- [ ] 2.3 `shell-edge.html` / `shell-panel.html` / the drawer: the named `<aside>` around header and panel
- [ ] 2.4 The content grid carries a named `role="main"`; the address pane's body drops `role="main"` and keeps its id and tabindex
- [ ] 2.5 `pane-view.html` and the pane tab strip: `role="tabpanel"`, `aria-labelledby` and `aria-controls`; the address pane header labels its pane's body
- [ ] 2.6 `en.json`, `de.json`: the landmark names
- [ ] 2.7 Run 1.1 and 1.2 green

## 3. Verify

- [ ] 3.1 The full shell suite
- [ ] 3.2 The testbed's accessibility, chrome and pane suites in the browser, and the skip link cases
- [ ] 3.3 Lint for the shell and the testbed's end-to-end project
- [ ] 3.4 The demo at a glance: nothing moves visually

## 4. Close

- [ ] 4.1 `docs/reference/accessibility.md`: the landmarks as the requirement states them
- [ ] 4.2 `openspec validate --all --strict`
- [ ] 4.3 Note in the PR that this closes NextPA finding F-044, and the moved `main` role in the release notes
