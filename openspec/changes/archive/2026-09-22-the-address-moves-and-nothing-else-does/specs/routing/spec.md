## ADDED Requirements

### Requirement: A surface reads its address the same way in every pane

A surface SHALL be able to read the address it is shown at — its values, its sub-address or owned
remainder, its query and its fragment — in whichever pane it is shown, and SHALL be told when any of
it changes. While the surface's pane carries the address, what it reads SHALL follow the address
bar; while it does not, it SHALL be the address of the tab the pane shows. A surface SHALL be able to
tell which of the two holds, and SHALL be told when that changes.

Moving between sub-addresses, or within an owned remainder, of the same tab SHALL reach the surface
without rebuilding it. An address with different values is different content and SHALL be shown by a
new instance, as it is today.

The limits of that: this is what a surface rendered by the workbench reads. A surface that runs
isolated receives the same over its channel, as before. Pages a distribution owns are not surfaces
and are unaffected.

#### Scenario: A sub-address reaches the surface without a rebuild

- **WHEN** a surface in the pane carrying the address moves to another of its sub-addresses
- **THEN** it is told the new sub-address, and it is the same instance as before

#### Scenario: A surface in another pane reads its own tab's address

- **WHEN** a surface is shown in a pane that does not carry the address
- **THEN** what it reads is the address of the tab that pane shows, and it is told it does not carry
  the address

#### Scenario: Gaining the address is announced to the surface

- **WHEN** the address moves into the pane showing a surface
- **THEN** the surface is told that its pane now carries the address, and from then on follows the
  address bar, including the query and the fragment

#### Scenario: Different values mean a new instance

- **WHEN** navigation changes the values of the address a surface is shown at
- **THEN** a new instance shows the new values
