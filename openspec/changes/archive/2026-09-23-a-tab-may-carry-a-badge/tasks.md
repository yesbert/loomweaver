## 1. Contract

- [x] 1.1 `plugin-sdk`: `TabBadge`; `badge?` on the surface declaration beside `title` and `icon`; `badge?` on `OpenTabInput`; `PluginContext.updateSurfaceBadge(surfaceId, badge | null)`, with JSDoc
- [x] 1.2 Tests that fail first: a declared badge is drawn after the title; the name reads "title, badge"; the unsaved wording wraps it; a tab with a badge is one keyboard stop; an icons-only strip carries it in the tooltip and name; a key badge follows the language

## 2. Surface badge

- [x] 2.1 Contribution registry: the badge per surface id in its own signal, set from the declaration and by `updateSurfaceBadge`, without recomputing content routes; tests that a change reaches every tab showing the surface, that the surface is not rebuilt, that `null` takes it away and an unknown id changes nothing
- [x] 2.2 Host plugin context and sandbox RPC: `updateSurfaceBadge` under the `contributions` capability, sanitised for a sandboxed plugin; tests

## 3. A content tab's own badge

- [x] 3.1 `OpenTab`, `PaneTab`, `StripTab` carry the badge; `openContentTab` sets it, re-opening refines it (`refineTabTitles`); stored only as the tab's own; `withoutBorrowedLabels` treats it like the title; tests including a restart and the tab's badge winning over the surface's

## 4. Drawing

- [x] 4.1 `PaneTabStrip`: the badge after the title in the titles look, `aria-hidden`, in its tone; tooltip and name in the icons look; the name composed as "title, badge" inside the unsaved wording
- [x] 4.2 Show it: a screenshot of the testbed with a badge on a container child tab, a content tab and a sidebar view, sent to the owner before going on

## 5. Documentation and close

- [x] 5.1 `llms-full.txt`, the weaver guides that document a surface's title and icon and `openContentTab`
- [x] 5.2 Full suites, lint, packaging, the repository guards (bundle size included), `openspec validate --all --strict`
- [x] 5.3 Code review over the change; findings taken: owner check, effect-safe writes, badge dropped with a removed view, keys not cut, `null` takes a tab's own badge away, a split and stored panes keep it, a workspace ignores it like a title, empty badges normalised, a translatable name, the icons-strip limit stated, the sandbox guide lists the call; tests for each
- [x] 5.4 Archive on the same branch
