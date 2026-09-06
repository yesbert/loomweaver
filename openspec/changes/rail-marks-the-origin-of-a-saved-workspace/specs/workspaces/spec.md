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

The launcher SHALL mark where the user is. While a workspace is active, the entry offering that
workspace SHALL be marked as the current one. While a saved workspace is active whose own entry is
drawn in no launcher, the entry offering its origin SHALL be marked instead, because the saved
workspace is a variant of that one and the user is, for the launcher's purposes, there. Where the
saved workspace's own entry is drawn, in whichever launcher, that entry alone SHALL be marked, so
that never more than one entry is marked at once. A saved workspace without an origin marks
nothing, because no entry is its own.

Marking the origin SHALL NOT change the entry otherwise: its icon, its name and what it says when
pointed at remain the origin's, and choosing it switches to the origin as it always does.

A product MAY decide that the workbench does not offer saved workspaces for the one-gesture path at
all, so that what stands alongside its own entries is its decision rather than the user's. Where it
does, the user SHALL NOT be able to place one there, an entry placed before the decision SHALL stop
being offered while the placement itself SHALL be kept, and saving, renaming, resetting and switching
SHALL all still work with the dialog as the way to them. The workbench SHALL report nothing about
their absence, because it is then a decision rather than an omission. This SHALL NOT affect
workspaces the product declared, which it offers itself and which are still reported where nothing
offers them. Because no saved workspace then has an entry of its own, the origin's entry SHALL be
marked while any of its variants is active.

#### Scenario: Switching takes one gesture

- **WHEN** the user chooses a workspace from the launcher
- **THEN** it becomes active, and the marking follows and survives a restart

#### Scenario: Two similar names are told apart, and the established one does not move

- **WHEN** a workspace is added whose marker would collide with an existing one
- **THEN** the newcomer's marker changes and the existing one is unchanged

#### Scenario: A saved workspace nobody placed marks its origin

- **WHEN** the user switches to a saved workspace whose entry they have not placed in any launcher,
  and the product offers the workspace it was saved from
- **THEN** the entry offering the origin is marked as the current one
- **AND** its icon and name are unchanged

#### Scenario: A saved workspace the user placed marks itself and not its origin

- **WHEN** the user has placed a saved workspace in a launcher and switches to it
- **THEN** its own entry is marked as the current one
- **AND** the entry offering its origin is not marked

#### Scenario: Choosing the marked origin leaves the variant

- **WHEN** a saved workspace is active, its origin's entry is marked, and the user chooses that
  entry
- **THEN** the origin becomes the active workspace

#### Scenario: A saved workspace without an origin marks nothing

- **WHEN** the user switches to a saved workspace that has no origin
- **THEN** no entry in any launcher is marked as the current one

#### Scenario: A declared workspace nothing offers is reported

- **WHEN** a product declares a workspace and offers no way to switch to it besides the dialog
- **THEN** the developer is told, and the workspace is named
- **AND** the application runs, because the workspace still works and is still reachable

#### Scenario: A workspace the product offers is not reported

- **WHEN** a product offers a way to switch to a workspace it declared
- **THEN** nothing is reported about it

#### Scenario: A product may keep its own entries alone in the rail

- **WHEN** a product decides the workbench does not offer saved workspaces for switching, and the
  user saves one
- **THEN** the user is not offered any way to place it in the rail
- **AND** the workspace is saved, is reachable through the dialog, and switching to it works

#### Scenario: An entry placed before the decision stops being offered but is not forgotten

- **WHEN** a user has placed a saved workspace in the rail and the product then decides the workbench
  does not offer them
- **THEN** the rail no longer shows it
- **AND** deciding the other way again shows it where the user had put it

#### Scenario: A saved workspace that is not offered still marks its origin

- **WHEN** a product decides the workbench does not offer saved workspaces for switching, and the
  user switches to one they had placed before
- **THEN** the entry offering its origin is marked as the current one

#### Scenario: A saved workspace that is not offered is not reported

- **WHEN** a product decides the workbench does not offer saved workspaces for switching
- **THEN** nothing is reported about the saved workspaces
- **AND** a declared workspace nothing offers is still reported
