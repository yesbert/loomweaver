## ADDED Requirements

### Requirement: A choice among a few options can be one segmented control with words

The workbench SHALL offer a style class that draws a group of native radios, each labelled with words,
as one segmented control: every option visible, the chosen one marked, the group drawn as a single
control. Because the options are native radios, the group SHALL behave as the browser makes any group
of radios behave: one tab stop, the arrow keys moving the choice, and a name given to the group the
usual way. The workbench SHALL draw visible focus on the option that has it.

An option that is unavailable but must stay reachable SHALL be drawn as the workbench draws any choice
control in that state.

The limits: the class draws and adds no behaviour; naming the group, and refusing a change to an
unavailable option, stay with whoever writes the markup. It is meant for a few short options; a long
list belongs in a select.

#### Scenario: Every option is visible and the chosen one is marked

- **WHEN** a plugin writes a group of labelled native radios with the segmented classes
- **THEN** all options are drawn side by side as one control, and the chosen one is marked

#### Scenario: The group is one tab stop and the arrow keys choose

- **WHEN** a person tabs into the group and presses an arrow key
- **THEN** focus enters the group once, the choice moves to the next option, and focus is visible on it

#### Scenario: An unavailable option looks unavailable and stays reachable

- **WHEN** one option is marked as unavailable without being natively disabled
- **THEN** it is drawn as unavailable, and it can still receive focus
