## MODIFIED Requirements

### Requirement: Open work is searchable in its own mode

The workbench SHALL offer a second search over open work, distinct from the command search and
reached by its own gesture. It SHALL list what is open, most recently active first, and choosing one
SHALL reveal it where it is. It SHALL offer the actions of a piece of open work without leaving the
search.

#### Scenario: The two searches do not mix

- **WHEN** the user opens the command search
- **THEN** it lists commands and not open work

#### Scenario: Open work is listed by recency

- **WHEN** the user opens the search over open work
- **THEN** the most recently active is first

#### Scenario: Actions are reachable without leaving

- **WHEN** the user asks for the actions of a highlighted piece of open work
- **THEN** its menu opens at that row

#### Scenario: An action chosen in the search acts where the work stands

- **WHEN** the user opens the actions of open work held by a pane that does not carry the address,
  and chooses to close it, to pin it or to close what lies to its right
- **THEN** that happens in the pane that holds it, as from that pane's own tab menu
- **AND** the tabs of the address-carrying pane are untouched, and closing the work runs its owner's
  teardown once
