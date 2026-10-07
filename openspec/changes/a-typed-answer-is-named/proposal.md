> **Status:** approved.

## Why

NextPA found in 0.17.0 (finding F-048) that the text field of a confirmation that asks the person to
type something has no name. `DialogService.confirm({ requireConfirmation })` draws the label as
Markdown beside the field, and nothing ties the two together; the guard's message is not tied to the
field either. A screen reader announces an unnamed text field, and the audit reports "Form elements
must have labels" in every such dialog. `prompt()` draws the same field with its question beside it,
and the question does not name it either.

A dialog asked for through the workbench is the declarative path a plugin inherits accessibility on.
This is a defect against *The workbench meets WCAG 2.1 Level AA* (accessibility, criteria 1.3.1 and
4.1.2) and *A question may require the user to mean it* (ui-primitives), whose reason is shown but
not announced with the field.

## What Changes

- **The field is named by what it asks.** In a confirmation that asks to type, by the requirement's
  label; in a prompt, by the question.
- **The guard's reason is the field's description**, and the field is marked invalid while a reason
  is shown. A silent refusal marks nothing, so it still blocks without scolding.
- Unit tests in `dialog-outlet.spec.ts` for the name, the description and the invalid mark, and a
  testbed case in the accessibility audit with a typed confirmation open. They fail on 0.17.1; in the
  browser the field there is named only by its placeholder, which a confirmation without one lacks.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements named under *Why* already promise the behaviour; the change makes the
implementation keep them and pins the case that broke.

## Impact

- `platform/libs/core/shell/src/lib/dialog/dialog-outlet.html` and `dialog-outlet.ts`: ids on the
  label, the question and the reason, and the field's `aria-labelledby`, `aria-describedby` and
  `aria-invalid`.
- `platform/libs/core/shell/src/lib/dialog/dialog-outlet.spec.ts`: the regression tests in the merge
  gate.
- `platform/apps/loom-testbed-e2e/src/a11y.spec.ts`: the audit over a typed confirmation, in the
  nightly suite.
- NextPA finding **F-048**. Once a release carries this, NextPA adds its typed confirmations to its
  dialog sweep.
- Behaviour change without an API change. Ships as a patch.
