## MODIFIED Requirements

### Requirement: Exactly one pane carries the address, and the pointer moves, not the pane

Exactly one pane at a time SHALL be the one whose content the address bar reflects, so that deep
links, browser history and reloads keep working. Which pane that is SHALL be recorded as a pointer
to a pane, and focusing another pane SHALL move the pointer rather than renaming or rebuilding
anything.

A pane SHALL keep its identity for as long as it exists, so that what is keyed to a pane — retained
work, stored state — is never orphaned by a change of focus.

Moving the pointer SHALL leave every surface where it is drawn: no surface SHALL be moved in the
page, rebuilt or restarted because its pane gained or lost the address, whether or not the surface is
kept. An interaction the user began inside a pane — a press that becomes a click, a field that took
focus — SHALL complete, even when that same interaction moved the address.

#### Scenario: Focusing another pane moves the address to it

- **WHEN** the user focuses a pane that is not carrying the address
- **THEN** the address follows to what that pane is showing

#### Scenario: A change of focus does not disturb the panes

- **WHEN** focus moves between panes repeatedly
- **THEN** every pane keeps its identity, its items and which of them it was showing

#### Scenario: The pane that gives up the address keeps what it was showing

- **WHEN** a pane stops carrying the address
- **THEN** it continues to show the same item, rather than falling back to another

#### Scenario: The pointer survives a restart, and heals if it cannot

- **WHEN** the application restarts
- **THEN** the same pane carries the address
- **AND** if that pane no longer exists, another takes it over rather than the arrangement failing

#### Scenario: A click that moves the address still lands

- **WHEN** the content area is split, the address is in one pane, and the user presses and releases
  the button on a control in the other pane, holding it as a person does
- **THEN** the control receives the click, once
- **AND** the address moves to the pane the control is in, unless the click itself sent it elsewhere

#### Scenario: A surface is not rebuilt when its pane gains or loses the address

- **WHEN** a pane shows a surface that is not kept, and the address moves into that pane and out of it
  again
- **THEN** it is the same instance throughout, with its scroll position, its entries and its
  selection as the user left them
- **AND** its element stays where it was in the page

#### Scenario: A field focused by the click keeps its focus

- **WHEN** the user clicks into a text field in a pane that does not carry the address
- **THEN** the field has focus afterwards and takes what is typed next
