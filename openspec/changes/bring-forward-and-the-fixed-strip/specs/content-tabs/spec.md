## MODIFIED Requirements

### Requirement: A strip too narrow to show everything stays usable

Where a pane is too narrow, tabs SHALL shrink and then be clipped rather than the strip scrolling
away from the user. Everything open SHALL remain reachable from a control that lists it, and
choosing a clipped tab SHALL bring it into view. On a strip the user may reorder, that moves it to
the front of its band. On one the user may not reorder, it keeps its place and the strip scrolls to
show it.

A strip SHALL NOT rearrange itself because of a click on a tab that is already fully visible.

#### Scenario: Everything open stays reachable when clipped

- **WHEN** more tabs are open than the pane can show
- **THEN** a control lists every open tab, and choosing one activates it

#### Scenario: Choosing a clipped tab brings it into view

- **WHEN** a tab that is not visible is activated on a strip the user may reorder
- **THEN** it is moved to the front of its band so that it can be seen

#### Scenario: A strip that may not be reordered keeps its order

- **WHEN** the distribution has switched reordering off and a tab that is not visible is activated
- **THEN** the tab becomes active and is scrolled into the visible part of the strip
- **AND** the order of the tabs is unchanged, and the list of open tabs marks it as the active one

#### Scenario: Clicking a visible tab does not reshuffle the strip

- **WHEN** the user clicks a tab that is already fully visible
- **THEN** the order is unchanged
