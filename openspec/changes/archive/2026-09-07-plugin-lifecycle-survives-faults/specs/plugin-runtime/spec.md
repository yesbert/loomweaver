## MODIFIED Requirements

### Requirement: Activation is isolated per plugin

The workbench SHALL activate each composed plugin independently. A plugin that fails to activate
SHALL NOT prevent the others from activating, and its own partial contributions SHALL be undone.

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

### Requirement: Contributions live and die with their plugin

Every contribution a plugin makes SHALL be revocable, and deactivating a plugin SHALL undo all of
them and run the plugin's own teardown. After deactivation the workbench MUST show nothing the
plugin contributed.

A teardown that throws SHALL NOT leave the plugin half unloaded: its contributions are still undone,
what it was granted is still released, and it is no longer counted as active. Where several plugins
are unloaded together, one plugin's throwing teardown SHALL NOT stop the others from being unloaded.
The failure is reported after everything has been undone, so that the report never stands in for
the work.

#### Scenario: Deactivation removes everything the plugin added

- **WHEN** an active plugin is deactivated
- **THEN** every contribution it registered is gone from the workbench
- **AND** its own teardown has run

#### Scenario: A single contribution can be withdrawn on its own

- **WHEN** a plugin releases the handle it received for one contribution
- **THEN** that contribution is removed and the plugin's others are untouched

#### Scenario: A throwing teardown still unloads the plugin

- **WHEN** a plugin's own teardown throws during deactivation
- **THEN** every contribution it registered is gone from the workbench
- **AND** the plugin is no longer active and holds no grant
- **AND** the failure is reported

#### Scenario: A throwing teardown does not stop the next plugin from unloading

- **WHEN** every plugin is unloaded together and the first plugin's teardown throws
- **THEN** the contributions of every other plugin are gone from the workbench as well
- **AND** the failure is reported after the last plugin has been unloaded
