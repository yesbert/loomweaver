## MODIFIED Requirements

### Requirement: A surface may ask to be kept regardless

A declaration MAY ask that its surface always be kept while hidden, or never be. A distribution MAY
change the default for everything it composes, and a surface's own declaration SHALL win over that
default.

Being hidden by a switch of workspace SHALL count as being hidden, so a kept surface parked by such a
switch SHALL be found alive when its workspace is chosen again. Where the surface is an isolated one,
that also means its channel SHALL still be the one it had, so no handshake is repeated and nothing it
was told has to be pushed again.

#### Scenario: A surface that asks to be kept is kept

- **WHEN** a surface whose declaration asks to be kept is hidden
- **THEN** it is not destroyed

#### Scenario: A workspace switch parks a kept surface rather than ending it

- **WHEN** the user switches to another workspace and back, and the first held a surface that asks to
  be kept
- **THEN** that surface is the one that was there, with what the user had done in it intact

#### Scenario: An isolated surface parked by a workspace switch keeps its channel

- **WHEN** an isolated surface that asks to be kept is parked by a workspace switch and shown again
- **THEN** it was neither reloaded nor reconnected

#### Scenario: A distribution's default applies where nothing is declared

- **WHEN** a distribution sets the default and a surface declares nothing
- **THEN** the default applies
- **AND** a surface that declares its own is unaffected
