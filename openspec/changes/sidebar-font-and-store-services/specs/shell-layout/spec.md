## ADDED Requirements

### Requirement: The sidebars are reachable to the distribution

The distribution SHALL be able to do with the sidebars, from its own code, what the sidebar header,
the splitter and the view menu do: collapse a panel, expand it, toggle it, set its width, hide a view
and show a view again, naming the panel by the region id it declared and the view by the id it
registered. Each action SHALL be the same action the control performs, with the same guards and the
same outcome: a width set from code SHALL be brought into the usable range and remembered like a
released drag, and hiding a view SHALL ask about unsaved work exactly as the view menu does. A region
id that names no declared panel SHALL do nothing.

These actions SHALL stay available while the distribution has switched the corresponding sidebar
capabilities off for its users.

#### Scenario: A distribution's own control collapses a panel

- **WHEN** a component the distribution wrote collapses a declared panel
- **THEN** the panel collapses exactly as from its header, and the state survives a restart

#### Scenario: A width set from code is clamped and remembered

- **WHEN** the distribution sets a panel's width to a value outside the usable range
- **THEN** the width is brought into range and remembered as a released drag would be

#### Scenario: Hiding a view from code asks like the menu

- **WHEN** the distribution hides a view whose surface holds unsaved work
- **THEN** the same question is asked that the view menu would ask, and the view is hidden only if
  the answer allows it

#### Scenario: An unknown region does nothing

- **WHEN** the distribution names a region id no declared panel carries
- **THEN** nothing changes

#### Scenario: Reachable while switched off

- **WHEN** the distribution has switched collapsing off and collapses a panel from its own code
- **THEN** the panel collapses, and the user is offered no collapse control

### Requirement: The sidebars are readable as facts

The distribution SHALL be able to read the sidebars as reactive values: the declared panel regions,
whether each is collapsed and how wide it is, and which views are hidden. A reader that depends on
one of these re-evaluates when it changes.

#### Scenario: A distribution's own control follows a collapse

- **WHEN** a distribution binds its own control to whether a panel is collapsed and the user
  collapses it from the header
- **THEN** the control re-renders as collapsed without further wiring

#### Scenario: The hidden views are listed

- **WHEN** the user hides a view from the menu and the distribution reads the hidden views
- **THEN** that view's id is among them, and it is gone once the view is shown again
