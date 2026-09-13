## ADDED Requirements

### Requirement: A distribution may replace a single settings row in place

A distribution SHALL be able to replace one row of a settings section by supplying a row under the
same identity. The replacement SHALL take the replaced row's place in its section, and the section,
its other rows and their order SHALL stay as they were contributed.

A replacement SHALL be lasting, as a removal is: it applies to a row of that identity whenever a
section carrying one is contributed, including a section contributed again later. A removal of the
same identity SHALL win over a replacement, so that something a distribution removed stays removed.

Replacing what the workbench ships is a distribution's right. A plugin contributes sections of its
own and SHALL NOT be able to replace a row it did not contribute.

#### Scenario: A replaced row keeps its place and its neighbours

- **WHEN** a distribution replaces one row of a section that has several
- **THEN** the replacement is drawn where the replaced row was
- **AND** every other row of that section is drawn as contributed, in the same order

#### Scenario: A replacement outlasts a later contribution of its section

- **WHEN** a section carrying a replaced row is contributed again after the replacement was made
- **THEN** the replacement is drawn in place of the newly contributed row

#### Scenario: A removal wins over a replacement

- **WHEN** a distribution both replaces and removes the same row
- **THEN** the row is not drawn

#### Scenario: A row in Settings and a control in a bar can differ

- **WHEN** a distribution replaces the workbench's language row in Settings with one control and
  the workbench's language item in a bar with another
- **THEN** each place shows the control the distribution supplied for it
