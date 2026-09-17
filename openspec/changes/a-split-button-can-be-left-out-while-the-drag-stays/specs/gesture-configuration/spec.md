## MODIFIED Requirements

### Requirement: A switch takes the affordance and the gesture together

Where a distribution switches a capability off, the workbench SHALL remove every route by which the
user could reach it: the control that offers it, the menu entry that names it, the drag target that
performs it and the keyboard shortcut that triggers it. A capability MUST NOT remain reachable to
the user by any route once switched off.

A switch removes the user's routes, not the capability. The distribution that switched a capability
off SHALL still be able to perform it from its own code, so that it can offer the capability again in
its own place and its own shape. The switch is a decision about what the user is shown, and the
distribution cannot be surprised by a route it took itself.

Where the workbench offers a capability through a route that has no handle of its own — chrome the
workbench draws rather than a contribution a distribution could hide by naming it — the distribution
SHALL be able to declare that capability in a finer form which leaves that one route out while the
capability and its other routes stay. The finer form SHALL name only such routes: a route a
distribution can already remove by naming the contribution behind it SHALL NOT be given a second
handle here, so that each decision has one place. Declaring a capability off SHALL keep its plain
meaning, whichever form is used, and remove every route including the finer one.

#### Scenario: A switched-off capability has no remaining route

- **WHEN** a distribution switches a capability off
- **THEN** its button, its menu entry, its drop target and its shortcut are all gone, and no route
  the user can take reaches it

#### Scenario: The distribution still reaches what it switched off

- **WHEN** a distribution has switched a capability off and performs it from its own code
- **THEN** the capability is performed as it would have been from the control that is gone

#### Scenario: A capability is offered by dragging alone

- **WHEN** a distribution declares splitting in the finer form, leaving out the button the pane
  toolbar draws
- **THEN** no split button is drawn in any pane toolbar
- **AND** dragging a tab to a pane's edge still splits, and the shortcut and the menu entry still
  reach it

#### Scenario: The finer form does not weaken switching off

- **WHEN** a distribution switches splitting off
- **THEN** the toolbar button, the drop edges, the shortcut and the menu entry are all gone,
  whichever form the declaration used
