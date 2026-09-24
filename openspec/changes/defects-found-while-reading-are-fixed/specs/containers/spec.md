## MODIFIED Requirements

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
