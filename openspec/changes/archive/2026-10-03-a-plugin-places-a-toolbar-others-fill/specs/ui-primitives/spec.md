## MODIFIED Requirements

### Requirement: A row that cannot work is not drawn

A row whose action nothing registers SHALL be dropped rather than drawn as a control that does
nothing, and a section left empty by that SHALL be dropped with it. A row whose action the current
session may not run SHALL be dropped the same way, and SHALL appear once the session qualifies,
so that the settings surface follows the session as every other place that shows a contribution
does.

#### Scenario: A row pointing at nothing disappears

- **WHEN** a row names an action that nothing registers, or that a removal took away
- **THEN** the row is not drawn, and its section goes with it if nothing else remains

#### Scenario: A row pointing at an action the session may not run disappears

- **WHEN** a row names an action whose requirement the session does not meet
- **THEN** the row is not drawn, and its section goes with it if nothing else remains
- **AND** both return once the session meets the requirement, without a reload
