> **Status:** approved.

## Why

NextPA found in 0.14.6 (finding F-045) that `<lw-select>` can say what it is for or what is chosen,
but not both. The element writes its `label` onto the trigger as `aria-label`, and an `aria-label`
replaces the trigger's content, which is the chosen value. Without `label` the trigger is announced
as its value alone ("English, button"); with `label` as its label alone ("Language, button"), and the
value is heard only once the list is open. Only the compact icon-only form carries both.

The element also reads nothing a product puts on it for assistive technology: `aria-label` and
`aria-labelledby` on the host are ignored, and `aria-invalid` and `aria-describedby` stay on the
host, which has no role, so a hint or an error cannot reach the control.

This fails WCAG 4.1.2 (name, role, value), which the requirement *The workbench meets WCAG 2.1 Level
AA* (accessibility) covers, and the promise of *What a plugin inherits* that a plugin using the
workbench's building blocks gets the guarantee without effort.

## What Changes

- **The trigger is named by its label and announces the chosen value as well**, in every form, not
  only the compact one. A choice with nothing chosen announces the placeholder in place of the value.
- **A product may name the select the way it names any control**: by `label`, by `aria-label` or by
  `aria-labelledby` on the element, pointing at its own visible label.
- **`aria-invalid` and `aria-describedby` on the element reach the control**, so a hint and an error
  message are announced with it.
- A requirement in `ui-primitives` for the select's name, value and state, with its limit: **a
  required choice is not announced by the control.** ARIA allows `aria-required` on neither the
  trigger's button role nor the element itself, so the audit rejects it on both. Carrying it would
  take the trigger's role to `combobox`, which every consumer test that finds the select as a button
  would notice; that is left for a decision of its own.

No new element, attribute name or event. The two forwarded attributes are the standard ones.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: a requirement that the workbench's choice control states what it is for, what is
  chosen and whether it is invalid, and that it does not yet say whether it is required.

## Impact

- `platform/libs/core/shell/src/lib/elements/select/lw-select.element.ts` and
  `lw-select-parts.ts`: the trigger's name and the forwarded state.
- `platform/libs/core/shell/src/lib/elements/select/lw-select.element.spec.ts`: the name, the value
  and the forwarded attributes, pinned.
- The testbed's accessibility audit gains a select named by `aria-labelledby`, the export range on
  the dashboard.
- `docs/reference/design-tokens.md` and `llms-full.txt`: the select's naming and state attributes.
- NextPA finding **F-045**. Once a release carries this, NextPA ties its messages to their selects
  and strikes the missing value from its conformance assessment. "(Pflichtfeld)" stays in its labels
  until the combobox role is decided.
- The accessible name of every named select grows by its value. A consumer test that matches a
  select's name exactly changes; a substring match does not. Ships as a patch.
