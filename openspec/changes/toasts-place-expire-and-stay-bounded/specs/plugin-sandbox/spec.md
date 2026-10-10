## ADDED Requirements

### Requirement: An isolated plugin's notices are bounded in number and in time

A notice raised by an isolated plugin SHALL always leave by itself. A statement that the notice
stays SHALL NOT cross the boundary, a lifetime longer than a bound the workbench sets SHALL be
shortened to it, and a notice of the error kind SHALL leave after that bound rather than stay.

An isolated plugin SHALL hold no more than a bounded number of notices at once, counting those
shown and those waiting to be shown. A notice raised beyond that SHALL be refused and reported to
the developer as any other refused call is, and the notices the plugin already holds SHALL be left
as they are. A repeat that is counted on an existing notice is not a further notice.

Together the two bounds mean that an isolated plugin cannot keep the workbench's own notices, or
another plugin's, from being shown for longer than the bound on a lifetime.

The symbol a notice names SHALL cross as a name and be resolved by the workbench. An action a
notice offers is a function, and does not cross.

This is verified for a plugin running in a sandboxed frame. A plugin composed into the page is not
bounded this way.

#### Scenario: A notice meant to stay still leaves

- **WHEN** an isolated plugin raises a notice and states that it stays
- **THEN** the notice is shown and leaves by itself

#### Scenario: An isolated plugin's failure leaves too

- **WHEN** an isolated plugin raises a notice of the error kind without a lifetime
- **THEN** the notice leaves by itself, after the longest lifetime an isolated plugin may have

#### Scenario: A lifetime beyond the bound is shortened

- **WHEN** an isolated plugin states a lifetime longer than the bound
- **THEN** the notice leaves when the bound is reached

#### Scenario: A plugin cannot fill the line

- **WHEN** an isolated plugin raises a notice while it already holds the bounded number
- **THEN** the further notice is refused and the developer is told
- **AND** the notices it already holds are unchanged

#### Scenario: The workbench's own notice is not kept waiting indefinitely

- **WHEN** an isolated plugin keeps raising notices and the workbench raises one of its own
- **THEN** the workbench's notice is shown no later than the plugin's notices before it have left
