## MODIFIED Requirements

### Requirement: Every surface that shows a contribution reacts to the session

The reaction SHALL be uniform across the workbench: launcher entries, bar items, docked view tabs,
the actions on a view, toolbars a plugin places, settings buttons, commands, the command palette,
keyboard shortcuts, addressable content, the pickers that offer content for a pane, and what may be
dragged into one.

Where a contributed control names a command, the command's own requirement SHALL decide whether the
control is drawn, in addition to any requirement the control declares for itself: a control naming
a command the session may not run, or that does not belong in the window the control is in, SHALL
NOT be drawn, in the main window as in a detached one. It SHALL appear once the session qualifies.
A control that carries behaviour of its own rather than a command is governed by its own
requirement alone, since nothing else declares who it is for.

#### Scenario: A command is unreachable by every route when its requirement is unmet

- **WHEN** a command's requirement is unmet
- **THEN** it is absent from the palette
- **AND** its keyboard shortcut does nothing
- **AND** an item pointing at it does not run it

#### Scenario: A control naming a command the session may not run is not drawn

- **WHEN** a launcher entry, a bar button, a surface's action or a settings button names a command
  whose requirement the session does not meet, while the control itself declares no requirement
- **THEN** the control is not drawn
- **AND** it is drawn once the session meets the command's requirement, without a reload

#### Scenario: A control naming a command that does not belong in a detached window is not drawn

- **WHEN** a launcher entry or a bar button is shown in a window of its own and names a command that
  has not declared itself suitable for one
- **THEN** the control is not drawn

#### Scenario: A picker offers only what the session may open

- **WHEN** the user opens a picker to choose content for a pane
- **THEN** it offers only content the session qualifies for

#### Scenario: The interface follows a change of session without a reload

- **WHEN** the session gains or loses a role
- **THEN** contributions appear and disappear accordingly, without a reload
