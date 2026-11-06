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

## MODIFIED Requirements

### Requirement: A surface brought to the front is put in view

The workbench SHALL put a surface brought to the front in view: a collapsed side panel SHALL be
expanded, and on a window narrow enough for side panels to be overlays the panel's overlay SHALL be
opened. This SHALL hold whether or not the panel has been drawn in the session, so a surface
declared for a panel is found there before the person has ever opened it. A minimised pane SHALL be
restored, and another pane's maximise SHALL end.

#### Scenario: A collapsed panel is expanded

- **WHEN** a plugin brings forward a surface in a side panel the person has collapsed
- **THEN** the panel is expanded and shows that surface

#### Scenario: A narrow window opens the panel's overlay

- **WHEN** a plugin brings forward a surface in a side panel while the window is narrow enough for
  side panels to be overlays
- **THEN** the panel's overlay opens and shows that surface

#### Scenario: A panel not yet drawn still finds its surface

- **WHEN** a plugin brings forward a surface declared for a side panel in a session in which that
  panel has never been drawn, as on a narrow window before its overlay was first opened
- **THEN** the panel comes into view showing that surface

#### Scenario: A minimised pane is restored

- **WHEN** a plugin brings forward a surface whose only copy stands in a content pane the person has
  minimised, or in a pane while another pane is maximised
- **THEN** that pane is restored and shows the surface
