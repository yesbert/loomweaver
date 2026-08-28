## MODIFIED Requirements

### Requirement: Workspaces are reachable in one gesture, and identifiable at a glance

The user SHALL be able to switch workspaces without opening a dialog, and each SHALL be
distinguishable by a short marker derived from its name, so that a list of them can be read quickly.

The marker SHALL be derived rather than stored, so renaming takes effect at once; where two would
collide only the newcomer SHALL change, so an established marker never moves.

A workspace the user saved is offered for switching by the workbench itself, which is the only party
that knows its name. A workspace the product declared is offered by the product, which names it and
gives it an appearance of its own; where a declared workspace is offered by nothing, the workbench
SHALL report it to the developer rather than leaving it reachable only through the dialog.

#### Scenario: Switching takes one gesture

- **WHEN** the user chooses a workspace from the launcher
- **THEN** it becomes active, and the marking follows and survives a restart

#### Scenario: Two similar names are told apart, and the established one does not move

- **WHEN** a workspace is added whose marker would collide with an existing one
- **THEN** the newcomer's marker changes and the existing one is unchanged

#### Scenario: A declared workspace nothing offers is reported

- **WHEN** a product declares a workspace and offers no way to switch to it besides the dialog
- **THEN** the developer is told, and the workspace is named
- **AND** the application runs, because the workspace still works and is still reachable

#### Scenario: A workspace the product offers is not reported

- **WHEN** a product offers a way to switch to a workspace it declared
- **THEN** nothing is reported about it
