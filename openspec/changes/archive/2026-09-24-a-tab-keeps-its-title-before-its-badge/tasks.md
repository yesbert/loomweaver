## 1. Tests first

- [x] 1.1 Unit test in the tab strip's badge spec: the tooltip of a tab with a badge in a strip of titles reads "title, badge", and with the preview hint after it for a preview
- [x] 1.2 Testbed end-to-end test: a tab with a badge at its minimum width shows more of its title than of its badge, and the badge keeps a visible mark

## 2. The strip

- [x] 2.1 The badge takes only the room the title leaves: no starting width, growing up to its natural width, its text in an element that cuts with an ellipsis
- [x] 2.2 The tooltip of a tab in a strip of titles uses the named string

## 3. Close

- [x] 3.1 `docs/weaver/content-area.md` and `llms-full.txt` say that the title comes first in a narrow tab and that the tooltip carries the badge
- [x] 3.2 Shell lint and tests, the repository guards (bundle size included), `openspec validate --all --strict`
- [x] 3.3 Screenshot of the demo's quote tabs at their minimum width, shown to the owner
- [x] 3.4 Code review, then archive on the same branch
