## ADDED Requirements

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
