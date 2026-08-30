## 1. The declaration

- [x] 1.1 Add `MenuHeader` (`{ title, detail?, icon?, initials? }`) to the plugin SDK and
      `menuHeader?: MenuHeader` to `RailItem` and `BarButtonItem`, with JSDoc stating that it is drawn
      only where activation opens the item's own menu.

## 2. Drawing and announcing it

- [x] 2.1 Replace the trailing `trigger` parameter of `MenuService.open` with an options object
      carrying `trigger` and `header`, and move the call sites.
- [x] 2.2 Draw the heading above the first entry in `createMenu`: title, optional second line, icon or
      initials, carrying no `menuitem` role and hidden from assistive technology.
- [x] 2.3 Label the menu from the heading, so the name and its second line are announced once.
- [x] 2.4 Give the heading its appearance in the shell stylesheet, using semantic tokens and
      truncating like an entry label.

## 3. Passing it from the chrome

- [x] 3.1 Rail: pass the item's heading when its activation opens its menu.
- [x] 3.2 Bar: the same for a bar button.

## 4. Tests

- [x] 4.1 `menu.service.spec.ts`: a heading is drawn above the first entry with its second line and
      its mark, the menu is labelled from it, no heading is drawn without one, and the heading carries
      no menu-item role.
- [x] 4.2 `lw-menu.element.spec.ts`: the arrow keys pass over a heading to the first entry, and a
      click on it activates nothing.
- [x] 4.3 `shell-rail.spec.ts`: the rail's activation menu carries the item's heading.

## 5. Documentation and verification

- [x] 5.1 Document the heading in `llms-full.txt` and in the weaver guide, beside `menuTrigger`.
- [x] 5.2 Run lint, tests, `structure-check`, `comments-check`, `api-docs-check` and
      `openspec validate --all --strict`.
