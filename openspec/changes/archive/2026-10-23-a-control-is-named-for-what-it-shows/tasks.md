## 1. Make the audit see it

- [x] 1.1 Raise `@axe-core/playwright` to 4.14 in the platform workspace and confirm the testbed audit fails on `label-content-name-mismatch` alone, on the controls listed in the design
- [x] 1.2 Give the testbed's account menu a heading that leads to a command, and an audit run with that menu open, so the audit reaches the menu heading as well

## 2. Compose the name in one place

- [x] 2.1 Unit tests, failing first: shown words come first and the purpose after them; a purpose that already contains the shown words is returned unchanged; empty shown words give the purpose
- [x] 2.2 The composing function
- [x] 2.3 Unit tests, failing first, for the shortcut announcement: `mod+k` is `Meta+K` on macOS and `Control+K` elsewhere, `del` is `Backspace` or `Delete`, from the same chord the hint is drawn from
- [x] 2.4 The derivation beside the chord formatting

## 3. Name each control

- [x] 3.1 Rail entry with initials: test, then "NR, Account"
- [x] 3.2 Declared bar button: test, then initials and label first, tooltip after, the shown shortcut at the end with `aria-keyshortcuts`
- [x] 3.3 Command palette entry and quick open entry, full and compact: test, then purpose followed by the hint, with `aria-keyshortcuts`
- [x] 3.4 View switcher: test, then the active view's name first
- [x] 3.5 Menu heading that leads to a command: test, then what it shows first and the command's title after it, following a language change
- [x] 3.6 Content tab with a badge: test that the drawn text separates title and badge, then the space between them

## 4. Document and close

- [x] 4.1 The JSDoc of a bar button's `tooltip` and `label` says the name begins with the label; `llms-full.txt` and the bar section of the weaver guides where they describe a bar button's name
- [x] 4.2 Update end-to-end helpers and tests that find a control by its old exact name, in the testbed and in the demo
- [x] 4.3 The testbed audit passes with axe-core 4.14 on every screen it visits, except an open submenu, which the design hands to a change of its own; the shell suite, lint, `npm run structure-check`, `openspec validate --all --strict`
- [x] 4.4 PR (#820); NextPA hears that F-055 is fixed, with the list of controls whose names changed, in the report of the release that carries it
