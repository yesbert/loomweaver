> **Status:** approved.

## Why

`<lw-select>` cannot say that a choice is required. Its trigger is announced as a button, and ARIA
allows `aria-required` neither on the button role nor on the role-less element, so the accessibility
audit rejects it on both. The requirement in `ui-primitives` states this as a limit and asks a
consumer to say it in the label. NextPA does ("Rufnummer (Pflichtfeld)") and carries the gap as an
open deviation in its conformance assessment; it is the last open part of finding F-045.

The role that carries the state is `combobox`, in the select-only combobox pattern. It also carries
the chosen value by itself, so the value no longer has to be folded into the name. The owner decided
on 2026-10-12 to take that role and close F-045, accepting that it breaks consumer tests.

## What Changes

- **BREAKING:** the select's control is announced as a **combobox**, not as a button. A consumer
  test that finds it with `getByRole('button', { name: … })` finds nothing and has to ask for
  `getByRole('combobox', { name: … })`.
- **BREAKING:** the control's **name is the label alone**, and the chosen option (or the placeholder)
  is its **value**. A screen reader still says both ("Language, combobox, English"). A test that
  matches the name exactly against label and value together ("Language English") changes; one that
  matches the label, or reads the control's text, does not.
- **BREAKING:** a select with **no name at all** (no `label`, `aria-label` or `aria-labelledby`) is
  now nameless. As a button it borrowed its text, the chosen value, as a name; a combobox does not,
  and the accessibility audit reports it. Such a select was already unlabelled for a person, it now
  says so.
- **New:** a boolean **`required`** attribute and property on `<lw-select>`. With it the control is
  announced as required. It marks nothing visually and takes no part in form validation, exactly as
  `aria-required` on any other control.
- **Keyboard:** while the list is open, focus stays on the control and the highlighted option is
  pointed at from there, as the combobox pattern expects. The keys stay the same and gain the ones the
  pattern names: Home and End open the list at its first and last option, Alt with the down arrow
  opens it, Alt with the up arrow chooses and closes, and typing a letter on the closed control opens
  the list at the first match.
- The look does not change. The trigger keeps its classes, so styles and tests that find it by
  `.lw-select-trigger` keep working.
- The limit in the requirement goes, and the requirement states that a required choice is announced.

Ships as a **minor** release (0.19.0), because it breaks consumer tests. The release itself stays the
owner's call.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: the requirement for the choice control says it announces a required choice, and
  how its name and its value divide what it says; the limit that excluded a required choice is
  removed.

## Impact

- `platform/libs/core/shell/src/lib/elements/select/lw-select.element.ts`, `lw-select-parts.ts` and
  `lw-select-name.ts`: role, name, value, the `required` attribute and the focus model while open.
- `platform/libs/core/shell/src/lib/elements/select/lw-select.element.spec.ts`: role, name, value,
  required state and the keyboard, pinned.
- Workbench tests that find a select as a button: `platform/apps/loom-testbed-e2e/src/chrome.spec.ts`,
  `a11y.spec.ts`, `sandbox.spec.ts`, `cross-tab-sync.spec.ts` and `tooltip-look.spec.ts` where it
  addresses a select. The testbed's accessibility audit gains a required select.
- The same element runs inside an isolated surface through `@loomweaver/frame-kit`; it changes there
  with it and is not tested separately, as before.
- `docs/reference/design-tokens.md` and `llms-full.txt`: role,
  name, value, `required`, and the keys.
- NextPA finding **F-045**, the rest left open by
  `openspec/changes/archive/2026-10-07-a-select-says-what-is-chosen` (its design note on
  `aria-required`). After the release NextPA moves its select tests to the combobox role, puts
  `required` on its three telephony selects, takes "(Pflichtfeld)" out of their labels and strikes the
  deviation.
