## ADDED Requirements

### Requirement: A surface standing in several places is brought forward where it was last current

Where a surface a plugin brings forward stands in more than one place, as after the person opened a
sidebar view in the content area, the workbench SHALL make current the copy that was current most
recently. Where none of its copies was ever current, it SHALL choose the copy in the pane that
carries the address, and otherwise the first in reading order: top, left, centre, right, bottom, and
within an area left to right and top to bottom. Recency counts from the start of the session.

#### Scenario: The copy current most recently wins

- **WHEN** a view stands in its sidebar and in the content area, the person last had it current in
  the content area, and a plugin brings it forward
- **THEN** the copy in the content area becomes current, and the sidebar is left as it was

#### Scenario: A copy that is still current wins over one that was current before

- **WHEN** a view is current in its sidebar, its copy in the content area was current earlier and is
  not any more, and a plugin brings it forward
- **THEN** the copy in the sidebar is the one made current

#### Scenario: Without any history the pane carrying the address wins

- **WHEN** neither copy of a view was current in this session, one stands in the pane that carries the
  address, and a plugin brings it forward
- **THEN** that copy becomes current

#### Scenario: Without history and outside the address pane reading order decides

- **WHEN** neither copy of a view was current in this session and neither stands in the pane that
  carries the address
- **THEN** the copy in the left sidebar is chosen over one in the content area
