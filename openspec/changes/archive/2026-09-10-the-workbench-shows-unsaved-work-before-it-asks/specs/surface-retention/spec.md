## ADDED Requirements

### Requirement: Unsaved work is visible before it is asked about

Work that is unsaved SHALL be distinguishable on the tab that holds it, so that a user can tell what
is waiting to be saved without closing anything to find out. The distinction SHALL appear wherever a
tab is drawn, in the work area and in a sidebar alike, since a tab is one kind of thing everywhere.

A tab holding an arrangement of other work SHALL be distinguished when anything in that arrangement
is unsaved. The arrangement closes as a unit and the tab is what the user closes, so it is what has
to show what closing would cost.

The distinction SHALL be conveyed to assistive technology as well as drawn, and SHALL NOT rest on
colour alone.

Two limits. Work shown in a window of its own carries no tab strip, so nothing there is marked.
Work whose surface has been released is not unsaved, because a surface holding unsaved work is never
released.

#### Scenario: A tab says that its work is unsaved

- **WHEN** a surface reports that its work is unsaved
- **THEN** its tab is distinguishable from a tab whose work is saved
- **AND** the distinction goes away once the surface reports itself clean again

#### Scenario: An arrangement is marked for what is inside it

- **WHEN** one view inside an arrangement holds unsaved work
- **THEN** the arrangement's own tab is distinguished as well, whether or not that view is the one
  on top

#### Scenario: A sidebar tab is marked like any other

- **WHEN** a view held in a sidebar holds unsaved work
- **THEN** its tab is distinguished exactly as a tab in the work area would be

#### Scenario: The state is announced, not only drawn

- **WHEN** assistive technology reads a tab whose work is unsaved
- **THEN** what it announces includes that the work is unsaved

#### Scenario: Work in a window of its own is not marked

- **WHEN** work is shown in a window of its own
- **THEN** no tab carries it, and nothing is marked

### Requirement: Whether work is unsaved is readable, not only visible

Whether there is unsaved work at an address SHALL be readable as reactive workbench state, so that a
product can mark what the workbench cannot: a row in a list of its own documents, a count beside a
module, an indication in chrome the product drew itself. It SHALL resolve the same way the tab
distinction does, so that an address holding an arrangement answers for everything in it and the two
can never disagree.

An address with nothing open SHALL answer that nothing is unsaved.

#### Scenario: A product's own indication follows the state

- **WHEN** a distribution binds its own indication to whether an address holds unsaved work, and the
  work is then saved
- **THEN** the indication follows, without further wiring

#### Scenario: An address answers for the arrangement it holds

- **WHEN** an address holds an arrangement and one view inside it is unsaved
- **THEN** reading that address answers that there is unsaved work

#### Scenario: Nothing open means nothing unsaved

- **WHEN** an address holds nothing, or held something that has since been released
- **THEN** reading it answers that nothing is unsaved
