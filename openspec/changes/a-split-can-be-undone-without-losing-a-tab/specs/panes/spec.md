## MODIFIED Requirements

### Requirement: Dropping decides between joining and splitting

A pane SHALL offer two kinds of drop target: its strip, which joins the item to that pane, and its
edges, which split the pane and place the item in the new sibling. A pane holding nothing SHALL
offer one target over its whole area, because splitting it would produce an empty half.

A pane SHALL offer these targets for as long as it exists, whether or not it carries the address
and however often the address has moved to or from it, so that an item dragged out of a pane can
always be dragged back into it.

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

#### Scenario: A pane the address has left still takes a drop on its strip

- **WHEN** a tab is dragged from the pane carrying the address onto an edge, so that the new sibling
  takes the address, and the user then drags that tab onto the strip of the pane it came from
- **THEN** the strip offers a place for it and the tab joins that pane
- **AND** the sibling it left collapses, so the split is undone
