## 1. Pin the new behaviour

- [x] 1.1 `lw-select.element.spec.ts`: the trigger has the combobox role, its name is the label alone and its text is the choice, in the text form, the compact symbol form and with the placeholder; see it fail on the current code
- [x] 1.2 The same file: a host `aria-labelledby` and a host `aria-label` name the trigger without the choice
- [x] 1.3 The same file: `required` as attribute and as property, including one set before the element upgraded, puts `aria-required="true"` on the trigger and removing it takes it away; the host carries no `aria-required`
- [x] 1.4 The same file: while open, focus stays on the trigger and `aria-activedescendant` names the active option; arrow keys, Home and End move and skip disabled options; Enter, Space and Alt+ArrowUp choose and close; Escape and Tab close without choosing
- [x] 1.5 The same file: on the closed trigger, Home, End, Alt+ArrowDown and a typed letter open the list at the expected option; one press opens and does not also activate the button
- [x] 1.6 The same file: a pointer press on an option keeps focus on the trigger and chooses the option

## 2. Implement

- [x] 2.1 `lw-select-parts.ts`: the trigger gets `role="combobox"`; option rows lose their tabindex; the listbox keeps a pointer press from taking focus
- [x] 2.2 `lw-select-name.ts`: `aria-labelledby` without the value slot; `required` reflected as `aria-required`
- [x] 2.3 `lw-select.element.ts`: `required` observed, reflected and upgrade-safe; one keydown handler on the trigger for open and closed; `aria-activedescendant` instead of focusing rows; the active option scrolled into view
- [x] 2.4 Run 1.1 to 1.6 green, and update the existing select tests and `dialog-dismissal.spec.ts` where they assumed the button role, the name with the value, or focus inside the list

## 3. Verify

- [x] 3.1 The full shell suite and the frame kit's build test
- [x] 3.2 Testbed e2e: every select found as a button moves to the combobox role (`chrome.spec.ts`, `a11y.spec.ts`, `sandbox.spec.ts`, `cross-tab-sync.spec.ts`, `tooltip-look.spec.ts` where it addresses a select); the accessibility audit gains a required select and passes. Also moved: `settings.spec.ts` (Density), the keyboard test in `chrome.spec.ts` (focus stays on the control), and an unscoped `getByRole('combobox')` in `surface-retention.spec.ts` that now matched a select before the open picker's field
- [x] 3.3 Demo e2e: the demo runs on the published packages, so its select lookups by the button role (`demo/e2e/smoke.spec.ts`, `quotes.spec.ts`, `quotes-document.spec.ts`) move to the combobox role in the PR that raises the demo and the example to 0.19.0, not here; the lookups by `.lw-select-trigger` need no change
- [ ] 3.4 Manual check in Safari with VoiceOver on the testbed: name, role, value and "required" announced, the option moved to announced; done by the owner before the release and before this change is archived. Chromium's accessibility tree, read by `.claude/tests/select-combobox/ax-tree.mjs`, already gives role `combobox`, name "Range", value "Short" then "Long", required, and focus kept on the control
- [x] 3.5 Lint for the shell, the testbed and the demo

## 4. Document and close

- [x] 4.1 `docs/reference/design-tokens.md`: role, name and value, the `required` attribute, the keys, and that a select needs a name
- [x] 4.2 `llms-full.txt`: the same, where it describes the select
- [x] 4.3 `openspec validate --all --strict`
- [ ] 4.4 PR with a **Breaking** section that gives a consumer the three edits (combobox role, name without the value, `required` in place of label text) and the nameless-select case, and says it closes the rest of NextPA finding F-045
- [ ] 4.5 Report the release as ready for 0.19.0 and ask the owner before bumping
