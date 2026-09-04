## MODIFIED Requirements

### Requirement: Splitting a pane makes a sibling, and the tree may nest

The user SHALL be able to split a pane along either axis, producing a sibling that is a pane in its
own right, and SHALL be able to split again inside either. Splits SHALL be resizable, and the
arrangement SHALL survive a restart.

Whether a pane can be split SHALL depend on the item it is showing, never on the shape of that
item's address. Content that cannot be duplicated into a sibling is content the workbench has nothing
to show for: an address no surface answers for, or one the signed-in user may not see. Splitting the
empty screen SHALL be allowed and SHALL produce an empty sibling rather than a tab standing for
nothing.

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

#### Scenario: An address of several segments splits like any other

- **WHEN** the pane carrying the address shows an item addressed by more than one segment, or one
  whose address was declared with a parameter and stands for a particular thing
- **THEN** the split controls are offered, and splitting duplicates that item into the sibling
- **AND** the same holds for a split performed by the distribution from its own code
