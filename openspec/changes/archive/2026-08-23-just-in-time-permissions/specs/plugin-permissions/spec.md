## MODIFIED Requirements

### Requirement: A refusal tells the user, and never locks them out

Where a refusal happens because of a user's own revocation, the workbench SHALL say so and SHALL
offer a way to the place where it can be undone. The workbench's own route to its settings SHALL
remain reachable no matter what has been revoked, so a user can never revoke themselves out of the
ability to restore.

Where a plugin the user installed themselves is refused something it declared, the workbench MAY
instead ask the user to grant it at that moment. A grant given that way SHALL be recorded like any
other and SHALL remain revocable; a refusal SHALL be remembered, so that declining is not a question
the user is asked again on every use.

This SHALL NOT depend on where the refusal arose. An action a plugin takes from inside its own
surface counts as much as one the workbench invoked on the plugin's behalf, and a refusal that
nothing catches SHALL reach the user in either case.

For a plugin running in the page the workbench can see that the plugin handled its own refusal, and
SHALL then stay silent. Across the frame boundary it cannot see that: a refusal there returns to the
plugin as a rejected answer, and whether the plugin absorbed it is not observable from here. A
refusal crossing that boundary SHALL therefore be reported whether or not the plugin handled it, and
the workbench SHALL NOT claim the quieter behaviour for it.

Asking SHALL NOT be able to exceed what the distribution allowed.

#### Scenario: A blocked action explains itself

- **WHEN** an action fails because the plugin behind it lacks a capability
- **THEN** the user is told, and offered a way to the permission settings

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

#### Scenario: A user-installed plugin may be granted at the point of use

- **WHEN** a plugin the user installed is refused something it declared
- **THEN** the user may be asked, and granting lets the action proceed

#### Scenario: Declining is remembered

- **WHEN** the user declines such a request
- **THEN** the action is refused and they are not asked again on the next use

#### Scenario: Asking cannot exceed the composition

- **WHEN** a plugin is refused something the distribution never allowed
- **THEN** the user is not asked, because agreeing could not grant it
