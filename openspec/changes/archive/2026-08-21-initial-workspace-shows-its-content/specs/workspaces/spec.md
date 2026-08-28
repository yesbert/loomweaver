## MODIFIED Requirements

### Requirement: A distribution may say where a first visit starts

A distribution SHALL be able to name the workspace a first visit opens in, and that first visit
SHALL show what the workspace declares, not merely make it the active one. A returning user SHALL be
left where they were, and an address that names content SHALL win over the declaration.

The address the application is opened at without a path SHALL NOT count as naming content, whatever
a product serves there: opening the application is not the same as following a link into it.

#### Scenario: A first visit lands in the declared workspace

- **WHEN** a user opens the application for the first time and a workspace is declared as the start
- **THEN** that workspace is active

#### Scenario: A first visit shows the content the workspace declares

- **WHEN** a first visit opens the application without naming content
- **THEN** the content area shows the workspace's own active tab, not what the bare address would
  otherwise resolve to

#### Scenario: A surface served at the bare address does not displace the declaration

- **WHEN** a product serves a surface at the address that names no content, and declares a starting
  workspace
- **THEN** the first visit shows the workspace's declared content
- **AND** that surface is still reachable at its address

#### Scenario: A returning user is not moved

- **WHEN** a user who has switched workspaces before returns
- **THEN** they are where they left off, not in the declared one

#### Scenario: A shared address wins

- **WHEN** the application is opened at an address naming content
- **THEN** that content is shown regardless of the declared starting workspace
