## 1. Pin the defect

- [x] 1.1 `dialog-outlet.spec.ts`: the field of a confirmation that asks to type is labelled by the requirement's label; see it fail on the current code
- [x] 1.2 The same file: while the guard shows a reason, the field is invalid and described by it; once it passes, neither; a silent refusal marks nothing
- [x] 1.3 The same file: the field of a prompt is labelled by its question
- [x] 1.4 `a11y.spec.ts`: the audit over the testbed's typed confirmation, with something typed, and the field's accessible name; see it fail on the current code (the field is named only by its placeholder there; the testbed's guard refuses silently, so the reason is pinned by 1.2)

## 2. Fix

- [x] 2.1 `dialog-outlet.html`: ids from the dialog's id on the label, the question and the reason; `aria-labelledby`, `aria-describedby` and `aria-invalid` on the field
- [x] 2.2 Run 1.1 to 1.4 green

## 3. Verify

- [x] 3.1 The full shell suite and lint
- [x] 3.2 The testbed's dialog and accessibility suites in the browser
- [x] 3.3 The initial bundles stay under their ceilings

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
- [x] 4.2 Note in the PR that this closes NextPA finding F-048
