# workspaces Specification

## Purpose
A workspace is a whole way of working: which panes exist, what is open in them, which views are in
the sidebars and which are hidden. Exactly one is active at a time, it remembers what the user does
to it, and it can be put back the way it started — which is what makes rearranging the workbench
safe to experiment with.

## Requirements

### Requirement: Exactly one workspace is active, and it remembers itself

There SHALL always be exactly one active workspace, and the arrangement the user works in SHALL
belong to it. Switching SHALL store what the user had and restore what the target had, so that
returning finds it as it was left.

The choice of workspace SHALL survive a restart.

#### Scenario: Switching and returning finds the arrangement unchanged

- **WHEN** the user rearranges one workspace, switches to another and comes back
- **THEN** the first is as they left it

#### Scenario: A workspace never used yet starts from its own baseline

- **WHEN** the user switches to a workspace they have not changed
- **THEN** it opens in the state it was defined with

#### Scenario: The active workspace survives a restart

- **WHEN** the application restarts
- **THEN** the workspace the user was in is active

### Requirement: A workspace has a baseline it can be put back to

Every workspace SHALL have a baseline, and the user SHALL be able to discard their changes and
return to it. The user SHALL also be able to declare their current arrangement to be the new
baseline.

Resetting SHALL also navigate to the content the baseline names, so that the address does not
immediately re-open something the reset just removed.

#### Scenario: Resetting discards the changes

- **WHEN** the user resets a workspace they have rearranged
- **THEN** it returns to its baseline

#### Scenario: Resetting also moves to the baseline's content

- **WHEN** a workspace is reset
- **THEN** the content shown is the one the baseline names

#### Scenario: The current arrangement can become the baseline

- **WHEN** the user applies their changes to the active workspace
- **THEN** that arrangement is what a later reset returns to

#### Scenario: Resetting one workspace leaves the others alone

- **WHEN** the default workspace is reset
- **THEN** the saved workspaces are untouched

### Requirement: The user is told which workspaces have unapplied changes

The workbench SHALL indicate which workspaces differ from their baseline, for the active one and
for the others. Something the workbench placed by itself SHALL NOT count as a change, so a workspace
nobody has touched reads as unchanged.

#### Scenario: An untouched workspace reads as unchanged

- **WHEN** the application starts for the first time
- **THEN** the default workspace is not marked as changed

#### Scenario: A change is marked, and applying or resetting clears it

- **WHEN** the user rearranges a workspace
- **THEN** it is marked as changed
- **AND** applying or resetting clears the mark

#### Scenario: A workspace left with changes stays marked while another is active

- **WHEN** the user leaves a changed workspace and switches away
- **THEN** it is still marked as changed

### Requirement: A product may define workspaces of its own

A distribution SHALL be able to define workspaces in code, alongside the ones a user saves. Their
baseline SHALL be the code's and SHALL NOT be overwritable by the user, who may still change and
reset their working copy.

A definition SHALL describe its arrangement declaratively — nested rows and columns with
proportions, the content of each area, and which sidebar views it hides.

A definition MAY leave the arrangement out. The workspace then holds nothing in the content area,
and switching to it SHALL leave the content at the address that names nothing — which is how a
product offers a screen that owns the whole content area as a workspace of its own.

#### Scenario: A defined workspace opens as its definition describes

- **WHEN** the user opens a workspace the product defined
- **THEN** the panes, their proportions and their content are as declared

#### Scenario: A defined baseline is not overwritten by use

- **WHEN** the user rearranges a defined workspace and resets it
- **THEN** it returns to the definition's arrangement

#### Scenario: A workspace without an arrangement shows what the bare address shows

- **WHEN** the user switches to a workspace whose definition declares no arrangement
- **THEN** the content area holds nothing of that workspace's own
- **AND** the address is the one that names no content

#### Scenario: An unusable part of a definition is dropped and named

- **WHEN** a definition contains a part the workbench cannot use
- **THEN** that part is dropped, the rest is used, and the developer is told what was dropped and
  what it would have cost

### Requirement: A distribution may say where a first visit starts

A distribution SHALL be able to name the workspace a first visit opens in, and that first visit
SHALL show what the workspace declares, not merely make it the active one. A returning user SHALL be
left where they were, and an address that names content SHALL win over the declaration.

Where the address that names content is claimed by a workspace, winning SHALL extend to the active
workspace and not only to what is shown: the visitor starts in the claiming workspace rather than in
the declared one.

The address the application is opened at without a path SHALL NOT count as naming content, whatever
a product serves there: opening the application is not the same as following a link into it.

#### Scenario: A first visit lands in the declared workspace

- **WHEN** a user opens the application for the first time and a workspace is declared as the start
- **THEN** that workspace is active

#### Scenario: A first visit shows the content the workspace declares

- **WHEN** a first visit opens the application without naming content
- **THEN** the content area shows the workspace's own active tab, not what the bare address would
  otherwise resolve to

#### Scenario: A surface served at the bare address does not displace the declaration

- **WHEN** a product serves a surface at the address that names no content, and declares a starting
  workspace
- **THEN** the first visit shows the workspace's declared content
- **AND** that surface is still reachable at its address

#### Scenario: A returning user is not moved

- **WHEN** a user who has switched workspaces before returns
- **THEN** they are where they left off, not in the declared one

#### Scenario: A shared address wins

- **WHEN** the application is opened at an address naming content
- **THEN** that content is shown regardless of the declared starting workspace

#### Scenario: A shared address that is claimed also decides the workspace

- **WHEN** a first visit opens the application at an address a workspace claims, and a different
  workspace is declared as the start
- **THEN** the claiming workspace is active
### Requirement: A workspace decides which sidebar views it holds

The user SHALL be able to hide a sidebar view within a workspace and reveal it again, and that
choice SHALL belong to the workspace rather than to the application. A workspace definition SHALL
be able to declare a sidebar empty without removing the sidebar itself.

#### Scenario: Hiding a view affects only this workspace

- **WHEN** the user hides a view in one workspace
- **THEN** it is still present in another

#### Scenario: A hidden view can be brought back

- **WHEN** the user reveals a hidden view from the curation list
- **THEN** it returns to its sidebar

#### Scenario: A workspace may declare a sidebar empty without removing it

- **WHEN** a definition lists a sidebar with no views
- **THEN** the sidebar is drawn and holds nothing

### Requirement: Switching never asks and never loses work

Switching workspaces SHALL NOT prompt the user and SHALL NOT destroy unsaved work: a surface with
unsaved work SHALL survive being parked by a switch, and SHALL take the address again when it is
next chosen, without a second copy appearing.

The frame of the application SHALL NOT be re-decided by a switch: a sidebar the user collapsed
belongs to the window, not to the workspace.

#### Scenario: Unsaved work survives a switch

- **WHEN** the user switches away from a surface with unsaved work and back
- **THEN** the work is intact and no prompt appeared

#### Scenario: A parked surface is reclaimed rather than duplicated

- **WHEN** the user returns to a parked surface and clicks it
- **THEN** it takes the address, and no second copy is created

#### Scenario: A switch does not collapse the frame

- **WHEN** the user switches workspaces
- **THEN** the sidebars stay as the window had them

### Requirement: Workspaces are reachable in one gesture, and identifiable at a glance

The user SHALL be able to switch workspaces without opening a dialog, and each SHALL be
distinguishable by a short marker derived from its name, so that a list of them can be read quickly.

The marker SHALL be derived rather than stored, so renaming takes effect at once; where two would
collide only the newcomer SHALL change, so an established marker never moves.

A workspace the user saved is offered for switching by the workbench itself, which is the only party
that knows its name. A workspace the product declared is offered by the product, which names it and
gives it an appearance of its own; where a declared workspace is offered by nothing, the workbench
SHALL report it to the developer rather than leaving it reachable only through the dialog.

A product MAY decide that the workbench does not offer saved workspaces for the one-gesture path at
all, so that what stands alongside its own entries is its decision rather than the user's. Where it
does, the user SHALL NOT be able to place one there, an entry placed before the decision SHALL stop
being offered while the placement itself SHALL be kept, and saving, renaming, resetting and switching
SHALL all still work with the dialog as the way to them. The workbench SHALL report nothing about
their absence, because it is then a decision rather than an omission. This SHALL NOT affect
workspaces the product declared, which it offers itself and which are still reported where nothing
offers them.

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

#### Scenario: A saved workspace that is not offered is not reported

- **WHEN** a product decides the workbench does not offer saved workspaces for switching
- **THEN** nothing is reported about the saved workspaces
- **AND** a declared workspace nothing offers is still reported

### Requirement: A workspace may claim the content that belongs to it

A workspace definition MAY claim content addresses, including a family of addresses that differ only
by which document they name.

Where content is reached at an address the active workspace claims, nothing SHALL move: the user is
already where that content belongs. Otherwise the address SHALL decide, and the workbench SHALL
activate the workspace that claims it and SHALL then show the content there, so that a document is
never laid over an arrangement built for something else.

Only a workspace the product declared SHALL be a destination. A workspace a user saved SHALL never
be one, however it came by its claim, because it exists on one machine only and an address that led
somewhere different for every user would not be an address at all.

The claim SHALL hold however the address is reached — a link followed into the application, a
restart, a command, a programmatic navigation, a tab a plugin opened. There SHALL be no exception for
an address the user reached from inside the application, because a rule that holds only sometimes
cannot be predicted by the person it moves.

Claiming SHALL be a declaration of the product that composes the workspaces. Nothing a plugin does
SHALL be able to claim an address or name a workspace, because workspace ids belong to the product
and a plugin that had to know them could not be installed into a second one. Nothing the user does
SHALL create a claim either; what a user decides is which workspace they save and from where.

An address no workspace claims SHALL behave as it does without any claim: it is shown where the user
already is.

Where an address is claimed by more than one declared workspace and one claim is narrower than the
others, the narrowest SHALL win, as the workbench already resolves a more specific address against a
more general one. Where none is narrower the claim SHALL be dropped, the developer SHALL be told and
the competing workspaces SHALL be named, and the application SHALL run: the address then behaves as
an unclaimed one. The workbench SHALL NOT pick a winner among equals, because a product that declared
two homes for one document has not decided where it belongs, and choosing for it would hide the
mistake.

#### Scenario: Following a link into claimed content lands in its workspace

- **WHEN** the application is opened at an address a declared workspace claims
- **THEN** that workspace is active
- **AND** the content is shown within it

#### Scenario: Reaching claimed content from another workspace moves the user

- **WHEN** the user is in one workspace and something navigates to an address another declared
  workspace claims
- **THEN** the claiming workspace becomes active
- **AND** the content is shown within it

#### Scenario: A plugin opening a document reaches the same place as a link

- **WHEN** a plugin opens a content tab at an address a declared workspace claims, from a workspace
  that does not claim it
- **THEN** the claiming workspace becomes active and holds the tab

#### Scenario: Content the active workspace claims does not move anything

- **WHEN** content is reached at an address the active workspace itself claims
- **THEN** the active workspace is unchanged

#### Scenario: Unclaimed content is shown where the user is

- **WHEN** content is reached at an address no workspace claims
- **THEN** the active workspace is unchanged and the content is shown there

#### Scenario: A restart at a claimed address lands where the claim points

- **WHEN** the application restarts at an address a workspace claims
- **THEN** the workspace that was active stays active if it claims that address
- **AND** otherwise the declared workspace claiming it becomes active

#### Scenario: A narrower claim wins over a wider one

- **WHEN** one declared workspace claims a family of addresses and another claims a single address
  within it
- **THEN** reaching that single address activates the workspace that claimed it
- **AND** reaching any other address of the family activates the workspace that claimed the family

#### Scenario: Two equal claims on one address are reported and neither is honoured

- **WHEN** a product declares two workspaces claiming the same address, neither narrower than the
  other
- **THEN** the developer is told, and both workspaces are named
- **AND** the application runs, and that address behaves as though nothing claimed it

### Requirement: Stored content a workspace may no longer hold is dropped and named

A workspace's arrangement outlives the declarations it was built against. What a product declares
can change between one release and the next, and content stored under a workspace SHALL therefore be
read against the declarations in force now, not against the ones in force when it was written.

Where a workspace holds stored content at an address another declared workspace claims, that content
SHALL be dropped as the arrangement is restored, and the developer SHALL be told which workspace held
it and which address was dropped. It SHALL NOT be moved to the claiming workspace: the user never
chose to have it there, and an arrangement that grows a pane nobody opened is worse than one that
loses a pane nobody sees.

Dropping SHALL be silent for stored content that is merely malformed, and SHALL be announced only
where the stored state contradicts a current declaration. The distinction is who can act on it: a
malformed record tells a developer nothing they can fix, whereas a contradiction is usually the
product's own declaration having moved, which is theirs to know about.

An address no declared workspace claims SHALL NOT be dropped, wherever it is stored. Content that
belongs nowhere in particular belongs where the user left it.

The announcement SHALL be a development-time message and SHALL NOT reach the user, who did nothing
and can do nothing about it.

Where a product's working state can only be read back asynchronously, the repair SHALL NOT apply and
the stored arrangement SHALL be restored unchanged. Emptying part of an arrangement on a guess is
worse than leaving one stale tab in it.

#### Scenario: A tab another workspace now claims does not come back

- **WHEN** a workspace's stored arrangement holds content at an address a declared workspace claims,
  and that arrangement is restored
- **THEN** the workspace comes up without that content
- **AND** the claiming workspace has not gained it

#### Scenario: The developer is told what was dropped

- **WHEN** stored content is dropped because a declaration now places it elsewhere
- **THEN** the developer is told, in development, which workspace held it and which address went
- **AND** nothing is shown to the user

#### Scenario: Unclaimed content is left where it was

- **WHEN** a workspace's stored arrangement holds content at an address no declared workspace claims
- **THEN** it is restored unchanged

#### Scenario: A malformed record goes quietly

- **WHEN** stored content cannot be read as an arrangement at all
- **THEN** it is dropped without a message, because it names nothing anyone could act on

#### Scenario: A product whose working state reads back asynchronously is left alone

- **WHEN** a workspace's arrangement is restored from working state that cannot be read back at once
- **THEN** it is restored as it was stored, with nothing dropped

### Requirement: A workspace the user saves is a variant of the one it came from

When the user saves the arrangement they are working in as a workspace of their own, the workbench
SHALL record which workspace declared by the product it came from, and SHALL show that origin
wherever workspaces are listed for switching or managing. The origin is not decoration: it is what
explains why one saved workspace keeps a kind of content and another does not, and a rule whose
reason is nowhere on screen is met as an accident.

The origin SHALL be the nearest workspace the product declared, so that saving from a variant
produces another variant of the same declared workspace and the relation is always one step deep.

A variant SHALL claim whatever its origin claims, read through the origin rather than copied at the
moment of saving, so that a claim the product adds later reaches every variant of that workspace.

A variant MAY have no origin: saving from a workspace the product did not declare SHALL leave it
without one, and a variant SHALL lose its origin where the product stops declaring it. A variant
without an origin SHALL claim nothing and SHALL be shown without one, rather than being hidden or
reported as broken.

The origin SHALL NOT be changeable after saving. A user who wants their arrangement to belong
somewhere else saves it again from there.

#### Scenario: Saving records where the arrangement came from, and it is shown

- **WHEN** the user saves their arrangement while a declared workspace is active
- **THEN** the saved workspace records that workspace as its origin
- **AND** the list of workspaces shows which one it is a variant of

#### Scenario: A variant of a variant belongs to the same declared workspace

- **WHEN** the user saves their arrangement while a variant is active
- **THEN** the new workspace has the same origin as that variant

#### Scenario: A variant keeps the content its origin claims

- **WHEN** content is reached at an address the variant's origin claims, while the variant is active
- **THEN** the variant stays active and shows the content

#### Scenario: A claim added later reaches the variants

- **WHEN** the product adds a claim to a declared workspace that variants already exist for
- **THEN** those variants keep content at that address as their origin now does

#### Scenario: A variant is never where an address leads

- **WHEN** an address is reached from a workspace that does not claim it, and a variant of the
  claiming workspace exists
- **THEN** the declared workspace becomes active, not the variant

#### Scenario: A variant whose origin is gone still works

- **WHEN** the product stops declaring the workspace a variant came from
- **THEN** the variant is shown without an origin, claims nothing, and is otherwise unchanged
