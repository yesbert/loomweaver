# gesture-configuration Specification

## Purpose
The platform ships every capability turned on, which is right for a workbench and wrong for a
product built for people who do not want one. A distribution therefore switches gestures off — and
the promise that makes that usable is that switching one off removes every route to it, so a product
never has to discover that a capability it thought it had removed is still reachable by dragging.

## Requirements

### Requirement: A switch takes the affordance and the gesture together

Where a distribution switches a capability off, the workbench SHALL remove every route to it: the
control that offers it, the menu entry that names it, the drag target that performs it and the
keyboard shortcut that triggers it. A capability MUST NOT remain reachable by any route once
switched off.

#### Scenario: A switched-off capability has no remaining route

- **WHEN** a distribution switches a capability off
- **THEN** its button, its menu entry, its drop target and its shortcut are all gone

### Requirement: Everything is on unless the product says otherwise

The workbench SHALL offer its full set of capabilities by default, and a distribution SHALL name
only what it switches off. Naming part of a group SHALL leave the rest of that group alone.

#### Scenario: A distribution that says nothing gets the full workbench

- **WHEN** a distribution names no switches
- **THEN** every capability is available

#### Scenario: Naming one switch does not disturb its neighbours

- **WHEN** a distribution switches off one capability within a group
- **THEN** the other capabilities in that group remain

### Requirement: The switches cover the gestures, and only the gestures

The switchable set SHALL cover the user-facing gestures of the content area, the sidebars, the
launcher, workspaces, detached windows and the command layer. It SHALL NOT be the mechanism for
removing an individual contribution — a command, an item, a settings row or a menu entry — which has
its own.

#### Scenario: A contribution is removed by naming it, not by a switch

- **WHEN** a distribution wants a single contributed item gone
- **THEN** it names that item for removal rather than switching a gesture off

#### Scenario: Where both could apply, the switch wins

- **WHEN** a capability has both a gesture and a menu entry, and the gesture is switched off
- **THEN** the menu entry goes with it

### Requirement: A named contribution can be removed, and stays removed

A distribution SHALL be able to remove any contribution by naming its identity, and the removal
SHALL be lasting: something registering under that identity afterwards SHALL stay removed. Because
identities may collide across kinds, a removal MAY name the kind it means through a prefix, and a
bare identity SHALL NOT reach a kind that requires one.

#### Scenario: Removal outlasts a later registration

- **WHEN** a plugin registers a contribution whose identity the distribution removed
- **THEN** it does not appear

#### Scenario: Two kinds sharing an identity are told apart

- **WHEN** a command and an addressable surface share an identity and the bare identity is removed
- **THEN** only the command goes

### Requirement: Switching off the shortcut layer removes the promises too

Where a distribution switches keyboard shortcuts off, the workbench SHALL neither bind them nor
display them anywhere, so that nothing advertises a key that does nothing. Commands SHALL remain
reachable by their controls and by search.

#### Scenario: No key is bound and none is advertised

- **WHEN** shortcuts are switched off
- **THEN** no chord triggers a command and no hint shows one

### Requirement: Switching off a concept leaves what depends on it intact

Switching a concept off SHALL remove the user's contact with it, not the machinery underneath. In
particular, switching off named workspaces SHALL remove the commands and entries that expose them
while leaving what is stored per workspace working, so that nothing else breaks.

#### Scenario: Removing workspaces does not break storage

- **WHEN** a distribution switches workspaces off
- **THEN** the user never meets the concept
- **AND** the arrangement is still stored and restored correctly

### Requirement: There are no bundles of switches

The workbench SHALL NOT offer preset combinations of switches. A distribution names what it switches
off, one capability at a time.

#### Scenario: A product states its own choices

- **WHEN** a distribution wants a reduced workbench
- **THEN** it names each capability it switches off rather than selecting a preset
