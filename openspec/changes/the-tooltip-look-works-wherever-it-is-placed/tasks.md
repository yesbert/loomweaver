## 1. The look apart from its placement

- [x] 1.1 Test first, e2e in the testbed: an element carrying `.lw-tooltip-bubble` injected into a
  page has the look of `<lw-tooltip>`'s own bubble (background, text, radius, padding, type, shadow), stays in the normal flow (not fixed), and
  receives the pointer.
- [x] 1.2 Split `.lw-tooltip-bubble` in `theme.css`: the look on the class, with `max-width: 16rem`;
  the placement on `.lw-tooltip-bubble[popover]`.
- [x] 1.3 Keep the existing tooltip unit and e2e tests green unchanged; they pin the element's own
  bubble.

## 2. A badge inside it

- [x] 2.1 Test first, e2e: a neutral and a toned `.lw-badge` inside an injected bubble pass the
  audit's contrast rule in the light and in the dark appearance. The contrast already passed before
  (the light chip is readable on its own), so the red test is the one that pins the neutral badge to
  the bubble's text colour and the toned badge to its own fill.
- [x] 2.2 Add the contextual rule for the neutral badge inside the bubble.
- [x] 2.3 Check that the frame kit's precompiled styles carry both rules.

## 3. Hand-over

- [x] 3.1 Say it in `docs/reference/design-tokens.md` (tooltip and badge entries), in `llms-full.txt`,
  and in the doc comment of `<lw-tooltip>`.
- [x] 3.2 Run `openspec validate --all --strict`, the shell unit suite, the full testbed e2e suite,
  lint and the repository's guards; reconcile this change's artifacts.
  Testbed e2e: 358 of 358. The rule that hides tooltips while a menu is open now targets only the
  element's own bubble, since a product's bubble is shown by its host.
