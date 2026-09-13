## MODIFIED Requirements

### Requirement: A composition can be asked what is wrong with it

The workbench SHALL be able to report, during development, the mistakes a composition can make
silently: a contribution aimed at a region the layout does not declare or that is of the wrong kind,
a removal instruction that matched nothing, a settings row replacement that matched no row, a
control pointing at an action nothing registers, and a keyboard shortcut more than one action
claims.

Where a shortcut is claimed more than once, the report SHALL name the actions claiming it and SHALL
say which of them the shortcut runs, because that is what the mistake costs: a control goes on
offering a shortcut that now does something else.

A removal instruction that *did* remove something SHALL NOT be reported, nor SHALL a row replacement
that did replace a row, and the report SHALL say so plainly when it finds nothing.

#### Scenario: A control pointing at nothing is named

- **WHEN** a button names an action that nothing registers, or that a removal instruction took away
- **THEN** the report names it

#### Scenario: A removal instruction that matched nothing is named, with a suggestion

- **WHEN** a removal instruction matches nothing
- **THEN** the report names it
- **AND** where a differently-prefixed form would have matched, it says so

#### Scenario: A row replacement that matched no row is named

- **WHEN** a distribution replaces a settings row under an identity no contributed section carries
- **THEN** the report names the identity

#### Scenario: A shortcut two actions claim is named, with the one that runs

- **WHEN** two actions in a composition declare the same keyboard shortcut
- **THEN** the report names both of them
- **AND** it says which one the shortcut runs

#### Scenario: A shortcut only one action claims is not reported

- **WHEN** every declared shortcut in a composition is declared once
- **THEN** the report says nothing about shortcuts

#### Scenario: A sound composition is told it is sound

- **WHEN** nothing is wrong
- **THEN** the report says so rather than staying silent

#### Scenario: The report does not displace something already there

- **WHEN** the report installs its entry point and something of the same name already exists
- **THEN** the existing one is left alone
