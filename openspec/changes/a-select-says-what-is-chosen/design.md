## Context

`<lw-select>` builds its control in the light DOM: a `<button>` trigger holding a value slot and a
chevron, and a `role="listbox"` beside it. `syncTrigger()` sets `aria-label` on the trigger from the
`label` attribute; `observedAttributes` is `value`, `label`, `placeholder`, `disabled`, `compact`.
Because there is no shadow root, an id the consumer points at resolves from the trigger. See
proposal.md for the failure.

## Goals / Non-Goals

**Goals:**

- Name and value together, in every form.
- The element accepts what a consumer already writes on any control: `aria-label`,
  `aria-labelledby`, `aria-required`, `aria-invalid`, `aria-describedby`.

**Non-Goals:**

- A different role. The trigger stays a button with a listbox popup.
- Form association (`required` as a native constraint, `name`, form submission). The element does
  not take part in a form today and this change does not make it.

## Decisions

**The trigger is named by `aria-labelledby` over a label part and the value slot, not by a
composed `aria-label`.** The trigger gets a visually hidden label part holding the `label` attribute
(or the host's `aria-label`), and `aria-labelledby="<label part> <value slot>"`. Where the host
carries `aria-labelledby`, its ids take the label part's place. The value slot already holds the
chosen option's text, and in the compact form a visually hidden text beside the symbol, so the name
follows every change without the element composing strings. A composed `aria-label="Language:
English"` was rejected: it must be rebuilt on every change, it cannot carry a consumer's own label,
and it puts punctuation into the name that a screen reader reads aloud.

Rejected as well: `role="combobox"` on the trigger, which announces a value by role. It changes the
keyboard model a screen-reader user expects, and every consumer test that finds the select as a
button.

**The state attributes are mirrored, not moved.** `aria-required`, `aria-invalid` and
`aria-describedby` join `observedAttributes` and are copied onto the trigger, and removed from it when
removed from the host. The host keeps them, because the consumer's framework owns them and would put
them back. Where `aria-required` on a role-less host is flagged by the audit, the host's copy is the
only thing to revisit; the audit case in the testbed shows whether it is.

**The listbox keeps the label alone.** Its name is what it chooses; the choice is announced by the
selected option inside it.

## Risks / Trade-offs

- [A consumer test matching a select's name exactly breaks] → Named in the release notes; a
  substring match, Playwright's default, keeps working.
- [The label part duplicates text a consumer already shows] → It is visually hidden and only part of
  the name; a consumer who points at its own visible label gets no hidden part at all.
