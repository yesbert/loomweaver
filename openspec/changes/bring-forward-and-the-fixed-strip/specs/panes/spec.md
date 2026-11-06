## ADDED Requirements

### Requirement: A pane's own button moves the address when it changes what the pane shows

A click on one of a pane's own buttons that opens content in that pane or changes which item it
shows SHALL move the address to that pane, as a click on one of its tabs does. A button that only
runs an action and leaves the pane showing what it showed SHALL leave the address where it is.

#### Scenario: Adding a tab to a pane moves the address there

- **WHEN** the content area is split, the address is in one pane, and the user opens an item in the
  other pane through that pane's add-tab button
- **THEN** that pane shows the item and carries the address

#### Scenario: A button that only acts leaves the address alone

- **WHEN** the content area is split, the address is in one pane, and the user maximises the other
  pane with its own button
- **THEN** the address stays in the pane that carried it
