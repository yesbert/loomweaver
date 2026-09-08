## 1. The words

- [x] 1.1 Write the new copy, section by section with heading, first line and card texts. Target
      about nine hundred words; the owner's register, no dashes, no superlatives, no "product is a
      plugin too" in any form. Written straight into the page on 2026-09-08, because the owner
      asked for the three changes to be delivered autonomously; the review happens on the built
      page (task 4.2) rather than on a document.
- [x] 1.2 The owner reads and corrects; corrections land as follow-up edits on the same page.

## 2. The page

- [x] 2.1 The hero: eyebrow with release and licence, headline, one sentence, one button, two
      links. The audience paragraph leaves; its one surviving sentence goes to `docs/README.md`.
- [x] 2.2 The tour directly under the hero; check on a 1280 by 900 viewport that its top third is
      visible without scrolling.
- [x] 2.3 "What you get" as the sticky panel: five highlights, the five workbench screenshots
      light and dark, CSS sticking, the picture swap by intersection observer with the first
      picture as the scriptless state, the plain list below the two-column breakpoint.
- [x] 2.3a "Built for humans and agents" as four cards, "One CLI" as a list; the existing card
      styles reused, every card linking its page.
- [x] 2.4 Headings shortened, the old heading sentence as the first line under each; "Still
      Angular", the AG-UI section and the three rungs kept in shortened form; "Everything the user
      does by hand" and the two doors removed.
- [x] 2.5 `website/nav.mjs`: Docs, Get started, Demo.

## 3. The README

- [x] 3.1 The second door's "same door" sentence replaced by the architecture fact; nothing else
      in the README changes.

## 4. Verify

- [x] 4.1 Word count of the page's visible text under a thousand (998 on 2026-09-08); `npm run check` in `website/`
      green (lint, contrast, build, head).
- [x] 4.2 Screenshots of the fold and the full page in light and dark, shown to the owner.
- [x] 4.3 `openspec validate the-landing-page-shows-before-it-argues --strict` passes.
