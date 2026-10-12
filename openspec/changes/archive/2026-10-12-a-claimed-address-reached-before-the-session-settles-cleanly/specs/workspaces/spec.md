## MODIFIED Requirements

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

Where claimed content asks for a session the person does not yet have, the visit SHALL wait where the
person is and explain itself, and once the session qualifies the claim SHALL hold as for any other
visit. The waiting SHALL leave nothing behind: the workspace the visit waited in SHALL hold afterwards
what it held before, so a visit before the session is known ends as one after it would. What that
workspace held at the address before the visit SHALL stay.

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

#### Scenario: Content that waited for the session leaves nothing where it waited

- **WHEN** the application is opened at a claimed address whose content asks for a session, before
  the session is known, in a workspace that does not claim it
- **AND** the session then qualifies, so the claiming workspace becomes active
- **THEN** the workspace the visit waited in holds no tab for that content, now or after a restart
- **AND** this holds whether or not an arrangement was stored for the person who signed in
