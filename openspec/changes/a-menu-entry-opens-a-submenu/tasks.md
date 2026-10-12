## 1. The element

- [x] 1.1 `lw-menu.element.spec.ts`: an item holding a `<lw-menu>` is marked (`aria-haspopup`, `aria-expanded`, chevron), is named by its own label only, and keeps the nested menu across a re-render; the nested menu is hidden and does not take focus; see it fail first
- [x] 1.2 The same file: ArrowRight, Enter and Space open the submenu with focus on its first usable entry; ArrowLeft and Escape close it and return focus to the entry; Tab dismisses the whole menu; arrows move only within the focused menu
- [x] 1.3 The same file: a click on the entry opens the submenu and selects nothing; a click in the submenu selects once, and the select event reaches the outer menu
- [x] 1.4 The same file: resting the pointer opens after the pause, resting on a sibling closes after it, entering the submenu cancels the close (fake timers)
- [x] 1.5 The same file: the submenu is placed beside the entry, lined up with it, and on the left when the right has no room
- [x] 1.6 Implement in the element, with the submenu part in a file of its own; the chevron and the open entry's look in `lw-menu.css`

## 2. The workbench's menus

- [x] 2.1 `menu.service.spec.ts`: a contributed entry with a `submenu` whose slot offers an entry opens it as a submenu with the same context; with an empty slot and a command it runs the command; with an empty slot and no command it is not drawn; a slot leading back to one open above is not drawn
- [x] 2.2 Implement: `menuOffered` for menus, recursive resolution with the open slots carried, nested rows in `drawMenu`, path keys, choosing from the tree; wording reaches nested entries
- [x] 2.3 `plugin-facades.spec.ts` (or the facade's existing spec): an ad-hoc entry with `items` opens them as a submenu and runs the chosen one; an ad-hoc `shortcut` is drawn formatted
- [x] 2.4 Implement the facade and the `UiMenuItem` union in the SDK, with JSDoc; update `MenuItem.submenu` JSDoc
- [x] 2.5 `chord` spec: arrow keys format as arrows on both platforms; implement

## 3. Verify

- [ ] 3.1 The full shell and plugin-sdk suites, lint, structure and the contract checks
- [ ] 3.2 Testbed: a card-like ad-hoc menu with "Move" and "Resize" submenus, icons and shortcuts; an e2e test that opens a submenu by keyboard and by pointer, chooses in it, and runs the accessibility audit with the submenu open
- [ ] 3.3 Show it to the owner in the running testbed before the PR is merged

## 4. Document and close

- [ ] 4.1 `llms-full.txt` and `docs/reference/design-tokens.md`: nested `<lw-menu>`, `items` and `shortcut` on an ad-hoc entry, `submenu` in a menu
- [ ] 4.2 The guide that explains the three kinds of menu, where it names what an entry can do
- [ ] 4.3 `openspec validate --all --strict`
- [ ] 4.4 PR that says it closes NextPA finding F-049
