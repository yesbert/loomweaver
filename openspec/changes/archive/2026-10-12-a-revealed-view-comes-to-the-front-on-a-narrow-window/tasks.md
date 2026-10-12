## 1. Pin and fix

- [x] 1.1 `surface-reveal.service.spec.ts`: on a compact viewport, revealing a view in a side dock opens that dock's overlay; on a wide one it does not; a view in no tree is found after its declared region is seeded; a hidden view stays a no-op; see it fail first
- [x] 1.2 `surface-reveal.service.ts`: seed the declared region when no tree holds the view, open the overlay when compact
- [x] 1.3 Testbed e2e at 700 px in a fresh session: "Open the entry list" shows the list; and after the panel was opened and closed once

## 2. Verify and close

- [x] 2.1 The shell suite, lint, the testbed suite
- [x] 2.2 JSDoc of `revealSurface` and `llms-full.txt`; `openspec validate --all --strict`
- [x] 2.3 PR
