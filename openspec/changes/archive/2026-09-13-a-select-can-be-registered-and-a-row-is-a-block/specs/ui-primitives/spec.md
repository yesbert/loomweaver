## MODIFIED Requirements

### Requirement: The workbench's controls are usable from any technology

The workbench SHALL offer its visual vocabulary as elements usable by tag from any technology, and
as named style classes for controls that already exist natively. A plugin SHALL be able to use them
without depending on the workbench's own framework, including from a surface running isolated from
it.

Every element the workbench offers by tag SHALL be registrable by whoever renders it, from the
published surface, and not only by a running workbench. An element nobody registered draws nothing
and raises no error, so an element that cannot be registered outside the workbench fails its
consumer's tests without saying so. This holds for host-rendered content; an isolated surface
receives the elements from the workbench and registers nothing itself.

#### Scenario: A plugin uses a workbench control by tag

- **WHEN** a plugin's own content uses one of the workbench's elements by tag
- **THEN** it renders and behaves as it does in the workbench's own chrome

#### Scenario: An isolated surface uses them too

- **WHEN** a surface running isolated from the workbench uses the same elements
- **THEN** they render and behave the same, and take the workbench's current appearance

#### Scenario: A native control is styled rather than wrapped

- **WHEN** a plugin needs a control the browser already provides
- **THEN** the workbench offers a style class for it rather than an element that reimplements it

#### Scenario: Content using an element renders without a running workbench

- **WHEN** content that uses any element the workbench offers by tag is rendered without a running
  workbench, as under a unit test
- **AND** the consumer registers that element from the published surface
- **THEN** the element is drawn

## ADDED Requirements

### Requirement: A settings row takes a line of its own

A settings row SHALL occupy a line of its own, so that whatever holds a stack of rows can separate,
frame or space them by their edges. The row SHALL draw no separator itself; separating rows stays the
container's decision.

#### Scenario: A container's separators between rows are drawn

- **WHEN** a container draws a line between each of its settings rows
- **THEN** the line is visible between every pair of rows

#### Scenario: The workbench's own settings surface separates its rows

- **WHEN** the settings surface shows a section with more than one row
- **THEN** a line is drawn between each pair of rows
