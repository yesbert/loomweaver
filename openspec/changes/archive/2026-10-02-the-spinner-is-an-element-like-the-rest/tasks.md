## 1. Pin the defect

- [x] 1.1 `lw-spinner.element.spec.ts`: after `defineLwSpinner()`, `<lw-spinner size="1rem" label="Loading">` draws a ring of that size with `role="status"` and that name; `label` and `size` set as properties before and after upgrade take effect; no label means no name
- [x] 1.2 `element-registration.spec.ts` and the frame-kit `build.spec.ts` expect `lw-spinner`
- [x] 1.3 Run them and see them fail on the current code

## 2. Fix

- [x] 2.1 `LwSpinnerElement` and `defineLwSpinner`, listed in `LW_ELEMENT_DEFINITIONS` and exported from the shell
- [x] 2.2 `.lw-spinner-ring` as a class contract in the theme, on tokens; the reduced-motion exception stays
- [x] 2.3 Remove the `LwSpinner` component, its template and spec, and its export
- [x] 2.4 The progress dialog uses the element
- [x] 2.5 The frame bundle registers it
- [x] 2.6 `docs/reference/design-tokens.md`, `docs/weaver/sandboxed-surfaces.md` and `llms-full.txt` list the element with `size` and `label`

## 3. Verify

- [x] 3.1 The full shell and frame-kit suites
- [x] 3.2 Lint, formatting, `nx package shell`, the packed-types guard and the docs checks
- [x] 3.3 In the testbed, end to end: the spinner on the home view is visible, sized and turning, and the accessibility scan passes in both appearances; the reduced-motion exception is the rule that was there before

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
