## ADDED Requirements

### Requirement: Grants declared in several places compose

A distribution SHALL be able to declare capability grants in more than one place, and the grant in
effect for a plugin SHALL be the union of what every declaration lists for that plugin. A later
declaration SHALL NOT replace an earlier one, and no declaration SHALL be silently dropped. A plugin
that no declaration names SHALL hold nothing, and everything that applies to one declaration, the
intersection with the plugin's own declaration and the user's revocations, SHALL apply to the
composed grant in the same way. A single declaration naming every plugin SHALL mean exactly what it
meant before.

#### Scenario: Two declarations for two plugins both count

- **WHEN** a distribution declares grants for one plugin in one place and for another plugin in a
  second place
- **THEN** each plugin holds what its declaration listed
- **AND** both activate

#### Scenario: Two declarations for the same plugin add up

- **WHEN** two declarations each list capabilities for the same plugin
- **THEN** the plugin holds the union of both lists, intersected with what it declares itself

#### Scenario: One declaration is unchanged in meaning

- **WHEN** a distribution declares all of its grants in a single place
- **THEN** every plugin holds exactly what that declaration lists for it, as before
