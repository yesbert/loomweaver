# gesture-configuration Specification

## Purpose
The platform ships every capability turned on, which is right for a workbench and wrong for a
product built for people who do not want one. A distribution therefore switches gestures off — and
the promise that makes that usable is that switching one off removes every route to it, so a product
never has to discover that a capability it thought it had removed is still reachable by dragging.

## Requirements

### Requirement: A switch takes the affordance and the gesture together

Where a distribution switches a capability off, the workbench SHALL remove every route by which the
user could reach it: the control that offers it, the menu entry that names it, the drag target that
performs it and the keyboard shortcut that triggers it. A capability MUST NOT remain reachable to
the user by any route once switched off.

A switch removes the user's routes, not the capability. The distribution that switched a capability
off SHALL still be able to perform it from its own code, so that it can offer the capability again in
its own place and its own shape. The switch is a decision about what the user is shown, and the
distribution cannot be surprised by a route it took itself.

#### Scenario: A switched-off capability has no remaining route

- **WHEN** a distribution switches a capability off
- **THEN** its button, its menu entry, its drop target and its shortcut are all gone, and no route
  the user can take reaches it

#### Scenario: The distribution still reaches what it switched off

- **WHEN** a distribution has switched a capability off and performs it from its own code
- **THEN** the capability is performed as it would have been from the control that is gone

### Requirement: Everything is on unless the product says otherwise

The workbench SHALL offer its full set of capabilities by default, and a distribution SHALL name
only what it switches off. Naming part of a group SHALL leave the rest of that group alone.

What a distribution declares when it composes the application is the starting value of each switch,
not a constant: a switch that was declared off can be turned on later, and one that was left on can
be turned off, while the application runs.

#### Scenario: A distribution that says nothing gets the full workbench

- **WHEN** a distribution names no switches
- **THEN** every capability is available

#### Scenario: Naming one switch does not disturb its neighbours

- **WHEN** a distribution switches off one capability within a group
- **THEN** the other capabilities in that group remain

#### Scenario: The declaration is where a switch starts

- **WHEN** the application starts with a declaration that switches a capability off
- **THEN** that capability is off until the distribution changes it, and every other capability is on

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

### Requirement: A switch can be changed while the application runs

The distribution SHALL be able to change any switch while the application runs, naming only what
changes, in the same shape and with the same names it uses to declare switches at composition. The
current value of every switch SHALL be readable by the distribution as reactive state, and a change
SHALL be visible to every reader at once.

#### Scenario: A switch is turned off at runtime

- **WHEN** the distribution turns a capability off while the application runs
- **THEN** reading that switch answers off, and every other switch answers what it answered before

#### Scenario: A switch is turned back on at runtime

- **WHEN** the distribution turns a capability on that its declaration had switched off
- **THEN** reading that switch answers on

#### Scenario: A change is visible where it is read

- **WHEN** the distribution changes a switch
- **THEN** a reader that depends on that switch re-evaluates without being asked to

### Requirement: The affordances follow the switch live

Every route a switch governs SHALL follow the switch while the application runs: turning a capability
off removes its control, its menu entry, its drop target and its shortcut without a restart, and
turning it on brings them back. No control SHALL advertise a capability whose switch is off, and no
switch that is on SHALL leave its control missing because the switch was read only once.

#### Scenario: A control disappears when its switch is turned off

- **WHEN** a capability is on, its control is shown, and the distribution turns the capability off
- **THEN** the control, the menu entry, the drop target and the shortcut are gone without a restart

#### Scenario: A control reappears when its switch is turned on

- **WHEN** a capability is off and the distribution turns it on
- **THEN** its control, its menu entry, its drop target and its shortcut are offered again

#### Scenario: A built-in command follows its switch

- **WHEN** a capability that the workbench offers as a built-in command is turned off at runtime
- **THEN** the command is no longer found by searching and its shortcut no longer triggers it
- **AND** turning the capability on makes it findable and bound again

### Requirement: Switching off acts forward, not backward

Turning a capability off SHALL remove the routes to it from that moment on and SHALL NOT undo what
the user built with it. A pane that was split stays split, a window that was detached stays
detached, a sidebar that was collapsed stays collapsed, a tab that was pinned stays pinned. The
workbench does not tidy up after a switch; it only stops offering the way.

Because the switch does not change state, a capability that toggles between two positions and is
switched off while in the less convenient one leaves the user there with no way back. The
distribution puts the state where it wants it before it takes the way away; the workbench SHALL NOT
do that on its behalf.

#### Scenario: What was built stays when the way is removed

- **WHEN** the user has split a pane and the distribution turns splitting off
- **THEN** the pane stays split, and the split controls, drop edges and shortcut are gone

#### Scenario: A collapsed sidebar stays collapsed

- **WHEN** a sidebar is collapsed and the distribution turns collapsing off
- **THEN** the sidebar stays collapsed and offers no control to expand it

### Requirement: The workbench does not remember a switch

A switch changed at runtime SHALL hold for the running session only. The workbench SHALL NOT write
switch values to any store, and on the next start every switch SHALL be what the declaration says.
Whether a change made at runtime survives, and for which device, user or tenant, is the
distribution's decision, made with its own means.

#### Scenario: The next start begins from the declaration

- **WHEN** the distribution changed a switch at runtime and the application is started again
- **THEN** the switch is what the declaration says, not what it was changed to

#### Scenario: Nothing about a switch reaches a store

- **WHEN** the distribution changes a switch at runtime
- **THEN** no persistence port receives a write on that account
