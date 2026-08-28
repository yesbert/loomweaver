## ADDED Requirements

### Requirement: The workbench hands a plugin no credential

Nothing the workbench sends a plugin on its own account SHALL be usable to present the user to a
service, and the workbench SHALL offer no path whose purpose is to deliver one. What it tells a
plugin about the person using the application SHALL be limited to what that plugin needs in order to
gate itself: whether someone is signed in, and which opaque roles they hold.

This is what keeps the decision about what a plugin may see where it can still be made. A plugin
holding a credential of its own is answerable to nobody afterwards, because the service it presents
it to cannot tell the plugin from the person.

#### Scenario: A permitted session tells a plugin who, not how

- **WHEN** a plugin is permitted the session
- **THEN** it is told whether someone is signed in and which roles they hold, and nothing further
  that a service would accept as that person

#### Scenario: A permitted session tells an isolated surface the same and no more

- **WHEN** a surface of an isolated plugin is sent the session it is permitted
- **THEN** what arrives is whether someone is signed in and which roles they hold, and nothing
  further that a service would accept as that person

## MODIFIED Requirements

### Requirement: A plugin holds nothing it was not granted

Every part of the context that reaches host services, host state or the address of the content area
SHALL be gated on a capability. A plugin without that capability SHALL be refused, loudly and
identifiably, rather than receiving a silent no-op.

This governs the context, and only the context. Data a plugin obtains for itself, without asking the
workbench for it, passes no capability and is refused by nothing here — what such a plugin reaches
follows from the level it runs at instead. The workbench SHALL NOT present the capabilities as
though they decided it.

#### Scenario: An ungranted plugin is refused everything

- **WHEN** a plugin is composed with no capabilities at all
- **THEN** every gated part of its context refuses it

#### Scenario: A refusal names what was missing

- **WHEN** a plugin uses a part of the context it was not granted
- **THEN** the failure names the missing capability and the plugin that asked

#### Scenario: A refusal does not stop the other plugins

- **WHEN** one plugin is refused during activation
- **THEN** the other composed plugins activate normally

#### Scenario: A plugin that fetches for itself passes no capability

- **WHEN** a plugin obtains data without going through the context
- **THEN** no capability is consulted, and the workbench claims no say over what it obtained
