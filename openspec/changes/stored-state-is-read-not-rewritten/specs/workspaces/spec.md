## REMOVED Requirements

### Requirement: Stored content a workspace may no longer hold is dropped and named

**Reason**: Dropping is a rewrite of the user's stored arrangement that the user never asked for and
never sees, and it produces the damage it was meant to prevent. Where the dropped content was the
only content a workspace had, the workspace is left with no address of its own, is handed to
whichever workspace claims the starting address, and can no longer be entered or reset. The
requirement's own weighing, that losing a pane nobody sees beats gaining a pane nobody opened, did
not consider the case where the lost pane was the only one. Its exception for asynchronously
readable working state, which suspends the repair rather than trusting it, is the same concession
made once already.

**Migration**: Reading stored content against the declarations in force now is kept and is stated by
*Stored content that contradicts a current declaration is kept and recognised*. What changes is the
answer: the content stays and the contradiction is recognised. A product that relied on the
workbench to tidy up silently after a redeclaration now sees the stored arrangement returned intact
with the contradiction named, and decides for itself. The development-time message survives in the
new requirement; the exception for asynchronously readable working state does not, because nothing
is being rewritten and there is nothing to suspend.

## ADDED Requirements

### Requirement: Stored content that contradicts a current declaration is kept and recognised

A workspace's arrangement outlives the declarations it was built against. What a product declares
can change between one release and the next, and content stored under a workspace SHALL therefore be
read against the declarations in force now, not against the ones in force when it was written.

Reading SHALL NOT rewrite. Where a workspace holds stored content at an address another declared
workspace claims, that content SHALL be restored as it was stored, and the contradiction SHALL be
recognised. It SHALL NOT be moved to the claiming workspace: the user never chose to have it there.
The developer SHALL be told which workspace holds it and which address is contested, in development,
and that message SHALL NOT reach the user, who did nothing about it.

An address no declared workspace claims SHALL NOT be recognised as a contradiction, wherever it is
stored. Content that belongs nowhere in particular belongs where the user left it.

This holds however a product's working state reads back. Recognition needs no synchronous read and
carries no risk of emptying an arrangement on a guess, so no product is exempt from it.

Stored content that cannot be read as an arrangement at all SHALL be dropped without a message,
because there is nothing to keep and it names nothing anyone could act on.

#### Scenario: A tab another workspace now claims stays where it is

- **WHEN** a workspace's stored arrangement holds content at an address a declared workspace claims,
  and that arrangement is restored
- **THEN** the workspace comes up with that content still in it
- **AND** the claiming workspace has not gained it

#### Scenario: The developer is told what contradicts the declarations

- **WHEN** stored content is recognised as contradicting a current declaration
- **THEN** the developer is told, in development, which workspace holds it and which address is
  contested
- **AND** nothing is shown to the user on that account

#### Scenario: Unclaimed content is left where it was

- **WHEN** a workspace's stored arrangement holds content at an address no declared workspace claims
- **THEN** it is restored unchanged, and nothing is recognised

#### Scenario: A malformed record goes quietly

- **WHEN** stored content cannot be read as an arrangement at all
- **THEN** it is dropped without a message, because it names nothing anyone could act on

#### Scenario: A product whose working state reads back asynchronously is treated alike

- **WHEN** a workspace's arrangement is restored from working state that cannot be read back at once
- **THEN** it is restored as it was stored, and a contradiction in it is recognised as it would be
  for any other product

### Requirement: A workspace that cannot work as declared is entered and named

A workspace that declares content of its own and whose stored arrangement leaves it with none cannot
show anything, and its address is therefore the starting address, which another workspace may claim.
Entering such a workspace SHALL leave the user in it. The workbench SHALL NOT hand the user to the
workspace that claims the starting address, which would put the workspace out of reach and leave no
way to repair it.

Where a workspace cannot work as its declaration describes, the workbench SHALL say so to the user
and SHALL offer the reset that puts it back to its baseline. This announcement reaches the user
because the user can act on it, which is what distinguishes it from a contradiction the developer is
told about.

The product that composes the workspaces SHALL be able to turn the announcement off, once for the
product rather than for each workspace, and it SHALL be on where the product says nothing. Turning
it off SHALL NOT change what is stored, restored or reachable: the user is still left in the
workspace, and the product SHALL be able to learn which workspaces cannot work as declared, so that
turning the announcement off buys the freedom to answer differently rather than only silence.

#### Scenario: A workspace with no content of its own is still entered

- **WHEN** the user enters a workspace that declares content and whose stored arrangement leaves it
  with none
- **THEN** that workspace is the active one
- **AND** the workbench has not settled into the workspace that claims the starting address

#### Scenario: The user is told, and offered the reset

- **WHEN** a workspace cannot work as its declaration describes
- **THEN** the user is told so
- **AND** is offered the reset that returns the workspace to its baseline

#### Scenario: A product can answer for itself

- **WHEN** a product turns the announcement off and a workspace cannot work as declared
- **THEN** the workbench says nothing to the user
- **AND** the user is still left in that workspace
- **AND** the product can learn that the workspace cannot work as declared

#### Scenario: Saying nothing is not the default

- **WHEN** a product declares its workspaces without saying anything about the announcement
- **THEN** the announcement is made

### Requirement: A reset acts on the workspace it names

Resetting SHALL be able to name the workspace it acts on, and SHALL act on the active workspace
where none is named. A workspace SHALL be resettable without being entered first, so that a
workspace which cannot work as declared can be repaired at all.

Resetting a workspace the user is not in SHALL NOT move the user into it. The rule that a reset also
navigates to the content the baseline names holds for the workspace the user is in; elsewhere there
is no address to move to and moving would be a switch the user did not ask for.

A reset discards an arrangement the user may have built, and SHALL therefore be confirmed before it
takes effect wherever it is offered without the workspace first being entered.

#### Scenario: A workspace is reset without being entered

- **WHEN** the user resets a workspace they are not in
- **THEN** that workspace returns to its baseline
- **AND** the user is still in the workspace they were in

#### Scenario: Resetting where nothing is named still means here

- **WHEN** a reset is asked for without naming a workspace
- **THEN** the active workspace is the one reset

#### Scenario: Discarding is confirmed

- **WHEN** the user asks to reset a workspace they are not in
- **THEN** it is confirmed before the arrangement is discarded

### Requirement: An application reset may be asked to include every workspace

Resetting the application's own arrangement SHALL leave the workspaces' arrangements alone, and
SHALL be able to be asked to return every workspace to its baseline as well.

Including them SHALL be a choice made for that one reset and SHALL NOT be remembered as a setting,
because it describes the reset being asked for rather than a preference the user holds.

#### Scenario: The application reset alone leaves workspaces alone

- **WHEN** the user resets the application's arrangement without asking for more
- **THEN** the application's arrangement returns to its defaults
- **AND** every workspace keeps the arrangement it had

#### Scenario: The reset can be asked to reach every workspace

- **WHEN** the user resets the application's arrangement and asks for the workspaces to be included
- **THEN** every workspace returns to its baseline as well

#### Scenario: The choice is not remembered

- **WHEN** the user includes the workspaces in one application reset and later asks for another
- **THEN** the workspaces are not included again unless asked for again
