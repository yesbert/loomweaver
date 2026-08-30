## 1. The declaration

- [ ] 1.1 Add `image?: string` to `RailItem` and to `MenuHeader`, with JSDoc stating the order
      picture, mark, icon, and that a picture which fails to load falls back on its own.

## 2. Drawing it

- [ ] 2.1 Rail: draw the picture where one is given, round, at the size the mark uses, and fall back
      to the mark and then the icon when it fails to load or is dropped.
- [ ] 2.2 Menu heading: the same, in the place the heading's mark occupies.
- [ ] 2.3 Give both their appearance in the shell stylesheet, cropped square and round without
      distorting a picture that is not square.
- [ ] 2.4 Keep the picture out of what is announced: the entry keeps its title, the menu its label.

## 3. Tests

- [ ] 3.1 `shell-rail.spec.ts`: a picture is drawn where given, the mark is not; a picture that fails
      to load gives way to the mark, and to the icon where there is no mark.
- [ ] 3.2 `menu.service.spec.ts`: the heading draws the picture, falls back when it fails, and the
      menu's label is unchanged either way.

## 4. The testbed shows it

- [ ] 4.1 Give the testbed's account entry a picture, and put a second entry beside it whose picture
      cannot load, so the fallback is visible without editing anything.

## 5. Documentation and verification

- [ ] 5.1 Document the picture in `llms-full.txt` and the weaver guide, beside the heading, including
      that another origin has to be allowed by the product itself.
- [ ] 5.2 Run lint, tests, `structure-check`, `comments-check`, `api-docs-check` and
      `openspec validate --all --strict`.
