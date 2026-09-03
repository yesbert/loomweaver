## ADDED Requirements

### Requirement: The text size is reachable to the distribution

The distribution SHALL be able to read the current text size as a reactive value and to set it from
its own code, choosing among the sizes the workbench offers. A size set from code SHALL be
remembered and applied exactly as one chosen from the built-in control, and the default SHALL
impose nothing, as for the user's own choice.

#### Scenario: A distribution's own control sets the size

- **WHEN** a component the distribution wrote sets a size the workbench offers
- **THEN** the interface takes that size, the choice survives a restart, and the built-in control
  shows it

#### Scenario: The fact follows the user

- **WHEN** a distribution binds its own control to the current size and the user changes it in the
  settings
- **THEN** the control re-renders with the new size without further wiring
