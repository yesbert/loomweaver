## ADDED Requirements

### Requirement: The store can be opened from the distribution's own control

The distribution SHALL be able to open the plugin store from its own code, and the store SHALL open
the same way it does from its built-in entries, whether or not the distribution kept those entries.
Without a catalogue, the store SHALL still open and offer nothing to install, so that a distribution
which manages installed plugins without a catalogue can still show them.

#### Scenario: The store opens while its built-in entries are gone

- **WHEN** the distribution has removed the store's settings row and command and opens the store
  from its own control
- **THEN** the store dialog opens as it would from the built-in entries

#### Scenario: No catalogue, nothing to install

- **WHEN** the distribution opens the store and has composed no catalogue
- **THEN** the store opens and offers nothing to install
