## ADDED Requirements

### Requirement: A plugin may ask whether the current address lies under one it names

A plugin SHALL be able to ask whether the content the workbench is showing sits at, or below, an
address the plugin names. The comparison SHALL break on segment boundaries, so that an address is
under another only where the shorter one is a whole prefix of it and not merely the start of its
text.

The answer SHALL be live in the same way as reading the active content, so a plugin can mark where
the user is rather than poll for it, and it SHALL require the same permission, because it answers
the same question in a narrower form.

#### Scenario: A deeper address counts as under the one named

- **WHEN** the workbench shows an address below one a plugin names
- **THEN** the plugin is told it is under it

#### Scenario: A longer name is not a deeper address

- **WHEN** the workbench shows an address whose text merely begins with the one a plugin names,
  without a segment boundary between them
- **THEN** the plugin is told it is not under it

#### Scenario: The address itself counts

- **WHEN** the workbench shows exactly the address a plugin names
- **THEN** the plugin is told it is under it

#### Scenario: Nothing addressable is shown

- **WHEN** the workbench shows nothing addressable
- **THEN** the plugin is told it is not under any address it names

#### Scenario: Asking without the permission is refused

- **WHEN** a plugin without permission for the content area asks
- **THEN** it is refused
