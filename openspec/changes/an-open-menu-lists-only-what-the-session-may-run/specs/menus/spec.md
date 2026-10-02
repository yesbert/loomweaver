## MODIFIED Requirements

### Requirement: An entry that cannot work is not drawn

An entry naming a command that nothing registers — or that a distribution has removed — SHALL be
dropped rather than drawn as a dead control showing its raw identity. An entry with nothing to
label it SHALL likewise be dropped.

An entry naming a command the current session may not run SHALL be dropped too, whether the session
does not meet what the command requires or the window is one the command does not belong in. It
SHALL appear once the session qualifies. A menu left with no entry by this SHALL NOT open. An entry
that carries behaviour of its own rather than a command is not affected, since nothing declares who
it is for.

#### Scenario: An entry whose command was removed disappears with it

- **WHEN** a distribution removes a command that a menu entry names
- **THEN** the entry is not drawn

#### Scenario: An entry with no label is not drawn

- **WHEN** an entry carries neither a command to take a label from nor one of its own
- **THEN** it is not drawn

#### Scenario: An entry whose command the session may not run is not drawn

- **WHEN** a menu is opened and one of its entries names a command the session does not qualify for
- **THEN** that entry is not drawn, and the others are

#### Scenario: The entry appears once the session qualifies

- **WHEN** the session comes to meet what the command requires and the menu is opened again
- **THEN** the entry is drawn

#### Scenario: A menu whose every entry is refused does not open

- **WHEN** every entry of a slot names a command the session may not run
- **THEN** opening the slot shows nothing

#### Scenario: A detached window offers only the commands that belong there

- **WHEN** a menu is opened in a detached window
- **THEN** an entry naming a command that does not declare itself suitable for that window is not
  drawn
