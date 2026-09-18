## MODIFIED Requirements

### Requirement: Closing in bulk spares what must not go

The user SHALL be able to close the other tabs, all of them, or those after a given one. Each SHALL
spare pinned tabs and any tab the arrangement declares unclosable.

Closing a pane and undoing a split are bulk closes too, whether the user asks for them through a
pane's control or the distribution asks for them from its own code. They SHALL spare the same tabs,
and a spared tab SHALL be handed to the pane that takes the closed pane's space exactly as dragging
it there would move it, without changing which tab that pane shows or which pane carries the
address. A spared tab SHALL NOT count as unsaved work that would make the close ask,
because it is not closed. Where the distribution has switched closing off, every tab counts as one
that cannot be closed, so closing a pane joins all of its tabs to that neighbour.

#### Scenario: Closing the others keeps the target and the pinned ones

- **WHEN** the user closes all tabs but one
- **THEN** that tab and every pinned tab remain

#### Scenario: A tab declared unclosable is never closed in bulk

- **WHEN** a bulk close would include a tab the arrangement declares unclosable
- **THEN** it remains

#### Scenario: Closing a pane hands what cannot close to its neighbour

- **WHEN** the main area is split and the user closes a pane that holds a tab declared unclosable, a
  pinned tab and an ordinary tab
- **THEN** the pane goes and its neighbour takes its space
- **AND** the unclosable tab and the pinned tab are among that neighbour's tabs, and the tab the
  neighbour was showing is still the one it shows
- **AND** the ordinary tab is closed

#### Scenario: Closing the pane carrying the address keeps its fixed tabs

- **WHEN** the pane carrying the address holds a tab declared unclosable and is closed while the area
  is split
- **THEN** the neighbour takes over the address and the unclosable tab is among its tabs

#### Scenario: Undoing a split keeps every tab that cannot close

- **WHEN** the split is undone while panes other than the remaining one hold tabs declared
  unclosable or pinned
- **THEN** those tabs are in the remaining pane afterwards, and only the other tabs are closed

#### Scenario: With closing switched off, closing a pane loses nothing

- **WHEN** the distribution has switched closing off and a pane of a split area is closed
- **THEN** every tab it held is in the pane that takes its space

#### Scenario: Only what really closes is asked about

- **WHEN** a pane is closed that holds unsaved work only in a tab declared unclosable
- **THEN** no question about unsaved work is asked, and that tab keeps its work in the neighbour
