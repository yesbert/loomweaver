## ADDED Requirements

### Requirement: A frame plugin runs at a level the composition chooses

A plugin running in a frame SHALL run at one of two levels, and the level SHALL be part of how the
application was composed.

At the **isolated** level the plugin SHALL be stripped of an origin of its own, which is what denies
it the hosting document, any storage and any session the browser would otherwise carry for it. This
SHALL remain the default: a plugin whose level was not stated SHALL run isolated.

At the **embedded** level the plugin SHALL keep an origin, and with it whatever the browser grants
that origin — its storage, its cookies and the session they carry. The workbench SHALL NOT claim
that such a plugin is held back from the hosting application; the level exists to separate teams and
deployments, not privileges.

Both levels SHALL reach the same contract, be brokered by the same permissions, and be told the same
things about their surroundings. Only what the browser enforces around them differs.

#### Scenario: An unstated level is the isolated one

- **WHEN** a plugin is registered without a level
- **THEN** it runs isolated

#### Scenario: An embedded plugin keeps what its origin carries

- **WHEN** a plugin composed at the embedded level runs
- **THEN** it reaches the storage and the session of the origin it was served from

#### Scenario: The contract does not change with the level

- **WHEN** the same plugin runs at either level
- **THEN** it registers the same contributions, is granted capabilities the same way, and receives
  the same surroundings

### Requirement: The level is capped by the composition, and may be asked for below the cap

The composition SHALL decide the highest level a plugin may run at, and where plugins arrive from a
catalogue SHALL decide it for that catalogue as a whole. Nothing a plugin or an entry says SHALL be
able to exceed that cap.

A plugin or an entry MAY ask for a level. A request at or below the cap SHALL be honoured, so that
something needing no privilege can limit itself. A request above the cap SHALL be refused outright
rather than quietly satisfied at a lower one: a plugin running below what it needs fails in ways
nobody can diagnose, and a silent demotion hides the misconfiguration that caused it.

The level SHALL NOT be revocable, because withdrawing it does not reduce a plugin but breaks it —
the same reasoning that already keeps the right to contribute off the switches. It SHALL be shown
wherever what a plugin may do is shown, because it is the most consequential thing about it.

#### Scenario: A request below the cap is honoured

- **WHEN** a plugin asks for a level lower than the cap
- **THEN** it runs at the level it asked for

#### Scenario: A request above the cap is refused

- **WHEN** a plugin or an entry asks for a level beyond the cap
- **THEN** it is refused, rather than run at the cap or below it

#### Scenario: The level is not among the switches

- **WHEN** the user views the permissions of a plugin
- **THEN** the level is stated but is not something that can be withdrawn

## MODIFIED Requirements

### Requirement: Isolation comes from the boundary, not from where the code is served

A plugin running at the **isolated** level SHALL be executed with no access to the hosting document —
no shared globals, no reach into its storage, no ability to navigate it. That SHALL be a property of
how it is embedded rather than of where its files come from.

At the **embedded** level no such guarantee is made, and the workbench SHALL NOT imply one. What
separates an embedded plugin from the hosting application is its own document and its own
deployment, which is a separation of concerns rather than of privilege.

#### Scenario: An isolated plugin cannot reach the hosting document

- **WHEN** an isolated plugin runs
- **THEN** it cannot read or change the hosting document, its storage or its address

#### Scenario: An embedded plugin is not claimed to be contained

- **WHEN** a plugin runs at the embedded level
- **THEN** nothing presents it as restricted from the hosting application

### Requirement: An isolated plugin's own surface must be same-origin

A surface a frame plugin declares SHALL be refused unless it is served from an origin the
composition permitted for that plugin. Where no origin was permitted, that SHALL be the
application's own. Addresses that would execute or carry their content inline SHALL be rejected at
every level.

A plugin running in the page MAY embed a foreign origin; where it does, the application's own
content policy is what governs it.

#### Scenario: A foreign surface address is refused

- **WHEN** a frame plugin declares a surface served from an origin the composition did not permit
- **THEN** it is refused

#### Scenario: A surface from a permitted origin is accepted

- **WHEN** a frame plugin declares a surface served from an origin the composition permitted for it
- **THEN** it is accepted, and the boundary is maintained as at any other origin

#### Scenario: An executable or embedded address is refused

- **WHEN** a frame plugin declares a surface whose address would execute or carry its content
  inline
- **THEN** it is refused

### Requirement: An isolated surface is told what it cannot read

Because a surface in a frame cannot read the hosting document, the workbench SHALL send it what it
needs to render and behave correctly, and SHALL send it again whenever it changes: the active
language, the current presentation, the resolved design tokens, the interface size, its own position
in the address, whether it is currently being shown, and the session where the plugin is permitted
it.

The values sent SHALL be the resolved ones, so that a product's or a tenant's overrides travel
without a mechanism of their own.

Whether a surface is being shown SHALL follow from the workbench, not from the browser's own idea of
visibility, so that a surface the user has switched away from is told so even while the window
remains in front.

#### Scenario: An isolated surface follows the application's appearance

- **WHEN** the application's presentation or tokens change
- **THEN** the isolated surface receives the new values and re-renders in place

#### Scenario: The values sent are the effective ones

- **WHEN** a product or a plugin has overridden a token
- **THEN** the isolated surface receives the overridden value, not the platform default

#### Scenario: A surface is not sent what its plugin may not have

- **WHEN** the plugin lacks the permission for the session
- **THEN** no session is sent at all, rather than an empty one

#### Scenario: A retained surface is told it is no longer shown

- **WHEN** the user switches away from a surface that is retained rather than destroyed
- **THEN** the surface is told it is no longer being shown, and told again when it returns
