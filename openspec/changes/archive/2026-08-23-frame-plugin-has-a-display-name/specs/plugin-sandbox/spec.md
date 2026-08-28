## ADDED Requirements

### Requirement: A composed frame plugin may be named for the user

A composition MAY give a frame plugin a name. Where it does, every surface that names that plugin to
the user SHALL show that name. Where it does not, those surfaces SHALL show the plugin's identifier,
and SHALL NOT derive a friendlier one from it.

The identifier SHALL remain what the plugin is keyed on — grants, collisions and stored decisions all
follow the identifier, never the name — so naming a plugin SHALL change nothing but what is read.

#### Scenario: A named plugin is shown by its name

- **WHEN** a composition names a frame plugin and the user opens a surface listing plugins
- **THEN** the plugin appears under that name

#### Scenario: An unnamed plugin is shown by its identifier

- **WHEN** a composition names no name for a frame plugin
- **THEN** the plugin appears under its identifier, unchanged

#### Scenario: The name is read, never matched

- **WHEN** two compositions give the same plugin different names
- **THEN** what each was granted, and what the user decided about it, is the same in both
