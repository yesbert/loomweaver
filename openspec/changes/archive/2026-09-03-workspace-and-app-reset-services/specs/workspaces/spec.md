## ADDED Requirements

### Requirement: Workspaces are reachable to the distribution

The distribution SHALL be able to do with workspaces, from its own code, what the workspace dialog
and the rail do: read which workspaces exist, which is active and which carry unapplied changes, as
reactive values; switch to a workspace; save the current arrangement as a new workspace; declare the
current arrangement the active workspace's baseline; reset a named or the active workspace; reset
every workspace; rename and remove a saved workspace. Each action SHALL be the same action the
control performs, with the same guards and the same outcome, and SHALL stay available while the
distribution has switched the workspace controls off for its users.

A confirmation that a control asks before it acts ("really reset?") belongs to the control and SHALL
NOT be asked by the service; the question about unsaved work belongs to the action and SHALL be
asked by the service wherever the action would destroy work.

#### Scenario: A distribution's own control switches workspaces

- **WHEN** a component the distribution wrote asks to switch to a declared workspace
- **THEN** that workspace becomes active exactly as if chosen from the rail, and no prompt appears

#### Scenario: Resetting from code asks about unsaved work like the command

- **WHEN** the distribution resets the active workspace while a surface holds unsaved work
- **THEN** the same question is asked that the reset command would ask, and the workspace is reset
  only if the answer allows it

#### Scenario: Resetting a workspace the user is not in asks no unsaved-work question

- **WHEN** the distribution resets a workspace that is not active
- **THEN** it returns to its baseline without the unsaved-work question, because no live work is in
  it; whether a control confirms the reset first remains that control's decision

#### Scenario: The facts follow a switch

- **WHEN** a distribution binds its own control to the active workspace and the user switches
- **THEN** the control re-renders with the new workspace without further wiring

#### Scenario: Reachable while switched off

- **WHEN** the distribution has switched workspaces off and switches to one from its own code
- **THEN** the switch happens, and the user meets no workspace control

### Requirement: A guarded action answers whether it ran

An action that asks about unsaved work before it acts SHALL report whether it went through, so that
a caller which chains several such actions can stop when the user declined. Declining SHALL leave
everything as it was.

#### Scenario: A declined reset reports so and changes nothing

- **WHEN** the distribution resets the active workspace and the user keeps their unsaved work
- **THEN** the action reports that it did not run, and the arrangement is unchanged

#### Scenario: A reset that was allowed reports so

- **WHEN** the distribution resets a workspace and nothing holds unsaved work
- **THEN** the action reports that it ran

### Requirement: Removing a workspace asks about the work parked under it

Removing a saved workspace destroys the retained work parked under it. Wherever a removal is asked
for, the workbench SHALL ask the unsaved-work question for the surfaces parked under that workspace
before removing it, and SHALL leave the workspace in place if the answer does not allow it.

#### Scenario: Removal with unsaved parked work asks first

- **WHEN** a saved workspace holds a parked surface with unsaved work and its removal is asked for
- **THEN** the unsaved-work question is asked for that surface, and the workspace is removed only if
  the answer allows it

#### Scenario: Removal with nothing parked asks nothing

- **WHEN** a saved workspace holds no parked work and its removal is asked for
- **THEN** it is removed without the unsaved-work question

### Requirement: The application reset is reachable to the distribution

The distribution SHALL be able to reset the application's own arrangement from its own code, with
the same unsaved-work question the reset command asks, and SHALL be able to ask for every workspace
to be included. The question SHALL be asked once for the pair, not once per part.

#### Scenario: Resetting the application from code asks like the command

- **WHEN** the distribution resets the application's arrangement while a surface holds unsaved work
- **THEN** the same question is asked that the command would ask, and the arrangement is reset only
  if the answer allows it

#### Scenario: Application and workspaces together ask once

- **WHEN** the distribution resets the application's arrangement and asks for the workspaces to be
  included
- **THEN** the unsaved-work question is asked at most once, and both resets happen if it is allowed
