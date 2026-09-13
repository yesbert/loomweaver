## MODIFIED Requirements

### Requirement: A panel can be collapsed and resized, and remembers both

The user SHALL be able to collapse a panel and expand it again, and to change its width by dragging
or from the keyboard. Both SHALL survive a restart, the width SHALL be constrained to that panel's
usable range, and an unreadable stored value SHALL be ignored rather than propagated.

Every width the user releases SHALL be remembered as chosen, including a width equal to the panel's
default, so that the choice is kept if the panel's default later changes.

A collapsed panel on a side that has no launcher rail SHALL leave its column entirely, so the
content reaches the edge, and SHALL offer a way back.

#### Scenario: Width changes persist, and mid-drag changes do not

- **WHEN** the user drags a panel's edge
- **THEN** the width follows the pointer
- **AND** only the released width is remembered

#### Scenario: The width can be changed from the keyboard

- **WHEN** the panel's edge has focus
- **THEN** arrow keys change the width, a modifier makes the step coarser, and the extremes are
  directly reachable

#### Scenario: An unusable stored width does not strand the panel

- **WHEN** the stored width is unreadable or outside the panel's usable range
- **THEN** it is ignored or brought back into range

#### Scenario: A chosen width equal to the default outlasts a changed default

- **WHEN** the user releases a panel at exactly its default width
- **AND** the distribution later declares a different default for that panel
- **THEN** the panel opens at the width the user released

#### Scenario: A collapsed rail-less panel gives the space back

- **WHEN** a panel on a side without a launcher rail is collapsed
- **THEN** its column disappears and the content area extends into it
- **AND** a control to expand it again remains reachable

### Requirement: The sidebars are reachable to the distribution

The distribution SHALL be able to do with the sidebars, from its own code, what the sidebar header,
the splitter and the view menu do: collapse a panel, expand it, toggle it, set its width, hide a view
and show a view again, naming the panel by the region id it declared and the view by the id it
registered. Each action SHALL be the same action the control performs, with the same guards and the
same outcome: a width set from code SHALL be brought into that panel's usable range and remembered
like a released drag, and hiding a view SHALL ask about unsaved work exactly as the view menu does. A
region id that names no declared panel SHALL do nothing.

These actions SHALL stay available while the distribution has switched the corresponding sidebar
capabilities off for its users.

#### Scenario: A distribution's own control collapses a panel

- **WHEN** a component the distribution wrote collapses a declared panel
- **THEN** the panel collapses exactly as from its header, and the state survives a restart

#### Scenario: A width set from code is clamped and remembered

- **WHEN** the distribution sets a panel's width to a value outside that panel's usable range
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

## ADDED Requirements

### Requirement: A panel region may declare its own widths

A distribution SHALL be able to declare, for each panel region, the width the panel starts at and
the narrowest and widest the panel may be made. Each of the three SHALL be optional, and one that is
not declared SHALL take the workbench's own value, so that a panel declaring none behaves as every
panel does today.

The declared start width SHALL be what the panel shows until the user resizes it, and what resetting
the application's layout returns it to. The declared bounds SHALL constrain every way the width is
set for that panel: dragging, the keyboard, a width set from code, and a stored width, which is
brought into the current bounds when it is read. The bounds of one panel SHALL NOT affect another.

Widths SHALL be declarable on panel regions only. A declaration whose narrowest width exceeds its
widest, or whose start width lies outside its own bounds after the workbench's values are filled in,
SHALL be refused when the distribution is composed, with a message naming the region.

The declared widths apply where a panel stands beside the content. On a viewport narrow enough for a
panel to be presented as an overlay, the overlay keeps its own width.

#### Scenario: A panel starts at its declared width

- **WHEN** a distribution declares a start width for a panel and the user has never resized it
- **THEN** the panel opens at the declared width

#### Scenario: A panel declaring nothing is unchanged

- **WHEN** a panel region declares no widths
- **THEN** it starts, and may be resized, exactly as a panel does without this declaration

#### Scenario: Declared bounds constrain every way of setting the width

- **WHEN** a panel declares a narrowest and a widest width
- **THEN** dragging, the keyboard's extremes and a width set from code all stay within them

#### Scenario: A width stored under wider bounds is brought into the new ones

- **WHEN** a width was remembered for a panel and the distribution later declares a widest width
  below it
- **THEN** the panel opens at its new widest width

#### Scenario: One panel's bounds leave another's alone

- **WHEN** one panel declares bounds and another declares none
- **THEN** the other panel keeps the workbench's own bounds

#### Scenario: Resetting the layout returns to the declared start width

- **WHEN** the user resets the application's layout
- **THEN** a panel with a declared start width shows that width immediately, without a reload

#### Scenario: Contradictory widths are refused

- **WHEN** a panel region declares a narrowest width above its widest, or a start width outside its
  own bounds
- **THEN** the distribution is refused at composition time with a message naming the region

#### Scenario: A narrow viewport keeps the overlay's width

- **WHEN** the viewport is narrow enough for panels to be overlays
- **THEN** a panel with declared widths is presented at the overlay's own width
