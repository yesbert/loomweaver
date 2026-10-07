## ADDED Requirements

### Requirement: The choice control says what it is for, what is chosen, and whether it is invalid

The workbench's choice control SHALL be announced with a name that says what it is for and with the
choice that is currently made, together, whether it shows the choice as text or as a symbol alone.
Where nothing is chosen, the placeholder SHALL be announced in place of the choice. The announcement
SHALL follow the choice when it changes.

A consumer SHALL be able to name the control by the workbench's own label attribute, by an
accessible name on the element, or by pointing at a label of its own on the page. A consumer that
marks the element as invalid, or ties a description to it, SHALL have that announced with the
control.

The limits: the control does not announce that a choice is required, because the role it is
announced with does not carry that state; a consumer says so in the label. This is verified on
host-rendered content; an isolated surface runs the same element and is not tested separately. A
label a consumer points at must be in the same document as the control.

#### Scenario: A labelled select announces label and choice

- **WHEN** a select labelled "Language" has "English" chosen
- **THEN** its control is announced with both "Language" and "English"

#### Scenario: A compact select with a symbol announces the same

- **WHEN** a compact select shows its choice as a symbol alone
- **THEN** its control is announced with the label and the chosen option's name

#### Scenario: Nothing chosen announces the placeholder

- **WHEN** a labelled select has no choice and carries a placeholder
- **THEN** its control is announced with the label and the placeholder

#### Scenario: A select named by a label of the consumer's own

- **WHEN** a consumer points the element at a visible label elsewhere on the page
- **THEN** the control is announced with that label's text and the choice

#### Scenario: An invalid select with an error says so

- **WHEN** a consumer marks the element as invalid and ties an error message to it
- **THEN** the control is announced as invalid, with the message as its description

#### Scenario: Changing the choice changes the announcement

- **WHEN** the choice changes while the select is on screen
- **THEN** the control is announced with the new choice
