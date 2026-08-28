## ADDED Requirements

### Requirement: The permissions surface states the rung a plugin really runs at

Where the permissions surface describes how much a plugin is held back, that description SHALL be
true of the plugin it stands under. A plugin running in the application's own context SHALL NOT be
described as unable to reach the application, its storage or the user's session.

Every rung a plugin can be composed at SHALL have its own account. Where a rung has none, the
surface SHALL say nothing about isolation rather than borrow the account of another rung, because a
missing sentence misleads no one and a borrowed one does.

#### Scenario: A trusted plugin is not called isolated

- **WHEN** the user opens the permissions surface with a trusted, in-process plugin composed
- **THEN** what it says about that plugin does not claim the plugin is held back from the
  application, its storage or the session

#### Scenario: An isolated plugin is still called isolated

- **WHEN** the user opens the permissions surface with a plugin composed at the isolated level
- **THEN** it says that the plugin cannot reach the application, its storage or the session

#### Scenario: Each rung is described as itself

- **WHEN** plugins composed at different rungs are listed together
- **THEN** each description belongs to the rung of the plugin it stands under
