## MODIFIED Requirements

### Requirement: A panel region may declare its own widths

A distribution SHALL be able to declare, for each panel region, the width the panel starts at and
the narrowest and widest the panel may be made. Each of the three SHALL be optional, and one that is
not declared SHALL take the workbench's own value, so that a panel declaring none behaves as every
panel does today.

The declared start width SHALL be what the panel shows until the user resizes it, and what resetting
the application's layout returns it to. The declared bounds SHALL constrain every way the width is
set for that panel: dragging, the keyboard, a width set from code, and a stored width, which is
brought into the current bounds when it is read. The bounds of one panel SHALL NOT affect another.

Widths SHALL be declarable on panel regions only. A declared width that is not a positive number, a
declaration whose narrowest width exceeds its widest, or one whose start width lies outside its own
bounds after the workbench's values are filled in, SHALL be refused when the distribution is composed,
with a message naming the region.

The declared start width and bounds apply where a panel stands beside the content. On a viewport
narrow enough for a panel to be presented as an overlay, the overlay SHALL take the overlay width the
panel region declares, and the workbench's own overlay width where it declares none. The overlay width
SHALL never exceed the viewport's width less a margin that leaves room to dismiss the overlay beside
it. It is not resized by the user, not stored, and not changed by a width set from code, and the widths
beside the content SHALL NOT reach the overlay. A declared overlay width that is not a positive number
SHALL be refused when the distribution is composed, with a message naming the region.

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

#### Scenario: A width beside the content that is not a positive number is refused

- **WHEN** a panel region declares a start, narrowest or widest width of zero, a negative number or
  something not finite
- **THEN** the distribution is refused at composition time with a message naming the region

#### Scenario: A narrow viewport keeps the overlay's width

- **WHEN** the viewport is narrow enough for panels to be overlays
- **AND** a panel region declares no overlay width
- **THEN** the panel is presented at the workbench's own overlay width, whatever widths it declares
  beside the content

#### Scenario: A declared overlay width is used on a narrow viewport

- **WHEN** the viewport is narrow enough for panels to be overlays
- **AND** a panel region declares an overlay width that fits the viewport
- **THEN** the panel is presented as an overlay of that width

#### Scenario: An overlay never runs off the screen

- **WHEN** a panel region declares an overlay width wider than the viewport allows
- **THEN** the overlay is as wide as the viewport less the margin, and room to dismiss it remains

#### Scenario: The widths beside the content do not reach the overlay

- **WHEN** a panel was resized beside the content, or given a width from code
- **AND** the viewport becomes narrow enough for panels to be overlays
- **THEN** the overlay takes its declared or the workbench's overlay width, not that width

#### Scenario: An overlay width that is not a positive number is refused

- **WHEN** a panel region declares an overlay width of zero, a negative number or something not finite
- **THEN** the distribution is refused at composition time with a message naming the region
