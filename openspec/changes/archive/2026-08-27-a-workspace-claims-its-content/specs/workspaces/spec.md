## ADDED Requirements

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

## MODIFIED Requirements

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
