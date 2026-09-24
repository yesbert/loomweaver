## MODIFIED Requirements

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

#### Scenario: Closing the pane that fills the area ends the blow-up

- **WHEN** the pane that fills its area is closed, from its own control, from code or by closing
  its last item
- **THEN** no pane fills the area any more, and the remaining panes are shown in their places
- **AND** a distribution reading which pane fills the area reads that none does
