## 1. Pin it

- [x] 1.1 Unit tests, failing first: an entry with a submenu takes no role and its row is the menu item, announced as opening a menu, named by its label alone; its submenu is beside the row, not inside it; focus and `aria-expanded` follow the row through opening and closing by keyboard and pointer
- [x] 1.2 Adjust the existing submenu unit tests that read the role, focus or `aria-expanded` off the entry element

## 2. Build it

- [x] 2.1 The entry element draws the row when it holds a submenu, and goes back to being the menu item when it no longer does
- [x] 2.2 The menu takes an entry's row as the entry, and finds a submenu from the row
- [x] 2.3 The stylesheet: an entry with no role lays out as its row, and the row looks and behaves as an entry

## 3. Measure and close

- [x] 3.1 The testbed's submenu specs and the accessibility audit pass with axe-core 4.14, the frame kit's build and the generated frame scripts too
- [x] 3.2 The shell suite, lint, `openspec validate --all --strict`
- [ ] 3.3 PR
