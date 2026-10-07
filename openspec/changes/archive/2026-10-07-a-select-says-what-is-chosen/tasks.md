## 1. Pin the defect

- [x] 1.1 `lw-select.element.spec.ts`: the trigger's accessible name holds label and choice, in the text and the compact symbol form, and label and placeholder with nothing chosen; see it fail on the current code
- [x] 1.2 The same file: a host `aria-labelledby` names the trigger together with the choice; a host `aria-label` stands in for `label`
- [x] 1.3 The same file: `aria-invalid` and `aria-describedby` on the host appear on the trigger, follow changes and leave with their removal
- [x] 1.4 The same file: changing the value changes the name

## 2. Fix

- [x] 2.1 `lw-select-parts.ts`: a visually hidden label part and an id on the value slot; visually hidden text beside the symbol in the compact form
- [x] 2.2 `lw-select.element.ts`: `aria-labelledby` from the label part or the host's ids plus the value slot; observe and mirror the two state attributes
- [x] 2.3 Run 1.1 to 1.4 green, and the existing select tests updated where they asserted `aria-label`

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 Testbed: the dashboard's export range named by `aria-labelledby`, inside the accessibility audit; the chrome suite's language and theme selects still found by name. A required mark was tried here and taken out, see the design note
- [x] 3.3 Lint for the shell and the testbed

## 4. Close

- [x] 4.1 `docs/reference/design-tokens.md` and `llms-full.txt`: how a select is named and marked
- [x] 4.2 `openspec validate --all --strict`
- [x] 4.3 Note in the PR that this closes NextPA finding F-045, and the changed name in the release notes
