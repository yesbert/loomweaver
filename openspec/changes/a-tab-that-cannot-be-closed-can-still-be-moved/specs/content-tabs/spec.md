## MODIFIED Requirements

### Requirement: The user orders the tabs of a pane, and the order sticks to that pane

The user SHALL be able to reorder tabs within their band, by drag and from the keyboard, and the
order SHALL belong to the pane holding them rather than to the work area as a whole. It SHALL
survive a restart, SHALL leave a newly opened tab at its natural place, and SHALL silently forget
tabs that are gone.

Whether a tab may be reordered, and whether it may be dragged into another pane, SHALL rest on the
gestures the distribution offers and SHALL NOT rest on whether that tab may be closed. A tab the
arrangement declares unclosable keeps both gestures, as a pinned tab does; only closing is refused
it. The bands SHALL be one statement for every route, so that a tab the pointer may not move across
a band cannot be moved across it from the keyboard either.

#### Scenario: Reordering one pane leaves another alone

- **WHEN** the user reorders the tabs of one pane
- **THEN** another pane's order is unchanged

#### Scenario: Reordering does not cross a band

- **WHEN** the user moves a tab at the edge of its band further in that direction
- **THEN** it stays where it is

#### Scenario: A newly opened tab is not put at the end of a remembered order

- **WHEN** a tab that the remembered order does not know about is opened
- **THEN** it appears at its natural position

#### Scenario: Reordering is possible from the keyboard, and announced

- **WHEN** a tab has focus and the user asks to move it
- **THEN** it moves within its band and the new position is announced

#### Scenario: A tab that cannot be closed is still moved and reordered

- **WHEN** the arrangement declares a tab unclosable and the distribution offers reordering and
  moving between panes
- **THEN** that tab can be reordered within its band and dragged into another pane
- **AND** it still cannot be closed

#### Scenario: Switching closing off does not take reordering with it

- **WHEN** a distribution switches closing off while reordering and moving between panes stay on
- **THEN** its tabs can still be reordered and moved
