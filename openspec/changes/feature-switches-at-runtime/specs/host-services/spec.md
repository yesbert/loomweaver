## Purpose

States what a distribution may rely on when it drives the workbench it composed through the services
it injects: that the surface is published, that it is the same code as the controls, that workbench
facts are readable as reactive state, and where the surface ends. A plugin is not a distribution and
reaches the workbench through its own context.

## ADDED Requirements

### Requirement: A distribution drives the workbench through the services it composed with

A distribution SHALL be able to reach the workbench it composed from its own code: its composition
root, its own components and pages. The services it may rely on for that SHALL be part of the
published contract and listed in the consumer documentation, so that a distribution never has to
guess which of the workbench's internals it may hold on to. A service that is not published is not
part of this surface, whatever a source tree exports.

#### Scenario: A distribution's own component acts on the workbench

- **WHEN** a component the distribution wrote asks the workbench to open a tab, run a command or
  change a switch
- **THEN** the workbench does it, the same as if the user had used the built-in control

#### Scenario: What the distribution may hold on to is written down

- **WHEN** a service is published for distributions
- **THEN** it appears in the consumer documentation, and a published name documented nowhere is a
  defect

### Requirement: A control and its programmatic counterpart are one action

What a built-in control does and what the distribution does through the service behind it SHALL be
the same action: the same behaviour, the same guards, the same outcome. A guard that protects the
user from losing work when they use the control SHALL protect them equally when the distribution
performs the same action from its own code. The distribution SHALL NOT be able to reach a
second, unguarded version of a behaviour the workbench offers through a control.

#### Scenario: Closing through the service asks like closing through the control

- **WHEN** a tab holds unsaved work and the distribution closes it through the service
- **THEN** the same question about unsaved work is asked that the built-in close control would ask

#### Scenario: A built-in control and the service agree

- **WHEN** a behaviour is offered both as a built-in control and as a service
- **THEN** using either produces the same result, and a change to the behaviour reaches both

### Requirement: A switched-off capability stays reachable to the distribution

A capability the distribution switched off SHALL remain available to the distribution's own code
through the service that carries it, so that the distribution can offer it again in its own place.
The switch governs what the user is shown; it does not govern what the distribution may do.

#### Scenario: The service works while the control is gone

- **WHEN** the distribution has switched a capability off and calls the service that performs it
- **THEN** the capability is performed, and no control for it is shown to the user

### Requirement: Workbench facts are readable as reactive state

A fact about the workbench that a distribution may read SHALL be exposed as a reactive value: reading
it answers the current state, and a reader that depends on it re-evaluates when the fact changes,
without polling and without parsing anything the workbench renders. What the distribution needs the
moment of a change for, it takes from the fact changing; a fact does not come with a separate
notification saying the same thing.

#### Scenario: A distribution's own control follows a workbench fact

- **WHEN** a distribution binds its own control to a workbench fact and the fact changes
- **THEN** the control re-renders with the new value without further wiring

#### Scenario: The current value is the answer

- **WHEN** a distribution reads a workbench fact
- **THEN** it receives what is true now, not what was true at composition

### Requirement: The current switches are among the facts

The current value of every switch SHALL be readable as a workbench fact, under the same names the
distribution uses to declare and to change switches. At start the facts equal the declaration; after
a change at runtime they equal the change.

#### Scenario: The switch reads back what was declared

- **WHEN** the application starts with a declaration and the distribution reads a switch
- **THEN** it reads what the declaration said for that switch

#### Scenario: The switch reads back what was changed

- **WHEN** the distribution changes a switch at runtime and reads it
- **THEN** it reads the changed value

### Requirement: This surface is the distribution's, not a plugin's

The services a distribution injects SHALL NOT be offered to a plugin. A plugin reaches the workbench
through its own context, subject to the capabilities it was granted, and that indirection is what
lets the same plugin run in a sandbox. A plugin that could reach the distribution's surface would
bypass every grant. Whether and how a plugin may reach what this surface offers is a separate
question with its own answer; nothing here answers it.

#### Scenario: A sandboxed plugin has no path to the services

- **WHEN** a plugin runs in a sandbox
- **THEN** it has no way to reach the services a distribution injects, and its own context is the
  only workbench it sees

#### Scenario: A trusted plugin is expected to use its context

- **WHEN** a plugin runs in the application's own process
- **THEN** the documented way for it to reach the workbench is its context, and the services are
  not part of what it may rely on
