## ADDED Requirements

### Requirement: A declared starting workspace is the default one

Where a distribution names the workspace the application opens in, that workspace SHALL be the
application's default workspace, and the workbench SHALL NOT offer a workspace of its own beside it:
no empty, undeclared workspace SHALL appear wherever workspaces are listed for switching or managing,
nor be counted among them.

Wherever the workbench returns the user to the default workspace without their naming one, it SHALL
return them to the declared one. Removing the workspace the user is in SHALL move them there.

A user whose stored choice is the workbench's own workspace, from a time when the distribution named
no starting workspace, SHALL be in the declared one at the next opening. What they had arranged in
the workbench's own workspace is not carried over into the declared one and is no longer shown.

Where a distribution names no starting workspace, the workbench's own workspace SHALL remain the
default: it SHALL be offered, it SHALL be where a new installation starts and where a removal leads,
and it SHALL behave as every other requirement of this capability describes.

#### Scenario: No empty workspace is offered beside a declared start

- **WHEN** a distribution declares the workspace the application opens in and the user opens the
  workspace dialog
- **THEN** no workspace other than the declared ones and the ones the user saved is listed
- **AND** the count shown for the user's own workspaces includes only the ones they saved

#### Scenario: Removing the active workspace leads to the declared start

- **WHEN** a distribution declares its starting workspace and the user removes the saved workspace
  they are in
- **THEN** the declared starting workspace is active

#### Scenario: A stored choice of the empty workspace leads to the declared start

- **WHEN** a user's stored choice is the workbench's own workspace and the distribution now declares
  its starting workspace, and the application is opened at an address that names content nobody
  claims
- **THEN** the declared starting workspace is active
- **AND** the content the address names is shown

#### Scenario: Without a declared start the empty workspace stays

- **WHEN** a distribution declares no starting workspace and the user opens the workspace dialog
- **THEN** the workbench's own workspace is listed first among the user's workspaces
- **AND** removing the saved workspace the user is in makes it active
