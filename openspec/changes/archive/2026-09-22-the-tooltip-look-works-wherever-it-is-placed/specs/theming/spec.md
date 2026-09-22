## ADDED Requirements

### Requirement: The tooltip's look is available apart from its placement

The look of the workbench's tooltip SHALL be available as a named class that carries the look and
nothing else, so that a product can give content of its own the tooltip's appearance inside a
container that places it, such as a data grid's own tooltip. Applying the class SHALL NOT move,
layer or detach the element it is applied to, and SHALL NOT stop it receiving the pointer.

A badge placed inside an element carrying that look SHALL take colours that suit it, readable at the
AA contrast ratio in both appearances, without a class of its own. A badge with a tone keeps the fill
of its tone.

The limits of that: the class carries the look, not the behaviour. Showing, hiding, delaying and
placing are the container's, and the workbench's own tooltip element keeps doing them for its own
bubble exactly as before.

#### Scenario: A product's own element takes the tooltip look

- **WHEN** a product applies the tooltip class to an element of its own inside a container that
  places it
- **THEN** the element has the tooltip's background, text colour, radius, padding and shadow
- **AND** it stays where the container put it, in the normal flow

#### Scenario: A badge inside the tooltip look stays readable

- **WHEN** a neutral badge is placed inside an element carrying the tooltip look, in the light and in
  the dark appearance
- **THEN** its text meets the AA contrast ratio against its own background in both

#### Scenario: The workbench's own tooltip is unchanged

- **WHEN** a trigger carrying the workbench's tooltip element is hovered or focused
- **THEN** the tooltip appears above everything, placed as before, and does not take the pointer
