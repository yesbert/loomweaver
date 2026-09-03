# panes Specification

## Purpose
The work area is a tree of panes the user shapes: split one in two, drag work from one to another,
blow one up to fill the screen, collapse one away. Every pane is the same thing wherever it sits, in
the main area and in a sidebar alike, which is what lets work move between them at all.

## Requirements

### Requirement: A pane is one kind of thing everywhere

Every place the workbench can show work SHALL be a pane of the same kind, holding a group of open
items with one of them showing. This SHALL hold in the main area and in a sidebar, so that the same
gestures apply in both and work can move between them.

#### Scenario: A sidebar pane and a main-area pane behave alike

- **WHEN** work is moved from a sidebar into the main area, and back
- **THEN** it is shown in both, and the gestures available to it are the same

### Requirement: Splitting a pane makes a sibling, and the tree may nest

The user SHALL be able to split a pane along either axis, producing a sibling that is a pane in its
own right, and SHALL be able to split again inside either. Splits SHALL be resizable, and the
arrangement SHALL survive a restart.

#### Scenario: Splitting produces a usable sibling

- **WHEN** the user splits a pane
- **THEN** a sibling pane appears alongside it, holding the item the split named
- **AND** the divider between them can be dragged

#### Scenario: The direction of the split decides which side is new

- **WHEN** the user splits towards the left or the top edge
- **THEN** the new pane is placed before the existing one, and after it for the other two edges

#### Scenario: The arrangement survives a restart

- **WHEN** the application restarts
- **THEN** the panes, their nesting and their proportions are as the user left them

### Requirement: Moving work between panes moves it, never copies it

Dragging an item from one pane to another, and the menu and toolbar equivalents that do the same
thing, SHALL **move** it: the source pane loses it. Duplicating is a separate, explicitly named
gesture.

#### Scenario: The source pane loses what was dragged out

- **WHEN** an item is dragged from one pane into another
- **THEN** it is in the target pane and no longer in the source

#### Scenario: Every route to the same outcome behaves the same

- **WHEN** the user moves an item by drag, by its context menu, or by a keyboard equivalent
- **THEN** the result is identical

### Requirement: Dropping decides between joining and splitting

A pane SHALL offer two kinds of drop target: its strip, which joins the item to that pane, and its
edges, which split the pane and place the item in the new sibling. A pane holding nothing SHALL
offer one target over its whole area, because splitting it would produce an empty half.

#### Scenario: A drop on the strip joins the pane

- **WHEN** an item is dropped on a pane's strip
- **THEN** it joins that pane's group at the position it was dropped

#### Scenario: A drop on an edge splits the pane

- **WHEN** an item is dropped on a pane's edge
- **THEN** the pane splits and the item lands in the new sibling on that side

#### Scenario: An empty pane takes the whole drop

- **WHEN** a pane holds nothing
- **THEN** it offers a single target across its whole area, and a drop joins rather than splits
- **AND** the four edges return once it holds something

#### Scenario: Only what can be shown there is offered a target

- **WHEN** an item is dragged that the target pane could not show
- **THEN** no target is offered for it

### Requirement: A pane that loses its last item collapses, except the one that must remain

When the last item leaves a pane, that pane SHALL collapse and its sibling SHALL take its space.
One pane per area SHALL be exempt, so that the area is never left with nothing at all; when it is
emptied, it shows the application's starting screen rather than an invented placeholder.

#### Scenario: An emptied pane gives its space back

- **WHEN** the last item is moved out of a pane that has a sibling
- **THEN** the pane disappears and the sibling fills the space

#### Scenario: The area never ends up with no pane

- **WHEN** the last item is closed in the only remaining pane
- **THEN** the pane stays and shows the starting screen

#### Scenario: Closing the pane that holds the address promotes its neighbour

- **WHEN** the pane currently carrying the address is closed
- **THEN** a neighbour takes over the address and the arrangement collapses around it

### Requirement: Exactly one pane carries the address, and the pointer moves, not the pane

Exactly one pane at a time SHALL be the one whose content the address bar reflects, so that deep
links, browser history and reloads keep working. Which pane that is SHALL be recorded as a pointer
to a pane, and focusing another pane SHALL move the pointer rather than renaming or rebuilding
anything.

A pane SHALL keep its identity for as long as it exists, so that what is keyed to a pane — retained
work, stored state — is never orphaned by a change of focus.

#### Scenario: Focusing another pane moves the address to it

- **WHEN** the user focuses a pane that is not carrying the address
- **THEN** the address follows to what that pane is showing

#### Scenario: A change of focus does not disturb the panes

- **WHEN** focus moves between panes repeatedly
- **THEN** every pane keeps its identity, its items and which of them it was showing

#### Scenario: The pane that gives up the address keeps what it was showing

- **WHEN** a pane stops carrying the address
- **THEN** it continues to show the same item, rather than falling back to another

#### Scenario: The pointer survives a restart, and heals if it cannot

- **WHEN** the application restarts
- **THEN** the same pane carries the address
- **AND** if that pane no longer exists, another takes it over rather than the arrangement failing

### Requirement: Focus never duplicates what is already open

Where a pane takes over the address and the content it carries is already shown by another pane, the
workbench SHALL reuse what is there rather than opening a second copy, and SHALL leave nothing
behind for the starting screen.

#### Scenario: Handing over does not duplicate

- **WHEN** a pane takes the address for content another pane already shows
- **THEN** no second copy is opened

#### Scenario: The starting screen leaves no residue

- **WHEN** a pane showing the starting screen gives up the address
- **THEN** no item is left behind for it

### Requirement: A pane can be blown up, and collapsed away

The user SHALL be able to make one pane fill its whole area and restore it, and to collapse a pane
into a strip from which it can be brought back. Both SHALL apply per area, so a pane blown up in one
area leaves another area alone. A collapsed pane SHALL say what it is holding.

#### Scenario: Only one pane at a time fills the area

- **WHEN** a second pane is blown up
- **THEN** the first returns to its place

#### Scenario: Areas do not interfere

- **WHEN** a pane is blown up in one area
- **THEN** panes in another area are unaffected

#### Scenario: A collapsed pane names what it holds

- **WHEN** a pane holding several items is collapsed
- **THEN** the strip names the one it was showing and indicates how many more there are
- **AND** clicking it restores the pane

### Requirement: A pane offers the same controls wherever it is

A pane SHALL offer one set of controls — open something new, split either way, collapse, blow up,
close — and SHALL offer them identically whether or not it is the pane carrying the address. Which
of them exist at all is a decision the distribution makes.

#### Scenario: The pane carrying the address is not a special case

- **WHEN** the user compares the controls of the pane carrying the address with any other pane's
- **THEN** the same controls are offered

### Requirement: Splitting from the toolbar duplicates; dragging moves

The toolbar's split control SHALL duplicate what the pane is showing into the new sibling, while a
drag or a menu move SHALL take it. The duplicate SHALL carry the item's own label rather than being
reconstructed from its address.

#### Scenario: A toolbar split leaves the original in place

- **WHEN** the user splits from the pane toolbar
- **THEN** both panes show the item, and the original pane still holds it

#### Scenario: A duplicate is labelled like the original

- **WHEN** an item with its own title is duplicated by a split
- **THEN** the new pane shows that title rather than a title derived from the address

### Requirement: The arrangement of the content area is reachable to the distribution

The distribution SHALL be able to perform on the content area's panes, from its own code, what the
pane controls perform: split the pane that is showing something to the right or downwards,
duplicating what it shows; close a pane; undo the split; make a pane fill the area and restore it;
collapse a pane into its strip and bring it back; move the address to a pane; move an open item into
a pane. Each action SHALL be the same action the corresponding control performs, with the same
guards and the same outcome. This reach covers the content area; panes in a sidebar are not
addressed by it.

Where no pane is named, the action SHALL apply to the pane that carries the address.

#### Scenario: Splitting from code duplicates like the toolbar

- **WHEN** the distribution splits the pane carrying the address to the right
- **THEN** a sibling pane appears holding the same item, and the original pane still holds it

#### Scenario: Nothing to duplicate, nothing happens

- **WHEN** the distribution splits a pane whose content cannot be shown in a second pane
- **THEN** the arrangement is unchanged

#### Scenario: Closing from code asks about unsaved work

- **WHEN** the distribution closes a pane that holds unsaved work
- **THEN** the same question is asked that the pane's close control would ask, and the pane closes
  only if the answer allows it

#### Scenario: Closing the address pane promotes its neighbour, from code as from the control

- **WHEN** the distribution closes the pane carrying the address while the area is split
- **THEN** a neighbour takes over the address and the arrangement collapses around it

#### Scenario: The switch does not reach the service

- **WHEN** the distribution has switched splitting off and splits a pane from its own code
- **THEN** the pane splits, and no split control is shown to the user

### Requirement: A pane is addressed by a handle the workbench hands out

The workbench SHALL hand out one handle per pane, opaque to the distribution, that names that pane
for as long as it exists. A handle SHALL stay the same across focus changes, splits elsewhere and
restarts, so that the distribution can keep it. Once the pane is gone, its handle SHALL name nothing:
an action given a stale handle SHALL do nothing and SHALL NOT act on another pane in its place. The
distribution SHALL NOT need to know how a pane is identified inside the workbench.

#### Scenario: A handle keeps naming its pane

- **WHEN** the distribution holds a pane's handle and the address moves to another pane
- **THEN** the handle still names the same pane

#### Scenario: A stale handle does nothing

- **WHEN** the distribution acts with the handle of a pane that has been closed
- **THEN** nothing happens, and no other pane is affected

### Requirement: The arrangement is readable as facts

The distribution SHALL be able to read the content area's arrangement as reactive values: the panes
that exist with their handles, what each pane is showing and how many items it holds, which pane
carries the address, whether the area is split, which pane fills the area if any, and which panes are
collapsed. A reader that depends on one of these re-evaluates when it changes. What is read SHALL be
these facts and not the arrangement's internal shape.

#### Scenario: A distribution's own control follows a split

- **WHEN** a distribution binds its own control to whether the area is split, and the user splits a
  pane
- **THEN** the control re-renders as split without further wiring

#### Scenario: The facts name what each pane shows

- **WHEN** two panes are open and the distribution reads the panes
- **THEN** it receives two handles, each with the item its pane is showing and the number of items it
  holds, and exactly one is marked as carrying the address
