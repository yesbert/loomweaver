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

#### Scenario: Dragging between inner panes does not depend on what the container is about

- **WHEN** a container is open for an item whose address contains a colon, and the user drags an
  inner tab onto another inner pane's strip or edge
- **THEN** the tab joins or splits that pane, exactly as in a container whose address has none

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
load. The one exception is an address naming a child the product has left out: it SHALL open the
container on the child it focuses among those shown, and the address SHALL then name that child.

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

#### Scenario: An address naming a child left out reaches a child shown

- **WHEN** an address naming a child the product has left out is opened
- **THEN** the container opens on the child it focuses among those shown, and the address names that
  child

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
