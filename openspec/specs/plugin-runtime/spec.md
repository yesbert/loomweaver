# plugin-runtime Specification

## Purpose
Everything a user sees in the workbench, apart from the frame itself, is contributed by a plugin —
including the product's own features, which enjoy no privileged path. This capability governs how a
plugin comes to life, what it may hand to the workbench, and what happens to those contributions
when it goes away again.

## Requirements

### Requirement: A plugin reaches the workbench through one uniform context

A plugin SHALL receive a single context object through which it makes every contribution and
reaches every host service. There SHALL be no privileged path beside it: a capability offered by
one plugin is consumed by another over the same route a third party would use, and the product's
own features are plugins like any other.

#### Scenario: The product's own features use the plugin path

- **WHEN** a distribution composes its own first-party feature bundle
- **THEN** it contributes through the same context and the same registration calls a third-party
  plugin would use

#### Scenario: A domain capability is not part of the platform

- **WHEN** a plugin needs an ability that belongs to another plugin's domain
- **THEN** it obtains it from that plugin, not from the workbench

### Requirement: Activation is isolated per plugin

The workbench SHALL activate each composed plugin independently. A plugin that fails to activate
SHALL NOT prevent the others from activating, and its own partial contributions SHALL be undone.

#### Scenario: One failing plugin does not take down the workbench

- **WHEN** one composed plugin throws while activating
- **THEN** the remaining plugins are activated and their contributions are registered
- **AND** the failure is reported

#### Scenario: A plugin is activated at most once

- **WHEN** activation runs again for a plugin that is already active
- **THEN** it is not activated a second time and its contributions are not duplicated

### Requirement: Contributions live and die with their plugin

Every contribution a plugin makes SHALL be revocable, and deactivating a plugin SHALL undo all of
them and run the plugin's own teardown. After deactivation the workbench MUST show nothing the
plugin contributed.

#### Scenario: Deactivation removes everything the plugin added

- **WHEN** an active plugin is deactivated
- **THEN** every contribution it registered is gone from the workbench
- **AND** its own teardown has run

#### Scenario: A single contribution can be withdrawn on its own

- **WHEN** a plugin releases the handle it received for one contribution
- **THEN** that contribution is removed and the plugin's others are untouched

### Requirement: A contribution is addressed by its id, and the last one wins

A contribution SHALL carry an id by which it can be replaced or removed. Registering a second
contribution of the same kind under an existing id SHALL replace the first. This is what lets a
distribution override or drop something the platform or a bundled plugin contributed.

#### Scenario: A distribution replaces a contributed item

- **WHEN** a distribution registers an item whose id matches one already contributed
- **THEN** the distribution's item is the one shown

#### Scenario: A distribution drops a contribution it does not want

- **WHEN** a distribution names a contribution id as omitted
- **THEN** that contribution is filtered out, and stays filtered out when it is registered again
  later

#### Scenario: Two kinds sharing an id are told apart

- **WHEN** a command and an addressable surface carry the same id and the distribution omits the
  bare id
- **THEN** only the command is dropped
- **AND** the surface is dropped only when its id is named with the prefix that identifies its kind

### Requirement: The user may turn a whole plugin off

A user SHALL be able to disable a composed plugin entirely, which unloads it and removes its
contributions, and to enable it again without reloading the application. The choice SHALL survive a
restart.

#### Scenario: Disabling a plugin removes its contributions immediately

- **WHEN** the user disables a plugin
- **THEN** everything it contributed disappears without a reload

#### Scenario: A disabled plugin is not activated at the next start

- **WHEN** the application starts and a plugin was previously disabled
- **THEN** that plugin is not activated

#### Scenario: Re-enabling restores the plugin in place

- **WHEN** the user enables a previously disabled plugin
- **THEN** it is activated and its contributions reappear without a reload

### Requirement: A contribution aimed at a place that cannot render it is reported

Where a plugin contributes something to a region that the distribution's layout does not declare,
or to a region of the wrong kind, the contribution SHALL be reported to the developer rather than
silently doing nothing.

#### Scenario: An item names a region that does not exist

- **WHEN** a plugin contributes an item to a region the layout does not declare
- **THEN** the developer is told, naming the item and the region

#### Scenario: An item names a region of the wrong kind

- **WHEN** a plugin contributes an item to a region that exists but cannot host that kind of item
- **THEN** the developer is told

#### Scenario: A contribution that can render is not reported

- **WHEN** a plugin contributes an item to a region that exists and can host it
- **THEN** nothing is reported

### Requirement: A plugin's identity is stamped by the workbench, not claimed

Where a contribution has to be attributed to a plugin — to gate it, to group it, or to remove it
with its owner — the workbench SHALL record the identity of the plugin that made the call. A plugin
MUST NOT be able to present itself as another.

#### Scenario: A plugin cannot claim another's identity

- **WHEN** a plugin supplies an owner identity along with a contribution
- **THEN** the identity recorded is the one the workbench knows for the calling plugin
