## MODIFIED Requirements

### Requirement: A child may carry an address of its own

A child MAY declare a relative address. Where it does, the browser's address SHALL name the child
currently focused inside the container, so that a deep link, the back and forward buttons and a
reload all reach a particular child rather than only the container.

The address SHALL start on what the container declared as focused, and SHALL NOT rewrite itself on
load. The one exception is an address naming a child the product has left out: it SHALL open the
container on its first child that is shown, and the address SHALL then name that child.

#### Scenario: The address names the focused child

- **WHEN** the user focuses a different child that declares an address
- **THEN** the browser's address names it

#### Scenario: A deep link opens the child it names

- **WHEN** an address naming a child is opened directly
- **THEN** that child is shown, and a reload keeps it

#### Scenario: Loading does not rewrite the address

- **WHEN** a container is opened at its own address
- **THEN** the address is not rewritten to one of its children

#### Scenario: A window of its own freezes its address

- **WHEN** the container is opened in a window of its own and a child is opened there
- **THEN** that window's address does not change

#### Scenario: An address naming a child left out reaches the first child shown

- **WHEN** an address naming a child the product has left out is opened
- **THEN** the container opens on its first child that is shown, and the address names that child

## ADDED Requirements

### Requirement: A product may leave a child out, and bring it back

A plugin SHALL be able to leave a child of a container out and bring it back, at any time, for
reasons of its own rather than the session's roles. A child left out SHALL be absent from every
container that lists it: its tab SHALL NOT be drawn, walked with the keyboard, offered by the pickers
that open a child in a pane, or closed by closing in bulk. It SHALL NOT be replaced by a placeholder,
and this SHALL hold whether or not the session qualifies for the child.

A child left out SHALL keep its place. What the person arranged SHALL NOT change for it: brought back,
the child SHALL stand where it stood, and the other children SHALL stay where the person put them.

Where the child left out has the focus, the focus SHALL move to a child that is shown beside it, and
the address SHALL follow. A pane that holds only children left out SHALL NOT be drawn; the panes
beside it SHALL take its room, and it SHALL return with its child. This SHALL hold for a plugin that
runs isolated from the workbench as for one that runs in the page.

The limit: leaving out is decided per child, for every container that lists it; it is not decided
per open container. A product that leaves out every child of a container leaves the container
showing nothing, as an area declared empty does.

#### Scenario: A child left out draws no tab and no placeholder

- **WHEN** a container declares three children in one pane and the product leaves one out
- **THEN** the strip shows two tabs, and nothing stands in for the third

#### Scenario: A child brought back returns to its place

- **WHEN** the product brings the child back
- **THEN** its tab stands where it stood, and the two other tabs are where the person left them

#### Scenario: The focus leaves a child that is left out

- **WHEN** the focused child is left out while the container is open
- **THEN** a child shown beside it takes the focus, and the address names that child

#### Scenario: A pane of children left out makes room

- **WHEN** every child in one of a container's panes is left out
- **THEN** that pane is not drawn and the panes beside it take its room

#### Scenario: Leaving out wins over the padlock

- **WHEN** a child the session does not qualify for is also left out
- **THEN** no tab and no placeholder are drawn for it

#### Scenario: A child left out is not offered or closed

- **WHEN** the person opens the picker for a pane of the container, or closes all its tabs
- **THEN** the child left out is not offered, and it is not closed
