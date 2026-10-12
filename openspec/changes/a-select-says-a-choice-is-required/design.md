## Context

`<lw-select>` draws a `<button>` trigger with `aria-haspopup="listbox"` and a sibling listbox of
`role="option"` rows. The trigger is named by `aria-labelledby` over a visually hidden label part and
the value slot, so its name is "label value". Opening the list moves DOM focus into it: the rows
carry a roving tabindex and the active row is focused. `aria-invalid` and `aria-describedby` are
mirrored from the host onto the trigger. The previous change
(`openspec/changes/archive/2026-10-07-a-select-says-what-is-chosen`) left `aria-required` out because
the audit rejects it on the button role and on the role-less host; see proposal.md, Why.

The same element runs in an isolated surface through the frame kit, so whatever changes here changes
there without a second implementation.

## Goals / Non-Goals

**Goals:**

- The trigger follows the select-only combobox pattern closely enough that a screen reader announces
  name, role, value and the required state, and its keyboard model matches what that role promises.
- Everything a sighted person sees and does stays as it is.

**Non-Goals:**

- Form association (`name`, a native `required` constraint, submission, `:invalid`). The element
  still takes part in no form.
- A visible required mark. The consumer's label carries it, as with every other field.
- An editable or filtering combobox. Typing keeps its typeahead meaning.

## Decisions

**The trigger stays a `<button>` and takes `role="combobox"`.** ARIA in HTML allows the combobox role
on a button. The element keeps what it gets from the button for free: focusability, `disabled`, and a
click that opens the list. It also keeps the `.lw-select-trigger` class, so the theme and every test
that finds the trigger by class are untouched. Rejected: a `div` with `tabindex="0"`, as in the
pattern's reference example. It would reimplement `disabled` and click handling for no gain in what
assistive technology hears. Rejected as well: a native `<select>`, styled. Options with icons and the
compact symbol form would need the customizable select, which replaces the element's rendering and is
a larger change than this one.

**The name is the label alone; the value comes from the trigger's content.** `aria-labelledby` points
at the label part, or at the host's own ids where the host carries `aria-labelledby`, and no longer at
the value slot. A combobox that is not a text field exposes its text content as its value, so the
value slot is what is announced as the value, including the visually hidden option name beside the
symbol in the compact form. Keeping the value slot in the name as well would announce the choice
twice.

**`required` is an attribute and property of its own, reflected as `aria-required` on the trigger.**
Mirroring a host `aria-required`, the way `aria-invalid` is mirrored, does not work: the consumer's
framework owns the host attribute and puts it back, and on the role-less host it fails the audit
(`aria-allowed-attr`), which is how the previous attempt failed. `required` is the name the native
select uses, so a consumer writes what it would write anyway. It is observed, reflected, and
upgrade-safe like `value`.

**Focus stays on the trigger; the active option is pointed at with `aria-activedescendant`.** That is
what the combobox role promises, and a screen reader announces the active option from it. The rows
keep their ids, lose their tabindex, and the active one is scrolled into view (`block: 'nearest'`).
The listbox's keydown handler moves onto the trigger and branches on whether the list is open. A
pointer press on the listbox is prevented from taking focus, so clicking an option leaves focus on
the trigger and the choice is made by the click as today. Rejected: keep moving DOM focus into the
list under the combobox role. Screen readers would announce the option twice or lose the combobox
context, and the audit's combobox rules expect the active descendant.

**Keys.** Closed: ArrowDown, ArrowUp, Enter, Space and Alt+ArrowDown open at the current choice; Home
and End open at the first and last option; a printable character opens and runs typeahead from it.
Open: ArrowDown, ArrowUp, Home, End move and skip disabled options; Enter, Space and Alt+ArrowUp choose
and close; Escape closes without choosing and is marked handled, so a dialog around the select does
not close on the same press, which `ui-primitives` already requires; Tab closes without choosing and
lets focus move on. The pattern lets Tab choose the active option; that is left out on purpose,
because a key meant to leave a field should not change its value.

**Shipped as 0.19.0.** The role and the name change what a consumer test finds, so this is a break
and opens a new line; additive parts alone would have been a patch.

## Risks / Trade-offs

- [A browser activates the button on a Space or Enter that the element already handled] → every
  handled key calls `preventDefault` on keydown, which suppresses the button's activation; a unit test
  pins that one press opens and a second chooses, and the testbed suite runs it in a real engine.
- [VoiceOver in Safari announces a button with the combobox role differently from Chromium] → a manual
  check with VoiceOver on the testbed's required select before the change is archived; the result goes
  into the PR.
- [Consumer tests break on upgrade] → the break is the point of the decision; the PR names the three
  edits a consumer makes (role, exact name, `required`), and the guides say the same.
- [A select without any name fails the audit after upgrade] → it was unnamed for a person before; the
  guides say a select needs a name, and the break is listed in the PR.

## Migration Plan

A consumer moves `getByRole('button', { name })` to `getByRole('combobox', { name })` for its
selects, drops the value from any exact name match, and replaces "(required)" text in a label with the
`required` attribute where it wants the state announced. Rollback is staying on 0.18.x.
