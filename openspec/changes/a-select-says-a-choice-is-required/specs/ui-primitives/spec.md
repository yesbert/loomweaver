## RENAMED Requirements

- FROM: `### Requirement: The choice control says what it is for, what is chosen, and whether it is invalid`
- TO: `### Requirement: The choice control says what it is for, what is chosen, and whether it is required or invalid`

## MODIFIED Requirements

### Requirement: The choice control says what it is for, what is chosen, and whether it is required or invalid

The workbench's choice control SHALL be announced as a control that opens a list of choices, with a
name that says what it is for and with the choice that is currently made as its value, whether it
shows the choice as text or as a symbol alone. The name SHALL NOT repeat the choice, so that it is
not announced twice. Where nothing is chosen, the placeholder SHALL be announced in place of the
choice. The announcement SHALL follow the choice when it changes.

A consumer SHALL be able to name the control by the workbench's own label attribute, by an
accessible name on the element, or by pointing at a label of its own on the page. A consumer that
marks the element as required SHALL have the control announced as required. A consumer that marks
the element as invalid, or ties a description to it, SHALL have that announced with the control.

While the list is open, focus SHALL stay on the control, and the option the user moves to SHALL be
announced from there. The arrow keys, Home and End SHALL move through the options and skip none that
can be chosen; Enter and Space SHALL choose the option moved to and close the list; the dismiss key
SHALL close it without changing the choice. On the closed control the arrow keys, Enter, Space, Home,
End and a typed letter SHALL open the list, a typed letter at the first option it begins.

The limits: marking a choice as required only announces it; the control does not prevent an empty
choice, draw a mark of its own, or take part in a form's validation. This is verified on
host-rendered content; an isolated surface runs the same element and is not tested separately. A
label a consumer points at must be in the same document as the control.

#### Scenario: A labelled select announces label and choice

- **WHEN** a select labelled "Language" has "English" chosen
- **THEN** its control is announced as a list control named "Language" with the value "English"

#### Scenario: A compact select with a symbol announces the same

- **WHEN** a compact select shows its choice as a symbol alone
- **THEN** its control is announced with the label as its name and the chosen option's name as its
  value

#### Scenario: Nothing chosen announces the placeholder

- **WHEN** a labelled select has no choice and carries a placeholder
- **THEN** its control is announced with the label as its name and the placeholder as its value

#### Scenario: A select named by a label of the consumer's own

- **WHEN** a consumer points the element at a visible label elsewhere on the page
- **THEN** the control is announced with that label's text as its name and the choice as its value

#### Scenario: A required select says so

- **WHEN** a consumer marks the element as required
- **THEN** the control is announced as required, and the page passes the accessibility audit
- **AND** the mark leaves the announcement once the consumer removes it

#### Scenario: An invalid select with an error says so

- **WHEN** a consumer marks the element as invalid and ties an error message to it
- **THEN** the control is announced as invalid, with the message as its description

#### Scenario: Changing the choice changes the announcement

- **WHEN** the choice changes while the select is on screen
- **THEN** the control is announced with the new choice as its value

#### Scenario: Moving through the list keeps focus on the control

- **WHEN** the user opens the list from the keyboard and moves to another option
- **THEN** focus stays on the control, the option moved to is announced, and Enter chooses it and
  closes the list

#### Scenario: Dismissing the list keeps the choice

- **WHEN** the user moves to another option and presses the dismiss key
- **THEN** the list closes, the choice is unchanged, and focus is on the control
