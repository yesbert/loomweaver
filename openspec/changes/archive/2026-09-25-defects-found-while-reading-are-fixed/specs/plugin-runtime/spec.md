## MODIFIED Requirements

### Requirement: Activation is isolated per plugin

The workbench SHALL activate each composed plugin independently. A plugin that fails to activate
SHALL NOT prevent the others from activating, its own partial contributions SHALL be undone, and
what it was granted SHALL be released.

A failure SHALL be attributed to the activation that produced it, not to the plugin's id. Where a
plugin was deactivated and activated again while an earlier activation was still pending, a
failure arriving from that earlier activation SHALL NOT undo the newer one: the contributions of
the current activation stay, and the failure is reported as belonging to an activation that is no
longer current.

#### Scenario: One failing plugin does not take down the workbench

- **WHEN** one composed plugin throws while activating
- **THEN** the remaining plugins are activated and their contributions are registered
- **AND** the failure is reported

#### Scenario: A plugin is activated at most once

- **WHEN** activation runs again for a plugin that is already active
- **THEN** it is not activated a second time and its contributions are not duplicated

#### Scenario: A late failure does not reach a newer activation

- **WHEN** a plugin's activation is still pending, the plugin is deactivated and activated again,
  the second activation registers a contribution, and then the first activation fails
- **THEN** the contribution of the second activation is still registered
- **AND** the failure is reported

#### Scenario: A plugin that fails to activate holds no grant

- **WHEN** a composed plugin throws while activating
- **THEN** it holds no grant, and the permissions surface does not list it
