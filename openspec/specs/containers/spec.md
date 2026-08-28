# containers Specification

## Purpose
Some work is not one screen but a small workbench of its own: several related views, arranged
together, belonging to one thing the user picked. A container is a surface that holds such an
arrangement, so that a product can offer "everything about this one item" as a single piece of open
work that moves, closes and comes back as a unit.

## Requirements

### Requirement: A container holds an arrangement of child surfaces, scoped to what it is about

A surface MAY declare that it holds other surfaces. Its children SHALL be shown in an arrangement of
panes inside it, and each child SHALL be able to see what the container is about, so that several
containers can be open at once without confusing one another.

#### Scenario: Several containers are open at once, each about its own thing

- **WHEN** two containers of the same kind are open for different items
- **THEN** each child shows the item its own container is about

### Requirement: The inner arrangement behaves like the outer one

Inside a container the user SHALL be able to split, drag between panes, close and reopen exactly as
in the main area, and the arrangement SHALL survive a restart.

#### Scenario: Splitting works inside a container

- **WHEN** the user splits a pane inside a container
- **THEN** it splits as in the main area, and the arrangement is still there after a restart

#### Scenario: Dropping on an inner edge splits the inner pane

- **WHEN** the user drags an inner tab onto an inner pane's edge
- **THEN** that pane splits and the tab lands in the new sibling

### Requirement: The inner arrangement is sealed

Work SHALL NOT move between the inside of a container and the outside. An inner tab SHALL NOT be
draggable out, an outer one SHALL NOT be droppable in, and the gestures that would move something to
another part of the application SHALL NOT be offered on an inner tab.

#### Scenario: An inner tab offers no way out

- **WHEN** the user opens the context menu of a tab inside a container
- **THEN** it offers no way to move it to a sidebar or to the main area

#### Scenario: An inner drag stays inside

- **WHEN** an inner tab is dragged
- **THEN** only the container's own panes offer a target

### Requirement: The arrangement travels with the container

The container's inner arrangement SHALL belong to the piece of open work, not to the place it is
shown. Moving the container elsewhere SHALL take its arrangement with it, and closing it SHALL
discard the arrangement, so that reopening starts from the declaration again.

#### Scenario: Moving the container keeps what is inside it

- **WHEN** the container's tab is dragged into a sidebar
- **THEN** its inner arrangement comes along

#### Scenario: A window of its own carries the arrangement too

- **WHEN** the container is opened in a window of its own
- **THEN** the inner arrangement is there

#### Scenario: Closing and reopening starts fresh

- **WHEN** the container's tab is closed and opened again
- **THEN** the arrangement is the declared one

### Requirement: A container declares how it opens, not only what it holds

A container SHALL be able to declare its initial arrangement — nested rows and columns with
proportions, and which children start in each — using the same grammar a workspace uses. A plain
list of children SHALL remain valid shorthand for a single area.

A declared child MAY be marked as unclosable, and an unusable part of a declaration SHALL be dropped
and named rather than throwing.

#### Scenario: A declared arrangement opens as declared, every time

- **WHEN** a container declaring an arrangement is opened
- **THEN** the panes and proportions are as declared
- **AND** every instance of it opens the same way

#### Scenario: A child the container does not offer is dropped and named

- **WHEN** a declaration places a child the container does not list
- **THEN** it is dropped, the rest opens, and the developer is told

#### Scenario: A runaway declaration is stopped

- **WHEN** a declaration nests beyond a reasonable depth
- **THEN** it is stopped rather than followed indefinitely

### Requirement: A child may carry an address of its own

A child MAY declare a relative address. Where it does, the browser's address SHALL name the child
currently focused inside the container, so that a deep link, the back and forward buttons and a
reload all reach a particular child rather than only the container.

The address SHALL start on what the container declared as focused, and SHALL NOT rewrite itself on
load.

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

### Requirement: A child may open a sibling at a concrete address

A child SHALL be able to ask the container to open another child at a concrete address, supplying a
label for it, so that a list can open the thing it lists beside itself.

#### Scenario: A list opens what it lists, beside itself

- **WHEN** a child asks the container to open a sibling at an address
- **THEN** it appears in the arrangement's landing area, labelled as asked

#### Scenario: Opening the same thing twice focuses it

- **WHEN** the same address is opened again
- **THEN** the existing one is focused rather than a second appearing

#### Scenario: What was opened survives a restart

- **WHEN** the application restarts
- **THEN** the opened children are still there, at the addresses they were opened at

### Requirement: An area declared empty stays, and says what it is for

Where a declaration leaves an area empty on purpose, that area SHALL remain rather than collapsing
or falling back to the starting screen, and SHALL say that it is waiting for something to be opened
into it. It SHALL be where an opened sibling lands, and it SHALL survive its last child being closed.

#### Scenario: A declared empty area explains itself

- **WHEN** a container declares an area with nothing in it
- **THEN** the area is drawn and says what it is for

#### Scenario: Closing the last child keeps the area

- **WHEN** the last child in that area is closed
- **THEN** the area remains, ready for the next one

### Requirement: A container never ends up with nothing

Closing children inside a container SHALL never leave it empty by accident. Where the pane carrying
the container's own focus loses its last child, a neighbour SHALL take over, and the container SHALL
always keep at least one child unless an area was declared empty on purpose.

#### Scenario: The neighbour takes over

- **WHEN** the last child of the focused inner pane is closed while a sibling pane exists
- **THEN** the sibling takes over rather than the container emptying

### Requirement: A child the session may not see keeps its place and says why

Where a child requires a role the session does not hold, its pane SHALL remain and SHALL explain
why it is empty, distinguishing a signed-out user from one who lacks the role. When the session
qualifies, the child SHALL appear without a reload.

#### Scenario: A gated child explains rather than vanishing

- **WHEN** the session does not qualify for a declared child
- **THEN** its pane stays and says why, in words that match whether the user is signed in

#### Scenario: The child appears once the session qualifies

- **WHEN** the session gains the required role
- **THEN** the child is shown without a reload
