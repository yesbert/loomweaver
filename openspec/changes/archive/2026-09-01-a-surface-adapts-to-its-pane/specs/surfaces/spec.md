## ADDED Requirements

### Requirement: A surface is measured against its pane, not the window

The workbench SHALL offer every host-rendered surface the width of the pane it is mounted in as the
reference an adaptive layout resolves against, under a stable name the surface can refer to. The
surface SHALL NOT have to establish that reference itself, and a surface that establishes one of its
own SHALL keep it.

The reference SHALL follow the surface to every mount point, so a surface moved from the content
area into a sidebar, a split or a pop-out window is measured against wherever it now sits. It SHALL
track the pane as the pane changes, so splitting a pane, dragging a splitter or maximising re-lays
the surface out without it being remounted.

The guarantee holds for a surface the workbench renders. A surface presented as an isolated document
already measures against its own frame, which is the pane, and therefore needs nothing added.

#### Scenario: Splitting a pane re-lays out the surface inside it

- **WHEN** a surface whose layout adapts to available width is shown, and the user splits the pane
  it is in while the window keeps its size
- **THEN** the surface lays itself out for the narrower pane

#### Scenario: The same surface is measured differently in two panes at once

- **WHEN** one surface is shown in a wide pane and a second in a narrow pane beside it
- **THEN** each is laid out for the pane it is in, and neither follows the window

#### Scenario: A surface moved to a sidebar is measured against the sidebar

- **WHEN** the user moves an adaptive surface from the content area into a sidebar
- **THEN** it is measured against the sidebar it now sits in

#### Scenario: A surface that brought its own reference is not overridden

- **WHEN** a surface establishes a sizing reference of its own
- **THEN** its own reference continues to apply to its content
