## ADDED Requirements

### Requirement: A surface that opens in more than one mode is named for the mode it is in

Where the workbench opens one surface in more than one mode, the accessible name it presents SHALL
describe the mode it opened in, so that what a screen reader announces is what actually opened. This
holds for the container and for the control that receives focus inside it: neither SHALL be left
unnamed, and neither SHALL carry the name of a mode other than the current one.

A placeholder SHALL NOT be relied on to carry this distinction. It is announced inconsistently
across screen readers and it disappears as soon as the user types, so it cannot be the only thing
that says which of two searches is open.

The limit of this guarantee: it is not established by the automated audit, which reports a control
named for the wrong thing as correctly named. It SHALL therefore rest on a test that asserts the
name against the mode.

#### Scenario: The search over open work announces itself as that

- **WHEN** the user opens the search over open work
- **THEN** the name it presents describes searching open work, and not searching commands

#### Scenario: The command search still announces itself as that

- **WHEN** the user opens the command search
- **THEN** the name it presents describes searching commands

#### Scenario: The distinction does not rest on the placeholder

- **WHEN** the user has typed into either search, so that no placeholder is shown
- **THEN** the name still describes the mode that is open
