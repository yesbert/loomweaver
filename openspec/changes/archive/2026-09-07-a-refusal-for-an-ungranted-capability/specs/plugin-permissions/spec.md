## MODIFIED Requirements

### Requirement: A refusal tells the user, and never locks them out

Where a refusal happens because of a user's own revocation, the workbench SHALL say so and SHALL
offer a way to the place where it can be undone. The workbench's own route to its settings SHALL
remain reachable no matter what has been revoked, so a user can never revoke themselves out of the
ability to restore.

Where a refusal happens because the capability was never granted, whether the distribution did not
grant it or the plugin did not declare it, the workbench SHALL tell the user that the action is not
available in this installation and SHALL NOT offer the way to the settings, because there is nothing
there the user could change. In development the workbench SHALL tell the developer which plugin was
refused which capability, so that a forgotten grant is visible rather than swallowed.

This SHALL NOT depend on where the refusal arose. An action a plugin takes from inside its own
surface counts as much as one the workbench invoked on the plugin's behalf, and a refusal that
nothing catches SHALL reach the user in either case.

For a plugin running in the page the workbench can see that the plugin handled its own refusal, and
SHALL then stay silent. Across the frame boundary it cannot see that: a refusal there returns to the
plugin as a rejected answer, and whether the plugin absorbed it is not observable from here. A
refusal crossing that boundary SHALL therefore be reported whether or not the plugin handled it, and
the workbench SHALL NOT claim the quieter behaviour for it.

#### Scenario: A blocked action explains itself

- **WHEN** an action fails because the user revoked a capability the plugin behind it was granted
- **THEN** the user is told, and offered a way to the permission settings

#### Scenario: An action refused for a capability never granted does not point to the settings

- **WHEN** an action fails because the plugin behind it was never granted the capability
- **THEN** the user is told the action is not available in this installation
- **AND** no way to the permission settings is offered

#### Scenario: The developer learns which grant is missing

- **WHEN** a plugin is refused a capability it was never granted, in development
- **THEN** the developer is told which plugin was refused which capability

#### Scenario: A refusal inside a plugin's own surface is not swallowed

- **WHEN** a plugin running in the page is refused while acting from its own surface, and does not
  handle the refusal itself
- **THEN** the user is told, exactly as when the workbench invoked the action

#### Scenario: A plugin that handles its own refusal does not raise a notice

- **WHEN** a plugin running in the page catches its own refusal
- **THEN** the workbench raises no notice of its own

#### Scenario: A refusal across the frame boundary is reported

- **WHEN** a plugin running in a frame is refused a capability it asked to use
- **THEN** the user is told, whether or not the plugin handled the refusal on its own side

#### Scenario: Settings stay reachable when everything is revoked

- **WHEN** every capability of every plugin is revoked
- **THEN** the workbench's own way into its settings still works
