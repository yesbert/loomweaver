## ADDED Requirements

### Requirement: An update that cannot be activated keeps the session

Where activating a new version fails after the user agreed to apply it, the workbench SHALL NOT
reload. The session SHALL stay as it was, including work the user agreed to discard, and the update
SHALL stay on offer. The user SHALL be told that the update could not be activated and to try again
later, also where the distribution announces updates itself.

The limit: recovering from broken offline storage is not an activation and still ends in a reload.

#### Scenario: A failed activation does not reload

- **WHEN** the user applies an update and activating it fails
- **THEN** the application is not reloaded and unsaved work is still there
- **AND** the user is told the update could not be activated

#### Scenario: The update can be tried again

- **WHEN** activating an update has failed
- **THEN** the update is still offered and applying it again asks and activates afresh
