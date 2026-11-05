## MODIFIED Requirements

### Requirement: Exactly one workspace is active, and it remembers itself

There SHALL always be exactly one active workspace, and the arrangement the user works in SHALL
belong to it. Switching SHALL store what the user had and restore what the target had, so that
returning finds it as it was left. Neither a switch nor a reset SHALL carry the content the user
was looking at into the arrangement it restores: that arrangement holds what the workspace held, and
the content it then shows is the one it names.

The choice of workspace SHALL survive a restart. A remembered choice that names a workspace which is
neither declared nor saved any more SHALL give way to the default workspace once the saved
workspaces have been read, and the default workspace SHALL be the remembered choice from then on.
The opening SHALL NOT wait for that, and a person's choice that arrives after sign-in SHALL be
judged the same way, by that person's saved workspaces alone.

Where giving way would destroy unsaved work, the unsaved-work question SHALL be asked first, for
that work and no other, and declining SHALL leave the user in the workspace until the application
is opened again. What the workspace parked and what was stored for it SHALL NOT stay behind.

The limit: saved workspaces that could not be read, or are stored in a form that cannot be
understood, are no answer. The remembered choice SHALL then stand and SHALL NOT be rewritten. This
does not hold back a distribution's declared start: at the address that names no content it is
entered as at every opening there.

#### Scenario: Switching and returning finds the arrangement unchanged

- **WHEN** the user rearranges one workspace, switches to another and comes back
- **THEN** the first is as they left it

#### Scenario: A workspace never used yet starts from its own baseline

- **WHEN** the user switches to a workspace they have not changed
- **THEN** it opens in the state it was defined with

#### Scenario: The active workspace survives a restart

- **WHEN** the application restarts and the workspace the user was in still exists
- **THEN** the workspace the user was in is active

#### Scenario: A remembered workspace that no longer exists gives way to the default one

- **WHEN** the application is opened at an address naming content, the saved workspaces have been
  read, and the remembered workspace is neither declared nor saved any more
- **THEN** the default workspace is active and is the remembered choice
- **AND** the content the address names is shown
- **AND** nothing stored for the workspace that gave way is left

#### Scenario: Saved workspaces that could not be read move nobody

- **WHEN** the application is opened at an address naming content, and the saved workspaces cannot
  be read or are not stored as a list of workspaces
- **THEN** the remembered workspace stays active and the remembered choice is unchanged

#### Scenario: Saved workspaces that never answer do not hold the opening

- **WHEN** the application is opened without naming content, a start with content is declared, and
  the saved workspaces are never answered
- **THEN** the declared start is active and its content is shown

#### Scenario: Giving way asks before it destroys unsaved work

- **WHEN** the saved workspaces are read while the user already has unsaved work in a workspace
  that is neither declared nor saved, in a tab other than the one the address names
- **THEN** the unsaved-work question is asked for that work
- **AND** declining leaves the user in that workspace and the remembered choice unchanged

#### Scenario: A choice that arrives after sign-in is judged by that person's workspaces

- **WHEN** a person signs in after the application was opened, and the workspace they last chose is
  neither declared nor among their saved workspaces
- **THEN** the default workspace is active
- **AND** a workspace opened before the sign-in is not given up on the strength of their list

#### Scenario: A switch does not bring the content the user left

- **WHEN** the user is on content in one workspace and switches to another that does not hold it
- **THEN** the workspace switched to does not gain a tab for that content, however long its own
  content takes to appear

#### Scenario: A reset does not keep the content the user left

- **WHEN** the user is on content their workspace's baseline does not hold and resets the workspace
- **THEN** the reset arrangement does not hold a tab for that content

### Requirement: A reset acts on the workspace it names

Resetting SHALL be able to name the workspace it acts on, and SHALL act on the active workspace
where none is named. A workspace SHALL be resettable without being entered first, so that a
workspace which cannot work as declared can be repaired at all.

Resetting a workspace the user is not in SHALL NOT move the user into it. The rule that a reset also
navigates to the content the baseline names holds for the workspace the user is in; elsewhere there
is no address to move to and moving would be a switch the user did not ask for.

A reset discards an arrangement the user may have built, and SHALL therefore be confirmed before it
takes effect wherever it is offered without the workspace first being entered.

Resetting a workspace the user is not in also discards the surfaces parked under it. Where one of
them holds unsaved work, the reset SHALL ask the unsaved-work question for those surfaces first, and
SHALL leave the workspace and what is parked under it as they were if the answer does not allow it.
It SHALL NOT ask about work outside that workspace.

#### Scenario: A workspace is reset without being entered

- **WHEN** the user resets a workspace they are not in, and nothing parked under it holds unsaved
  work
- **THEN** that workspace returns to its baseline
- **AND** the user is still in the workspace they were in

#### Scenario: A reset of a workspace the user is not in asks about what is parked under it

- **WHEN** the user resets a workspace they are not in while a surface parked under it holds unsaved
  work
- **THEN** the unsaved-work question is asked for that surface, and for no surface of another
  workspace
- **AND** declining leaves that surface and the workspace's arrangement as they were

#### Scenario: Resetting where nothing is named still means here

- **WHEN** a reset is asked for without naming a workspace
- **THEN** the active workspace is the one reset

#### Scenario: Discarding is confirmed

- **WHEN** the user asks to reset a workspace they are not in
- **THEN** it is confirmed before the arrangement is discarded

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

- **WHEN** the distribution resets a workspace that is not active, and nothing parked under it holds
  unsaved work
- **THEN** it returns to its baseline without the unsaved-work question; whether a control confirms
  the reset first remains that control's decision

#### Scenario: Resetting a workspace the user is not in from code asks about what is parked under it

- **WHEN** the distribution resets a workspace that is not active while a surface parked under it
  holds unsaved work
- **THEN** the same question is asked that the reset command would ask, and the workspace is reset
  only if the answer allows it

#### Scenario: The facts follow a switch

- **WHEN** a distribution binds its own control to the active workspace and the user switches
- **THEN** the control re-renders with the new workspace without further wiring

#### Scenario: Reachable while switched off

- **WHEN** the distribution has switched workspaces off and switches to one from its own code
- **THEN** the switch happens, and the user meets no workspace control

### Requirement: Removing a workspace asks about the work parked under it

Removing a saved workspace destroys the retained work parked under it, and removing the one the user
is in also destroys the work in the tabs it shows that the default workspace does not hold in the
same pane. Wherever a removal is asked for, the workbench SHALL ask the unsaved-work question before
removing the workspace: for the surfaces parked under it and, where it is the workspace the user is
in, for those tabs as well, once for both and for no other work. It SHALL leave the workspace in
place if the answer does not allow it, and SHALL leave nothing parked under it once it is removed.

#### Scenario: Removal with unsaved parked work asks first

- **WHEN** a saved workspace holds a parked surface with unsaved work and its removal is asked for
- **THEN** the unsaved-work question is asked for that surface, and the workspace is removed only if
  the answer allows it

#### Scenario: Removal with nothing parked asks nothing

- **WHEN** a saved workspace holds no parked work, shows no unsaved work in a tab the default
  workspace does not hold, and its removal is asked for
- **THEN** it is removed without the unsaved-work question

#### Scenario: Removing the workspace in use asks about what it shows

- **WHEN** the saved workspace the user is in shows unsaved work in a tab the default workspace does
  not hold, and its removal is asked for
- **THEN** the unsaved-work question is asked once, for that work and for the surfaces parked under
  the workspace
- **AND** the workspace is removed only if the answer allows it

#### Scenario: A tab the default workspace also holds is not asked about

- **WHEN** the saved workspace the user is in shows unsaved work only in a tab the default workspace
  holds in the same pane, and its removal is asked for
- **THEN** it is removed without the unsaved-work question, and that work is still there
