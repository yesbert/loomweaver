## MODIFIED Requirements

### Requirement: A plugin has a private place to keep working state

A plugin SHALL be able to keep working state under keys of its own choosing, isolated from every
other plugin, and SHALL be able to observe it so that two of its surfaces — including ones in
different windows — see the same value. This SHALL require no capability, because a plugin can
reach only its own namespace by construction.

The store SHALL be for working state only, and it SHALL be removed when the plugin is uninstalled.

#### Scenario: Two surfaces of one plugin share a value live

- **WHEN** one surface of a plugin writes a key and another observes it
- **THEN** the second sees the new value

#### Scenario: Two plugins using the same key name do not collide

- **WHEN** two plugins write the same key name
- **THEN** each reads back only its own value

#### Scenario: Uninstalling a plugin takes its state with it

- **WHEN** a plugin is uninstalled
- **THEN** everything it stored is removed

#### Scenario: An observer knows whether the value has arrived

- **WHEN** a plugin observes a key backed by a store that answers only asynchronously
- **THEN** it can tell that the value has not arrived yet, and is told when it has

#### Scenario: A plugin in the page is told when the value arrives, however it was started

- **WHEN** a plugin running in the page observes a key from where it is activated, including after
  the user switched it off and on again
- **THEN** it is told when the value arrives and whenever it changes, as an isolated plugin is

#### Scenario: A write made before an isolated surface is connected is kept

- **WHEN** an isolated surface writes a key before its connection to the workbench is established
- **THEN** the value is written once the connection is established, rather than kept only in the
  surface and lost

### Requirement: A plugin's private store has limits, and refuses rather than degrades

The private store SHALL cap how large a single value may be and how many keys one plugin may hold,
and SHALL refuse what exceeds them rather than writing something the store cannot carry. An empty
key SHALL be refused. A value with no data form, such as no value at all or a function, SHALL be
refused with a message naming the plugin and the key, and what was stored under the key SHALL stay;
a key is removed by clearing it, not by writing nothing.

#### Scenario: An oversized value is refused

- **WHEN** a plugin writes a value larger than the cap
- **THEN** the write is refused and nothing is stored

#### Scenario: Too many keys are refused

- **WHEN** a plugin creates more keys than the cap allows
- **THEN** the additional key is refused

#### Scenario: A value with no data form is refused

- **WHEN** a plugin writes no value, or a function, under a key
- **THEN** the write is refused with a message naming the plugin and the key, and the value stored
  before stays
