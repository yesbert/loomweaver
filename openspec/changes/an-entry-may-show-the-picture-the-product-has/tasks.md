## 1. The declaration

- [x] 1.1 Add `image?: string` to `RailItem` and to `MenuHeader`, with JSDoc stating the order
      picture, mark, icon, and that a picture which fails to load falls back on its own.

## 2. Drawing it

- [x] 2.1 Rail: draw the picture where one is given, round, at the size the mark uses, and fall back
      to the mark and then the icon when it fails to load or is dropped.
- [x] 2.2 Menu heading: the same, in the place the heading's mark occupies.
- [x] 2.3 Give both their appearance in the shell stylesheet, cropped square and round without
      distorting a picture that is not square.
- [x] 2.4 Keep the picture out of what is announced: the entry keeps its title, the menu its label.

## 3. Tests

- [x] 3.1 `shell-rail.spec.ts`: a picture is drawn where given, the mark is not; a picture that fails
      to load gives way to the mark, and to the icon where there is no mark.
- [x] 3.2 `menu.service.spec.ts`: the heading draws the picture, falls back when it fails, and the
      menu's label is unchanged either way.

## 4. The testbed shows it

- [x] 4.1 Give the testbed's account entry a picture, and put a second entry beside it whose picture
      cannot load, so the fallback is visible without editing anything.
- [x] 4.2 Put the same menu on a bar button in two differently docked bars, which is what turned up
      the side a bar on an edge should open towards.

## 5. Documentation and verification

- [x] 5.1 Document the picture in `llms-full.txt` and the weaver guide, beside the heading, including
      that another origin has to be allowed by the product itself.
- [x] 5.2 Run lint, tests, `structure-check`, `comments-check`, `api-docs-check` and
      `openspec validate --all --strict`.
