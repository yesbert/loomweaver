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

#### Scenario: A refusal inside a menu entry's own implementation is not swallowed

- **WHEN** a plugin running in the page contributes a menu entry that carries its own
  implementation, and choosing it is refused a capability the plugin does not handle
- **THEN** the user is told, exactly as when the same refusal arises in a command

### Requirement: A distribution may declare that a plugin is not optional

A distribution MAY declare that a plugin it composes is not optional. The permissions surface SHALL
list such a plugin, state what it holds, and SHALL NOT offer to switch it off. It SHALL remain
active, whatever the user chose before the declaration was made.

Where such a plugin holds nothing that can be withdrawn, the surface SHALL leave it out rather than
draw a section in which nothing can be operated. A page about what may be permitted SHALL NOT carry a
part with nothing to permit, and SHALL NOT describe controls it does not contain.

A declaration that names a plugin the distribution does not compose SHALL have no effect, and in
development the developer SHALL be told which id names nothing, however the distribution composes
its plugins.

The declaration SHALL be the distribution's. A plugin SHALL NOT be able to make itself
not-optional by anything it says about itself, because everything a plugin declares in this model is
a request the distribution grants, and self-exemption from being switched off is the one grant that
would answer to nobody.

Withholding the switch SHALL withhold only that switch. The capabilities such a plugin was granted
SHALL remain revocable, because needing a plugin says nothing about needing everything it asked for.
This is narrower than the treatment of a plugin the operator deployed, which withholds both.

#### Scenario: The plugin an application cannot run without has no switch

- **WHEN** the user views the permissions of a plugin the distribution declared not optional
- **THEN** what it holds is stated, and no switch to turn it off is offered

#### Scenario: A plugin with nothing to permit is not drawn

- **WHEN** a plugin offers neither a switch nor a capability that can be withdrawn
- **THEN** the permissions surface leaves it out
- **AND** a surface left with nothing to show says so, as it does when nothing is installed

#### Scenario: Its capabilities can still be withdrawn

- **WHEN** the user views the capabilities of such a plugin
- **THEN** each may still be withdrawn and restored

#### Scenario: A plugin that was switched off comes back when it becomes required

- **WHEN** a plugin the user had switched off is declared not optional
- **THEN** it is active again, and the surface offers no switch for it

#### Scenario: A plugin says nothing about being required

- **WHEN** a plugin declares itself not optional in what it says about itself
- **THEN** that has no effect, and only the distribution's declaration counts

#### Scenario: A declaration naming a plugin that is not composed is reported

- **WHEN** a distribution declares a plugin not optional that it does not compose, whether its
  plugins run in the page, in isolated frames or come from a catalogue
- **THEN** nothing changes for the user
- **AND** in development the developer is told which id names no composed plugin
